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