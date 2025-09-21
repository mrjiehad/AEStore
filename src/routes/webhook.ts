import { Hono } from 'hono';
import { CloudflareBindings } from '../types';
import { verifyToyyibPaySignature } from '../lib/crypto';
import { EmailService } from '../lib/email/sendCodes';
import { initBillplzGateway } from '../lib/gateway/billplz';
import { initStripeGateway } from '../lib/gateway/stripe';

export const webhookRoutes = new Hono<{ Bindings: CloudflareBindings }>();

// POST /api/webhook/toyyibpay - Handle ToyyibPay webhook
webhookRoutes.post('/toyyibpay', async (c) => {
  try {
    const { DB, TOYYIBPAY_SECRET_KEY, RESEND_API_KEY, RESEND_FROM_EMAIL } = c.env;
    
    // Get webhook data
    const formData = await c.req.formData();
    const billCode = formData.get('billcode') as string;
    const orderNumber = formData.get('order_id') as string;
    const statusId = formData.get('status_id') as string; // 1 = success, 2 = pending, 3 = failed
    const billpaymentStatus = formData.get('billpaymentStatus') as string;
    const transactionId = formData.get('transaction_id') as string;
    const signature = formData.get('signature') as string;
    
    // Log webhook received
    console.log('ToyyibPay webhook received:', {
      billCode,
      orderNumber,
      statusId,
      billpaymentStatus,
      transactionId
    });
    
    // Find order
    const order = await DB.prepare(`
      SELECT * FROM orders 
      WHERE order_number = ? OR gateway_bill_code = ?
    `).bind(orderNumber || '', billCode || '').first();
    
    if (!order) {
      console.error('Order not found for webhook:', { orderNumber, billCode });
      return c.text('OK'); // Return OK to prevent retries
    }
    
    // Check idempotency - if already processed, skip
    if (order.status === 'paid' && order.gateway_ref) {
      console.log('Order already processed:', order.order_number);
      return c.text('OK');
    }
    
    // Process based on status
    if (statusId === '1' && billpaymentStatus === '1') {
      // Payment successful
      
      // Update order status
      await DB.prepare(`
        UPDATE orders 
        SET status = 'paid', 
            gateway_ref = ?, 
            paid_at = datetime('now'),
            updated_at = datetime('now')
        WHERE id = ?
      `).bind(transactionId, order.id).run();
      
      // Log payment completed event
      await DB.prepare(`
        INSERT INTO order_events (order_id, type, payload, created_at)
        VALUES (?, ?, ?, datetime('now'))
      `).bind(
        order.id,
        'payment_completed',
        JSON.stringify({ transactionId, billCode })
      ).run();
      
      // Reserve coupon codes
      const codes = await DB.prepare(`
        UPDATE coupon_codes 
        SET is_used = 1, 
            used_by_email = ?, 
            order_id = ?,
            reserved_at = datetime('now')
        WHERE id IN (
          SELECT id FROM coupon_codes 
          WHERE product_id = ? AND is_used = 0 
          LIMIT ?
        )
        RETURNING *
      `).bind(
        order.email,
        order.id,
        order.product_id,
        order.quantity
      ).all();
      
      if (!codes.results || codes.results.length < order.quantity) {
        // Handle insufficient codes - should not happen if stock was properly checked
        console.error('Insufficient codes for order:', order.order_number);
        
        // Log error but don't fail the webhook
        await DB.prepare(`
          INSERT INTO order_events (order_id, type, payload, created_at)
          VALUES (?, ?, ?, datetime('now'))
        `).bind(
          order.id,
          'codes_error',
          JSON.stringify({ 
            error: 'Insufficient codes', 
            requested: order.quantity,
            available: codes.results?.length || 0
          })
        ).run();
      } else {
        // Get product info
        const product = await DB.prepare(`
          SELECT title FROM products WHERE id = ?
        `).bind(order.product_id).first();
        
        // Send email with codes
        try {
          const emailService = new EmailService(RESEND_API_KEY, RESEND_FROM_EMAIL);
          await emailService.sendCouponCodes(
            order,
            codes.results,
            product?.title || 'AECOIN Package'
          );
          
          // Log codes sent event
          await DB.prepare(`
            INSERT INTO order_events (order_id, type, payload, created_at)
            VALUES (?, ?, ?, datetime('now'))
          `).bind(
            order.id,
            'codes_sent',
            JSON.stringify({ 
              codes: codes.results.map(c => c.code),
              email: order.email
            })
          ).run();
          
        } catch (emailError) {
          console.error('Failed to send email:', emailError);
          // Log error but don't fail the webhook
          await DB.prepare(`
            INSERT INTO order_events (order_id, type, payload, created_at)
            VALUES (?, ?, ?, datetime('now'))
          `).bind(
            order.id,
            'email_error',
            JSON.stringify({ error: emailError.message })
          ).run();
        }
      }
      
    } else if (statusId === '3') {
      // Payment failed
      await DB.prepare(`
        UPDATE orders 
        SET status = 'failed', 
            updated_at = datetime('now')
        WHERE id = ?
      `).bind(order.id).run();
      
      // Log payment failed event
      await DB.prepare(`
        INSERT INTO order_events (order_id, type, payload, created_at)
        VALUES (?, ?, ?, datetime('now'))
      `).bind(
        order.id,
        'payment_failed',
        JSON.stringify({ statusId, billpaymentStatus })
      ).run();
    }
    
    return c.text('OK');
    
  } catch (error) {
    console.error('Webhook error:', error);
    // Return OK to prevent retries that might cause issues
    return c.text('OK');
  }
});

// POST /api/webhook/billplz - Handle Billplz webhook
webhookRoutes.post('/billplz', async (c) => {
  try {
    const { DB, RESEND_API_KEY, RESEND_FROM_EMAIL } = c.env;
    
    // Get webhook data (Billplz sends as form data)
    const formData = await c.req.formData();
    
    // Parse webhook data
    const webhookData = {
      id: formData.get('id') as string,
      collection_id: formData.get('collection_id') as string,
      paid: formData.get('paid') === 'true',
      state: formData.get('state') as string,
      amount: formData.get('amount') as string,
      paid_amount: formData.get('paid_amount') as string,
      due_at: formData.get('due_at') as string,
      email: formData.get('email') as string,
      mobile: formData.get('mobile') as string,
      name: formData.get('name') as string,
      url: formData.get('url') as string,
      paid_at: formData.get('paid_at') as string,
      x_signature: formData.get('x_signature') as string,
      transaction_id: formData.get('transaction_id') as string,
      transaction_status: formData.get('transaction_status') as string,
    };
    
    // Log webhook received
    console.log('Billplz webhook received:', {
      billId: webhookData.id,
      paid: webhookData.paid,
      state: webhookData.state,
      amount: webhookData.amount,
      transactionId: webhookData.transaction_id
    });
    
    // Initialize Billplz gateway to verify signature
    const billplz = initBillplzGateway(c.env);
    
    // Process webhook
    const result = await billplz.processWebhook(webhookData);
    
    // Find order by bill ID
    const order = await DB.prepare(`
      SELECT * FROM orders 
      WHERE gateway_bill_code = ?
    `).bind(webhookData.id).first();
    
    if (!order) {
      console.error('Order not found for Billplz webhook:', webhookData.id);
      return c.text('OK'); // Return OK to prevent retries
    }
    
    // Check idempotency - if already processed, skip
    if (order.status === 'paid' && order.gateway_ref) {
      console.log('Order already processed:', order.order_number);
      return c.text('OK');
    }
    
    // Process based on payment status
    if (result.paid) {
      // Payment successful
      
      // Get product info for code allocation
      const product = await DB.prepare(`
        SELECT * FROM products WHERE id = ?
      `).bind(order.product_id).first();
      
      if (!product) {
        console.error('Product not found:', order.product_id);
        return c.text('OK');
      }
      
      // Allocate codes for the order
      const codes = await DB.prepare(`
        UPDATE coupon_codes 
        SET is_used = true, 
            used_by_email = ?,
            order_id = ?,
            used_at = datetime('now')
        WHERE product_id = ? 
          AND is_used = false
        LIMIT ?
        RETURNING *
      `).bind(
        order.email,
        order.id,
        order.product_id,
        order.quantity
      ).all();
      
      if (codes.results.length < order.quantity) {
        console.error('Insufficient codes available:', {
          required: order.quantity,
          available: codes.results.length
        });
        
        // Update order status to failed
        await DB.prepare(`
          UPDATE orders 
          SET status = 'failed',
              gateway_ref = ?,
              notes = 'Insufficient codes available',
              updated_at = datetime('now')
          WHERE id = ?
        `).bind(result.transactionId, order.id).run();
        
        return c.text('OK');
      }
      
      // Update order status
      await DB.prepare(`
        UPDATE orders 
        SET status = 'paid',
            paid_at = datetime('now'),
            gateway_ref = ?,
            updated_at = datetime('now')
        WHERE id = ?
      `).bind(result.transactionId, order.id).run();
      
      // Log payment success event
      await DB.prepare(`
        INSERT INTO order_events (order_id, type, payload, created_at)
        VALUES (?, ?, ?, datetime('now'))
      `).bind(
        order.id,
        'payment_success',
        JSON.stringify({
          transactionId: result.transactionId,
          amount: result.amount,
          billId: result.billId
        })
      ).run();
      
      // Send codes via email
      if (RESEND_API_KEY && RESEND_FROM_EMAIL) {
        try {
          const emailService = new EmailService(RESEND_API_KEY, RESEND_FROM_EMAIL);
          await emailService.sendActivationCodes(
            order.email,
            order.order_number,
            codes.results.map(c => c.code),
            product.title,
            order.subtotal
          );
          
          // Log email sent event
          await DB.prepare(`
            INSERT INTO order_events (order_id, type, payload, created_at)
            VALUES (?, ?, ?, datetime('now'))
          `).bind(
            order.id,
            'codes_sent',
            JSON.stringify({ 
              codes: codes.results.map(c => c.code),
              email: order.email
            })
          ).run();
          
        } catch (emailError) {
          console.error('Failed to send email:', emailError);
          // Log error but don't fail the webhook
          await DB.prepare(`
            INSERT INTO order_events (order_id, type, payload, created_at)
            VALUES (?, ?, ?, datetime('now'))
          `).bind(
            order.id,
            'email_error',
            JSON.stringify({ error: emailError.message })
          ).run();
        }
      }
      
    } else if (webhookData.state === 'due') {
      // Payment pending/due
      await DB.prepare(`
        UPDATE orders 
        SET status = 'pending',
            gateway_ref = ?,
            updated_at = datetime('now')
        WHERE id = ?
      `).bind(result.transactionId, order.id).run();
      
    } else {
      // Payment failed or cancelled
      await DB.prepare(`
        UPDATE orders 
        SET status = 'failed',
            gateway_ref = ?,
            updated_at = datetime('now')
        WHERE id = ?
      `).bind(result.transactionId, order.id).run();
      
      // Log payment failed event
      await DB.prepare(`
        INSERT INTO order_events (order_id, type, payload, created_at)
        VALUES (?, ?, ?, datetime('now'))
      `).bind(
        order.id,
        'payment_failed',
        JSON.stringify({ 
          state: webhookData.state,
          billId: webhookData.id
        })
      ).run();
    }
    
    return c.text('OK');
    
  } catch (error) {
    console.error('Billplz webhook error:', error);
    // Return OK to prevent retries that might cause issues
    return c.text('OK');
  }
});

// POST /api/webhook/stripe - Handle Stripe webhook
webhookRoutes.post('/stripe', async (c) => {
  try {
    const { DB, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, RESEND_API_KEY, RESEND_FROM_EMAIL } = c.env;
    
    // Get raw body for signature verification
    const rawBody = await c.req.text();
    const signature = c.req.header('stripe-signature');
    
    if (!signature || !STRIPE_WEBHOOK_SECRET) {
      console.error('Missing Stripe signature or webhook secret');
      return c.json({ error: 'Invalid webhook' }, 400);
    }
    
    // Initialize Stripe gateway
    const stripe = initStripeGateway(c.env);
    
    // Parse the event
    let event;
    try {
      event = JSON.parse(rawBody);
      
      // Verify signature (basic check for now)
      if (!stripe.verifyWebhookSignature(rawBody, signature, STRIPE_WEBHOOK_SECRET)) {
        console.error('Invalid Stripe webhook signature');
        return c.json({ error: 'Invalid signature' }, 400);
      }
    } catch (error) {
      console.error('Error parsing webhook:', error);
      return c.json({ error: 'Invalid payload' }, 400);
    }
    
    // Process the webhook event
    const result = await stripe.processWebhook(event);
    
    if (!result.success) {
      console.error('Stripe webhook processing failed');
      return c.json({ received: true }); // Still return 200 to prevent retries
    }
    
    // Handle checkout.session.completed event
    if (result.type === 'checkout.session.completed' && result.sessionId && result.paid) {
      const sessionId = result.sessionId;
      const paymentIntentId = result.paymentIntentId;
      
      // Find order by session ID
      const order = await DB.prepare(`
        SELECT * FROM orders 
        WHERE gateway_bill_code = ?
      `).bind(sessionId).first();
      
      if (!order) {
        console.error('Order not found for Stripe session:', sessionId);
        return c.json({ received: true });
      }
      
      // Check idempotency - if already processed, skip
      if (order.status === 'paid' && order.gateway_ref) {
        console.log('Order already processed:', order.order_number);
        return c.json({ received: true });
      }
      
      // Payment is confirmed as paid
        // Get product info for code allocation
        const product = await DB.prepare(`
          SELECT * FROM products WHERE id = ?
        `).bind(order.product_id).first();
        
        if (!product) {
          console.error('Product not found:', order.product_id);
          return c.json({ received: true });
        }
        
        // Allocate codes for the order
        const codes = await DB.prepare(`
          UPDATE coupon_codes 
          SET is_used = true, 
              used_by_email = ?,
              order_id = ?,
              used_at = datetime('now')
          WHERE product_id = ? 
            AND is_used = false
          LIMIT ?
          RETURNING *
        `).bind(
          order.email,
          order.id,
          order.product_id,
          order.quantity
        ).all();
        
        if (codes.results.length < order.quantity) {
          console.error('Insufficient codes available:', {
            required: order.quantity,
            available: codes.results.length
          });
          
          // Update order status to failed
          await DB.prepare(`
            UPDATE orders 
            SET status = 'failed',
                gateway_ref = ?,
                updated_at = datetime('now')
            WHERE id = ?
          `).bind(paymentIntentId || '', order.id).run();
          
          return c.json({ received: true });
        }
        
        // Update order status
        await DB.prepare(`
          UPDATE orders 
          SET status = 'paid',
              paid_at = datetime('now'),
              gateway_ref = ?,
              updated_at = datetime('now')
          WHERE id = ?
        `).bind(paymentIntentId || '', order.id).run();
        
        // Log payment success event
        await DB.prepare(`
          INSERT INTO order_events (order_id, type, payload, created_at)
          VALUES (?, ?, ?, datetime('now'))
        `).bind(
          order.id,
          'payment_success',
          JSON.stringify({
            sessionId: sessionId,
            paymentIntent: paymentIntentId,
            amount: result.paymentIntentId ? 'paid' : ''
          })
        ).run();
        
        // Send codes via email
        if (RESEND_API_KEY && RESEND_FROM_EMAIL) {
          try {
            const emailService = new EmailService(RESEND_API_KEY, RESEND_FROM_EMAIL);
            await emailService.sendActivationCodes(
              order.email,
              order.order_number,
              codes.results.map(c => c.code),
              product.title,
              order.subtotal
            );
            
            // Log email sent event
            await DB.prepare(`
              INSERT INTO order_events (order_id, type, payload, created_at)
              VALUES (?, ?, ?, datetime('now'))
            `).bind(
              order.id,
              'codes_sent',
              JSON.stringify({ 
                codes: codes.results.map(c => c.code),
                email: order.email
              })
            ).run();
            
          } catch (emailError) {
            console.error('Failed to send email:', emailError);
            // Log error but don't fail the webhook
            await DB.prepare(`
              INSERT INTO order_events (order_id, type, payload, created_at)
              VALUES (?, ?, ?, datetime('now'))
            `).bind(
              order.id,
              'email_error',
              JSON.stringify({ error: emailError.message })
            ).run();
          }
        }
    }
    
    return c.json({ received: true });
    
  } catch (error) {
    console.error('Stripe webhook error:', error);
    return c.json({ error: 'Webhook processing failed' }, 500);
  }
});

// POST /api/webhook/test - Test mode webhook for development
webhookRoutes.post('/test', async (c) => {
  try {
    const { DB } = c.env;
    const body = await c.req.json();
    const { order_number, status } = body;
    
    // Find order
    const order = await DB.prepare(`
      SELECT * FROM orders WHERE order_number = ?
    `).bind(order_number).first();
    
    if (!order) {
      return c.json({ error: 'Order not found' }, 404);
    }
    
    if (status === 'success') {
      // Mark order as paid (test mode)
      await DB.prepare(`
        UPDATE orders 
        SET status = 'paid',
            paid_at = datetime('now'),
            gateway_ref = 'TEST-PAYMENT',
            updated_at = datetime('now')
        WHERE id = ?
      `).bind(order.id).run();
      
      // Allocate test codes
      const codes = await DB.prepare(`
        UPDATE coupon_codes 
        SET is_used = true, 
            used_by_email = ?,
            order_id = ?,
            used_at = datetime('now')
        WHERE product_id = ? 
          AND is_used = false
        LIMIT ?
        RETURNING *
      `).bind(
        order.email,
        order.id,
        order.product_id,
        order.quantity
      ).all();
      
      if (codes.results.length > 0) {
        console.log('Test mode: Allocated codes:', codes.results.map(c => c.code));
      } else {
        console.log('Test mode: No codes available (this is normal in test mode)');
      }
      
      return c.json({ 
        success: true, 
        message: 'Test payment processed',
        codes_allocated: codes.results.length
      });
    } else {
      // Mark as failed
      await DB.prepare(`
        UPDATE orders 
        SET status = 'failed',
            updated_at = datetime('now')
        WHERE id = ?
      `).bind(order.id).run();
      
      return c.json({ success: true, message: 'Test payment failed' });
    }
    
  } catch (error) {
    console.error('Test webhook error:', error);
    return c.json({ error: 'Test webhook failed' }, 500);
  }
});
