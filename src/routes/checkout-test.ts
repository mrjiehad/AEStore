import { Hono } from 'hono';
import { CloudflareBindings } from '../types';
import { generateOrderNumber } from '../lib/crypto';

export const checkoutTestRoutes = new Hono<{ Bindings: CloudflareBindings }>();

// POST /api/checkout/test - Test mode checkout (for development)
checkoutTestRoutes.post('/test', async (c) => {
  try {
    const { DB } = c.env;
    const body = await c.req.json();
    const { email, items } = body;
    
    // Generate order number
    const orderNumber = generateOrderNumber();
    
    // Calculate total (simplified)
    let subtotal = 0;
    for (const item of items) {
      const product = await DB.prepare(`
        SELECT * FROM products WHERE id = ? AND is_active = 1
      `).bind(item.product_id).first();
      
      if (product) {
        subtotal += product.price_now * item.quantity;
      }
    }
    
    // Create order in database
    const orderResult = await DB.prepare(`
      INSERT INTO orders (
        order_number, email, product_id, quantity, 
        subtotal, gateway, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      orderNumber,
      email,
      items[0].product_id,
      items[0].quantity,
      subtotal,
      'test',
      'pending'
    ).run();
    
    const orderId = orderResult.meta.last_row_id;
    
    // For test mode, create a simple payment URL
    const testPaymentUrl = `/test-payment?order=${orderNumber}&amount=${subtotal}`;
    
    // Update order with test payment info
    await DB.prepare(`
      UPDATE orders 
      SET gateway = 'test', 
          gateway_bill_code = 'TEST-${orderNumber}',
          payment_url = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `).bind(testPaymentUrl, orderId).run();
    
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
    
  } catch (error) {
    console.error('Test checkout error:', error);
    return c.json({ 
      success: false, 
      error: 'Test checkout failed' 
    }, 500);
  }
});

// GET /test-payment - Test payment page
checkoutTestRoutes.get('/test-payment', async (c) => {
  const orderNumber = c.req.query('order');
  const amount = c.req.query('amount');
  
  return c.html(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Test Payment - AECOIN Store</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
</head>
<body class="bg-[#0D0D0D] text-white">
    <div class="container mx-auto px-4 py-20 max-w-md">
        <div class="bg-[#1A1A1A] rounded-lg p-8">
            <h1 class="text-2xl font-bold mb-6 text-center">
                <i class="fas fa-flask text-[#FFD600] mr-2"></i>
                Test Payment Mode
            </h1>
            
            <div class="bg-[#0D0D0D] rounded-lg p-4 mb-6">
                <p class="text-sm text-gray-400 mb-2">Order Number:</p>
                <p class="font-bold">${orderNumber}</p>
                
                <p class="text-sm text-gray-400 mb-2 mt-4">Amount:</p>
                <p class="text-2xl font-bold text-[#FFD600]">RM ${amount}</p>
            </div>
            
            <div class="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4 mb-6">
                <p class="text-yellow-400 text-sm">
                    <i class="fas fa-info-circle mr-2"></i>
                    This is TEST MODE. No real payment will be processed.
                </p>
            </div>
            
            <div class="space-y-3">
                <button onclick="simulateSuccess()" class="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold transition">
                    <i class="fas fa-check mr-2"></i>
                    Simulate Successful Payment
                </button>
                
                <button onclick="simulateFail()" class="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-bold transition">
                    <i class="fas fa-times mr-2"></i>
                    Simulate Failed Payment
                </button>
                
                <a href="/" class="block w-full bg-gray-700 hover:bg-gray-600 text-white text-center py-3 rounded-lg font-bold transition">
                    <i class="fas fa-arrow-left mr-2"></i>
                    Cancel
                </a>
            </div>
        </div>
        
        <div class="mt-6 text-center text-gray-500 text-sm">
            <p>To use real payment gateways:</p>
            <p>1. Sign up for Billplz or ToyyibPay</p>
            <p>2. Add API credentials to .dev.vars</p>
            <p>3. Restart the application</p>
        </div>
    </div>
    
    <script>
        async function simulateSuccess() {
            // Call test webhook to mark order as paid
            try {
                const response = await fetch('/api/webhook/test', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        order_number: '${orderNumber}',
                        status: 'success',
                        test: true
                    })
                });
                
                if (response.ok) {
                    alert('Payment simulated successfully!');
                    window.location.href = '/success?order=${orderNumber}&test=true';
                }
            } catch (error) {
                alert('Error simulating payment');
            }
        }
        
        function simulateFail() {
            alert('Payment failed (simulated)');
            window.location.href = '/checkout?error=payment_failed';
        }
    </script>
</body>
</html>
  `);
});