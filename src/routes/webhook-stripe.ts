
// POST /api/webhook/stripe - Handle Stripe webhook
webhookRoutes.post("/stripe", async (c) => {
  try {
    const { DB, RESEND_API_KEY, RESEND_FROM_EMAIL } = c.env;
    
    // Get raw body for signature verification
    const rawBody = await c.req.text();
    const signature = c.req.header("stripe-signature") || "";
    
    // Parse the webhook event
    const event = JSON.parse(rawBody);
    
    console.log("Stripe webhook received:", {
      type: event.type,
      id: event.id
    });
    
    // Initialize Stripe gateway
    const stripe = initStripeGateway(c.env);
    
    // Verify signature (if configured)
    if (c.env.STRIPE_WEBHOOK_SECRET) {
      const isValid = stripe.verifyWebhookSignature(rawBody, signature);
      if (!isValid) {
        console.error("Invalid Stripe webhook signature");
        return c.json({ error: "Invalid signature" }, 400);
      }
    }
    
    // Process the webhook
    const result = await stripe.processWebhook(event);
    
    // Handle checkout.session.completed event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const orderNumber = session.metadata?.order_number;
      
      if (!orderNumber) {
        console.error("No order number in session metadata");
        return c.json({ received: true });
      }
      
      // Find order by order number or session ID
      const order = await DB.prepare(`
        SELECT * FROM orders 
        WHERE order_number = ? OR gateway_bill_code = ?
      `).bind(orderNumber, session.id).first();
      
      if (!order) {
        console.error("Order not found:", { orderNumber, sessionId: session.id });
        return c.json({ received: true });
      }
      
      // Check if already processed
      if (order.status === "paid" && order.gateway_ref) {
        console.log("Order already processed:", order.order_number);
        return c.json({ received: true });
      }
      
      // Check payment status
      if (session.payment_status === "paid") {
        // Payment successful
        
        // Get product info for code allocation
        const product = await DB.prepare(`
          SELECT * FROM products WHERE id = ?
        `).bind(order.product_id).first();
        
        if (!product) {
          console.error("Product not found:", order.product_id);
          return c.json({ received: true });
        }
        
        // Allocate codes for the order
        const codes = await DB.prepare(`
          UPDATE coupon_codes 
          SET is_used = true, 
              used_by_email = ?,
              order_id = ?,
              used_at = datetime("now")
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
          console.error("Insufficient codes available:", {
            required: order.quantity,
            available: codes.results.length
          });
          
          // Update order status to failed
          await DB.prepare(`
            UPDATE orders 
            SET status = "failed",
                gateway_ref = ?,
                updated_at = datetime("now")
            WHERE id = ?
          `).bind(session.payment_intent, order.id).run();
          
          return c.json({ received: true });
        }
        
        // Update order status
        await DB.prepare(`
          UPDATE orders 
          SET status = "paid",
              paid_at = datetime("now"),
              gateway_ref = ?,
              updated_at = datetime("now")
          WHERE id = ?
        `).bind(session.payment_intent || session.id, order.id).run();
        
        // Log payment success event
        await DB.prepare(`
          INSERT INTO order_events (order_id, type, payload, created_at)
          VALUES (?, ?, ?, datetime("now"))
        `).bind(
          order.id,
          "payment_success",
          JSON.stringify({
            sessionId: session.id,
            paymentIntent: session.payment_intent,
            amountTotal: session.amount_total,
            currency: session.currency
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
              VALUES (?, ?, ?, datetime("now"))
            `).bind(
              order.id,
              "codes_sent",
              JSON.stringify({ 
                codes: codes.results.map(c => c.code),
                email: order.email
              })
            ).run();
            
          } catch (emailError) {
            console.error("Failed to send email:", emailError);
            // Log error but dont fail the webhook
            await DB.prepare(`
              INSERT INTO order_events (order_id, type, payload, created_at)
              VALUES (?, ?, ?, datetime("now"))
            `).bind(
              order.id,
              "email_error",
              JSON.stringify({ error: emailError.message })
            ).run();
          }
        }
      } else {
        // Payment not completed
        console.log("Payment not completed:", session.payment_status);
      }
    }
    
    return c.json({ received: true });
    
  } catch (error) {
    console.error("Stripe webhook error:", error);
    // Return success to prevent retries
    return c.json({ received: true });
  }
});

