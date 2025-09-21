import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/cloudflare-workers';
import { CloudflareBindings } from './types';
import { productRoutes } from './routes/products';
import { cartRoutes } from './routes/cart';
import { checkoutRoutes } from './routes/checkout';
import { webhookRoutes } from './routes/webhook';
import { orderRoutes } from './routes/orders';
import { adminRoutes } from './routes/admin';
import { renderHomePage } from './components/home';

const app = new Hono<{ Bindings: CloudflareBindings }>();

// Enable CORS for API routes
app.use('/api/*', cors());

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }));

// API Routes
app.route('/api/products', productRoutes);
app.route('/api/cart', cartRoutes);
app.route('/api/checkout', checkoutRoutes);
app.route('/api/webhook', webhookRoutes);
app.route('/api/orders', orderRoutes);
app.route('/api/admin', adminRoutes);

// Test payment page route
app.get('/test-payment', async (c) => {
  const orderNumber = c.req.query('order') || '';
  const amount = c.req.query('amount') || '0';
  
  return c.html(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Payment - AECOIN Store</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        body { 
            background-color: #0D0D0D; 
            color: white;
        }
    </style>
</head>
<body>
    <div class="min-h-screen flex items-center justify-center p-4">
        <div class="bg-[#1A1A1A] rounded-lg p-8 max-w-md w-full">
            <div class="text-center mb-6">
                <div class="text-yellow-400 text-6xl mb-4">
                    <i class="fas fa-flask"></i>
                </div>
                <h1 class="text-2xl font-bold mb-2">Test Payment Gateway</h1>
                <p class="text-gray-400">Simulate payment for testing</p>
            </div>
            
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

// Page Routes
app.get('/', renderHomePage);

app.get('/packages', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AECOIN Packages - GTA Online Currency</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <link href="/static/css/style.css" rel="stylesheet">
</head>
<body class="bg-[#0D0D0D] text-white">
    <div id="app"></div>
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script src="/static/js/packages.js"></script>
</body>
</html>
  `);
});

app.get('/cart', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Shopping Cart - AECOIN Store</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <link href="/static/css/style.css" rel="stylesheet">
</head>
<body class="bg-[#0D0D0D] text-white">
    <div id="app"></div>
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script src="/static/js/cart.js"></script>
</body>
</html>
  `);
});

app.get('/checkout', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Checkout - AECOIN Store</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <link href="/static/css/style.css" rel="stylesheet">
</head>
<body class="bg-[#0D0D0D] text-white">
    <div id="app"></div>
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script src="/static/js/checkout.js"></script>
    <!-- Payment selector disabled in test mode -->
    <!-- <script src="/static/js/payment-selector.js"></script> -->
</body>
</html>
  `);
});

app.get('/orders', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Orders - AECOIN Store</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <link href="/static/css/style.css" rel="stylesheet">
</head>
<body class="bg-[#0D0D0D] text-white">
    <div id="app"></div>
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script src="/static/js/orders.js"></script>
</body>
</html>
  `);
});

app.get('/success', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Success - AECOIN Store</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <link href="/static/css/style.css" rel="stylesheet">
</head>
<body class="bg-[#0D0D0D] text-white">
    <div class="min-h-screen flex items-center justify-center">
        <div class="text-center">
            <i class="fas fa-check-circle text-[#FFD600] text-6xl mb-4"></i>
            <h1 class="text-4xl font-bold mb-4">Payment Successful!</h1>
            <p class="text-gray-400 mb-8">Your AECOIN codes have been sent to your email.</p>
            <a href="/" class="bg-[#FFD600] text-black px-8 py-3 rounded-lg font-bold hover:bg-yellow-400 transition">
                Return to Home
            </a>
        </div>
    </div>
</body>
</html>
  `);
});

// Admin panel
app.get('/admin', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Panel - AECOIN Store</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <link href="/static/css/style.css" rel="stylesheet">
</head>
<body class="bg-[#0D0D0D] text-white">
    <div id="app"></div>
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script src="/static/js/admin.js"></script>
</body>
</html>
  `);
});

export default app;