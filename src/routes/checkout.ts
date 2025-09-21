import { Hono } from 'hono';
import { CloudflareBindings, Order } from '../types';
import { z } from 'zod';
import { ToyyibPayGateway } from '../lib/gateway/toyyibpay';
import { initBillplzGateway } from '../lib/gateway/billplz';
import { initStripeGateway } from '../lib/gateway/stripe';
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
  payment_method: z.enum(['stripe', 'billplz', 'toyyibpay', 'test']).optional().default('stripe')
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
    const hasStripe = c.env.STRIPE_SECRET_KEY && 
                      !c.env.STRIPE_SECRET_KEY.includes('your_') &&
                      !c.env.STRIPE_SECRET_KEY.includes('test_key');
    const hasBillplz = c.env.BILLPLZ_API_KEY && 
                       c.env.BILLPLZ_COLLECTION_ID && 
                       !c.env.BILLPLZ_API_KEY.includes('test') &&
                       !c.env.BILLPLZ_API_KEY.includes('dev');
    const hasToyyibPay = c.env.TOYYIBPAY_SECRET_KEY && 
                        c.env.TOYYIBPAY_CATEGORY_CODE &&
                        !c.env.TOYYIBPAY_SECRET_KEY.includes('test') &&
                        !c.env.TOYYIBPAY_SECRET_KEY.includes('dev');
    
    // Use selected payment method if available, otherwise fallback
    let useGateway = payment_method;
    
    // Check if we have Stripe configured (including test keys)
    const stripeConfigured = c.env.STRIPE_SECRET_KEY && c.env.STRIPE_SECRET_KEY.startsWith('sk_');
    
    // If Stripe is configured, use it as primary
    if (stripeConfigured && (payment_method === 'stripe' || payment_method === 'test')) {
      console.log('Using Stripe payment gateway');
      
      try {
        const stripe = initStripeGateway(c.env);
        
        const successUrl = `${APP_URL}/success?order=${orderNumber}&session_id={CHECKOUT_SESSION_ID}`;
        const cancelUrl = `${APP_URL}/checkout?canceled=true`;
        
        // Get product details for line items
        const lineItems = [];
        for (const item of items) {
          const product = await DB.prepare(`
            SELECT * FROM products WHERE id = ?
          `).bind(item.product_id).first();
          
          if (product) {
            lineItems.push({
              name: product.title,
              description: `${product.amount_ae} AECOIN`,
              amount: Math.round(product.price_now * 100), // Convert to cents
              quantity: item.quantity,
            });
          }
        }
        
        const session = await stripe.createCheckoutSession({
          orderNumber,
          email,
          items: lineItems,
          successUrl,
          cancelUrl,
          metadata: {
            order_id: orderId.toString(),
            order_number: orderNumber,
          }
        });
        
        // Update order with Stripe session info
        await DB.prepare(`
          UPDATE orders 
          SET gateway = 'stripe', 
              gateway_bill_code = ?,
              payment_url = ?,
              updated_at = datetime('now')
          WHERE id = ?
        `).bind(session.id, session.url, orderId).run();
        
        // Log payment initiated event
        await DB.prepare(`
          INSERT INTO order_events (order_id, type, payload, created_at)
          VALUES (?, ?, ?, datetime('now'))
        `).bind(
          orderId,
          'payment_initiated',
          JSON.stringify({ 
            sessionId: session.id, 
            paymentUrl: session.url,
            gateway: 'stripe'
          })
        ).run();
        
        return c.json({
          success: true,
          data: {
            order_number: orderNumber,
            payment_url: session.url,
            total: subtotal,
            gateway: 'stripe',
            session_id: session.id
          }
        });
        
      } catch (stripeError: any) {
        console.error('Stripe error:', stripeError);
        // Fall back to test mode if Stripe fails
        useGateway = 'test';
      }
    }
    
    // If no real payment gateways are configured, use test mode
    if (!stripeConfigured && !hasBillplz && !hasToyyibPay) {
      console.log('No payment gateways configured, using test mode');
      
      // Create test payment URL
      const testPaymentUrl = `/test-payment?order=${orderNumber}&amount=${subtotal}`;
      
      // Update order with test payment info
      await DB.prepare(`
        UPDATE orders 
        SET gateway = 'test', 
            gateway_bill_code = ?,
            payment_url = ?,
            updated_at = datetime('now')
        WHERE id = ?
      `).bind(`TEST-${orderNumber}`, testPaymentUrl, orderId).run();
      
      return c.json({
        success: true,
        data: {
          order_number: orderNumber,
          payment_url: testPaymentUrl,
          total: subtotal,
          gateway: 'test',
          message: 'Test mode - No real payment will be processed'
        }
      });
    }
    
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