import { Hono } from 'hono';
import { CloudflareBindings } from '../types';
import { verifyToyyibPaySignature } from '../lib/crypto';
import { EmailService } from '../lib/email/sendCodes';

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