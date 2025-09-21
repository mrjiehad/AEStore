import { Hono } from 'hono';
import { CloudflareBindings, Order } from '../types';
import { z } from 'zod';
import { ToyyibPayGateway } from '../lib/gateway/toyyibpay';
import { initBillplzGateway } from '../lib/gateway/billplz';
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
  }),
  payment_method: z.enum(['billplz', 'toyyibpay']).optional().default('billplz')
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
    
    const { email, items, payment_method } = validation.data;
    
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
    
    // Determine which gateway to use based on user selection and configuration
    const hasBillplz = c.env.BILLPLZ_API_KEY && c.env.BILLPLZ_COLLECTION_ID;
    const hasToyyibPay = c.env.TOYYIBPAY_SECRET_KEY && c.env.TOYYIBPAY_CATEGORY_CODE;
    
    // Use selected payment method if available, otherwise fallback
    let useGateway = payment_method;
    if (payment_method === 'billplz' && !hasBillplz) {
      useGateway = 'toyyibpay'; // Fallback to ToyyibPay if Billplz not configured
    } else if (payment_method === 'toyyibpay' && !hasToyyibPay) {
      useGateway = 'billplz'; // Fallback to Billplz if ToyyibPay not configured
    }
    
    const useBillplz = useGateway === 'billplz' && hasBillplz;
    
    let paymentUrl: string;
    let billCode: string;
    let gatewayUsed: string = 'billplz';
    
    if (useBillplz) {
      // Use Billplz as primary gateway
      try {
        const billplz = initBillplzGateway(c.env);
        
        const returnUrl = `${APP_URL}/success?order=${orderNumber}`;
        const callbackUrl = `${APP_URL}/api/webhook/billplz`;
        
        const bill = await billplz.createBill({
          email,
          name: email.split('@')[0], // Use email prefix as name if not provided
          amount: Math.round(subtotal * 100), // Convert to cents
          description: `AECOIN Purchase - Order ${orderNumber}`,
          callbackUrl,
          redirectUrl: returnUrl,
          reference1: orderNumber,
          reference1Label: 'Order Number'
        });
        
        paymentUrl = bill.url;
        billCode = bill.id;
        
      } catch (billplzError: any) {
        console.error('Billplz error, falling back to ToyyibPay:', billplzError);
        
        // Fallback to ToyyibPay
        gatewayUsed = 'toyyibpay';
        const gateway = new ToyyibPayGateway(
          TOYYIBPAY_API_URL || 'https://toyyibpay.com/index.php/api',
          TOYYIBPAY_SECRET_KEY,
          TOYYIBPAY_CATEGORY_CODE
        );
        
        const returnUrl = `${APP_URL}/success?order=${orderNumber}`;
        const callbackUrl = `${APP_URL}/api/webhook/toyyibpay`;
        
        const order = {
          id: orderId,
          order_number: orderNumber,
          email,
          product_id: item.product_id,
          quantity: item.quantity,
          subtotal
        } as Order;
        
        const result = await gateway.createBill(order, returnUrl, callbackUrl);
        billCode = result.billCode;
        paymentUrl = result.paymentUrl;
      }
    } else {
      // Use ToyyibPay if Billplz is not configured
      gatewayUsed = 'toyyibpay';
      const gateway = new ToyyibPayGateway(
        TOYYIBPAY_API_URL || 'https://toyyibpay.com/index.php/api',
        TOYYIBPAY_SECRET_KEY,
        TOYYIBPAY_CATEGORY_CODE
      );
      
      const returnUrl = `${APP_URL}/success?order=${orderNumber}`;
      const callbackUrl = `${APP_URL}/api/webhook/toyyibpay`;
      
      const order = {
        id: orderId,
        order_number: orderNumber,
        email,
        product_id: item.product_id,
        quantity: item.quantity,
        subtotal
      } as Order;
      
      const result = await gateway.createBill(order, returnUrl, callbackUrl);
      billCode = result.billCode;
      paymentUrl = result.paymentUrl;
    }
    
    // Update order with payment info
    await DB.prepare(`
      UPDATE orders 
      SET gateway = ?, gateway_bill_code = ?, payment_url = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(gatewayUsed, billCode, paymentUrl, orderId).run();
    
    // Log payment initiated event
    await DB.prepare(`
      INSERT INTO order_events (order_id, type, payload, created_at)
      VALUES (?, ?, ?, datetime('now'))
    `).bind(
      orderId,
      'payment_initiated',
      JSON.stringify({ billCode, paymentUrl, gateway: gatewayUsed })
    ).run();
    
    return c.json({
      success: true,
      data: {
        order_number: orderNumber,
        payment_url: paymentUrl,
        total: subtotal,
        gateway: gatewayUsed
      }
    });
    
  } catch (error) {
    console.error('Checkout error:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to process checkout' 
    }, 500);
  }
});