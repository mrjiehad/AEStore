import { Hono } from 'hono';
import { CloudflareBindings, Order } from '../types';
import { z } from 'zod';
import { ToyyibPayGateway } from '../lib/gateway/toyyibpay';
import { generateOrderNumber } from '../lib/crypto';

export const checkoutRoutes = new Hono<{ Bindings: CloudflareBindings }>();

const checkoutSchema = z.object({
  email: z.string().email(),
  items: z.array(z.object({
    product_id: z.number(),
    quantity: z.number().min(1).max(10)
  })).min(1),
  terms_accepted: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms and conditions'
  })
});

// POST /api/checkout - Process checkout
checkoutRoutes.post('/', async (c) => {
  try {
    const { DB, TOYYIBPAY_API_URL, TOYYIBPAY_SECRET_KEY, TOYYIBPAY_CATEGORY_CODE, APP_URL, KV } = c.env;
    const body = await c.req.json();
    
    // Validate request
    const validation = checkoutSchema.safeParse(body);
    if (!validation.success) {
      return c.json({ 
        success: false, 
        error: validation.error.errors[0]?.message || 'Invalid request' 
      }, 400);
    }
    
    const { email, items } = validation.data;
    
    // Rate limiting check
    const rateLimitKey = `checkout:${email}`;
    const rateLimitCount = await KV.get(rateLimitKey);
    if (rateLimitCount && parseInt(rateLimitCount) > 5) {
      return c.json({
        success: false,
        error: 'Too many checkout attempts. Please try again later.'
      }, 429);
    }
    
    // Update rate limit
    await KV.put(rateLimitKey, (parseInt(rateLimitCount || '0') + 1).toString(), {
      expirationTtl: 3600 // 1 hour
    });
    
    // For now, we'll process only the first item (single product checkout)
    const item = items[0];
    
    // Verify product and stock
    const product = await DB.prepare(`
      SELECT * FROM products WHERE id = ? AND is_active = 1
    `).bind(item.product_id).first();
    
    if (!product) {
      return c.json({ 
        success: false, 
        error: 'Product not found' 
      }, 404);
    }
    
    // Check stock
    const stockResult = await DB.prepare(`
      SELECT COUNT(*) as available
      FROM coupon_codes
      WHERE product_id = ? AND is_used = 0
    `).bind(item.product_id).first();
    
    if (!stockResult || stockResult.available < item.quantity) {
      return c.json({
        success: false,
        error: 'Insufficient stock available'
      }, 400);
    }
    
    // Calculate total
    const subtotal = product.price_now * item.quantity;
    
    // Create order
    const orderNumber = generateOrderNumber();
    
    const orderResult = await DB.prepare(`
      INSERT INTO orders (
        order_number, email, product_id, quantity, 
        subtotal, gateway, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      orderNumber,
      email,
      item.product_id,
      item.quantity,
      subtotal,
      'toyyibpay',
      'pending'
    ).run();
    
    const orderId = orderResult.meta.last_row_id;
    
    // Log order creation event
    await DB.prepare(`
      INSERT INTO order_events (order_id, type, payload, created_at)
      VALUES (?, ?, ?, datetime('now'))
    `).bind(
      orderId,
      'created',
      JSON.stringify({ email, items, subtotal })
    ).run();
    
    // Create payment gateway bill
    const gateway = new ToyyibPayGateway(
      TOYYIBPAY_API_URL || 'https://toyyibpay.com/index.php/api',
      TOYYIBPAY_SECRET_KEY,
      TOYYIBPAY_CATEGORY_CODE
    );
    
    const returnUrl = `${APP_URL}/success?order=${orderNumber}`;
    const callbackUrl = `${APP_URL}/api/webhook/toyyibpay`;
    
    try {
      const order = {
        id: orderId,
        order_number: orderNumber,
        email,
        product_id: item.product_id,
        quantity: item.quantity,
        subtotal
      } as Order;
      
      const { billCode, paymentUrl } = await gateway.createBill(
        order,
        returnUrl,
        callbackUrl
      );
      
      // Update order with payment info
      await DB.prepare(`
        UPDATE orders 
        SET gateway_bill_code = ?, payment_url = ?, updated_at = datetime('now')
        WHERE id = ?
      `).bind(billCode, paymentUrl, orderId).run();
      
      // Log payment initiated event
      await DB.prepare(`
        INSERT INTO order_events (order_id, type, payload, created_at)
        VALUES (?, ?, ?, datetime('now'))
      `).bind(
        orderId,
        'payment_initiated',
        JSON.stringify({ billCode, paymentUrl })
      ).run();
      
      return c.json({
        success: true,
        data: {
          order_number: orderNumber,
          payment_url: paymentUrl,
          total: subtotal
        }
      });
      
    } catch (gatewayError: any) {
      // Update order status to failed
      await DB.prepare(`
        UPDATE orders 
        SET status = 'failed', updated_at = datetime('now')
        WHERE id = ?
      `).bind(orderId).run();
      
      // Log payment failed event
      await DB.prepare(`
        INSERT INTO order_events (order_id, type, payload, created_at)
        VALUES (?, ?, ?, datetime('now'))
      `).bind(
        orderId,
        'payment_failed',
        JSON.stringify({ error: gatewayError.message })
      ).run();
      
      return c.json({
        success: false,
        error: 'Failed to create payment. Please try again.'
      }, 500);
    }
    
  } catch (error) {
    console.error('Checkout error:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to process checkout' 
    }, 500);
  }
});