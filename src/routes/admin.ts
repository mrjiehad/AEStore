import { Hono } from 'hono';
import { CloudflareBindings } from '../types';
import { hashPassword } from '../lib/crypto';
import { nanoid } from 'nanoid';

export const adminRoutes = new Hono<{ Bindings: CloudflareBindings }>();

// Middleware for admin authentication
const requireAuth = async (c: any, next: any) => {
  const { DB } = c.env;
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }
  
  const session = await DB.prepare(`
    SELECT * FROM admin_sessions 
    WHERE token = ? AND expires_at > datetime('now')
  `).bind(token).first();
  
  if (!session) {
    return c.json({ success: false, error: 'Invalid or expired token' }, 401);
  }
  
  await next();
};

// POST /api/admin/login - Admin login
adminRoutes.post('/login', async (c) => {
  try {
    const { DB, ADMIN_PASSWORD } = c.env;
    const { password } = await c.req.json();
    
    if (!password || password !== ADMIN_PASSWORD) {
      return c.json({ 
        success: false, 
        error: 'Invalid password' 
      }, 401);
    }
    
    // Create session token
    const token = nanoid(32);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    await DB.prepare(`
      INSERT INTO admin_sessions (token, expires_at, created_at)
      VALUES (?, ?, datetime('now'))
    `).bind(token, expiresAt.toISOString()).run();
    
    return c.json({
      success: true,
      data: { token, expires_at: expiresAt }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ 
      success: false, 
      error: 'Login failed' 
    }, 500);
  }
});

// GET /api/admin/dashboard - Get dashboard stats
adminRoutes.get('/dashboard', requireAuth, async (c) => {
  try {
    const { DB } = c.env;
    
    // Get overall stats
    const stats = await DB.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM orders WHERE status = 'paid') as total_paid_orders,
        (SELECT SUM(subtotal) FROM orders WHERE status = 'paid') as total_revenue,
        (SELECT COUNT(*) FROM orders WHERE status = 'pending') as pending_orders,
        (SELECT COUNT(*) FROM coupon_codes WHERE is_used = 0) as available_codes,
        (SELECT COUNT(*) FROM coupon_codes WHERE is_used = 1) as used_codes
    `).first();
    
    // Get product stock levels
    const stockLevels = await DB.prepare(`
      SELECT 
        p.id,
        p.title,
        p.sku,
        COUNT(CASE WHEN c.is_used = 0 THEN 1 END) as available,
        COUNT(CASE WHEN c.is_used = 1 THEN 1 END) as used,
        COUNT(*) as total
      FROM products p
      LEFT JOIN coupon_codes c ON p.id = c.product_id
      GROUP BY p.id, p.title, p.sku
      ORDER BY p.sort_order
    `).all();
    
    // Get recent orders
    const recentOrders = await DB.prepare(`
      SELECT 
        o.order_number,
        o.email,
        o.quantity,
        o.subtotal,
        o.status,
        o.created_at,
        p.title as product_title
      FROM orders o
      LEFT JOIN products p ON o.product_id = p.id
      ORDER BY o.created_at DESC
      LIMIT 10
    `).all();
    
    return c.json({
      success: true,
      data: {
        stats,
        stock_levels: stockLevels.results || [],
        recent_orders: recentOrders.results || []
      }
    });
    
  } catch (error) {
    console.error('Dashboard error:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to fetch dashboard data' 
    }, 500);
  }
});

// POST /api/admin/codes/upload - Upload coupon codes
adminRoutes.post('/codes/upload', requireAuth, async (c) => {
  try {
    const { DB } = c.env;
    const { product_id, codes } = await c.req.json();
    
    if (!product_id || !codes || !Array.isArray(codes)) {
      return c.json({ 
        success: false, 
        error: 'Invalid request' 
      }, 400);
    }
    
    // Verify product exists
    const product = await DB.prepare(`
      SELECT id FROM products WHERE id = ?
    `).bind(product_id).first();
    
    if (!product) {
      return c.json({ 
        success: false, 
        error: 'Product not found' 
      }, 404);
    }
    
    // Insert codes in batches
    let inserted = 0;
    let duplicates = 0;
    
    for (const code of codes) {
      try {
        await DB.prepare(`
          INSERT INTO coupon_codes (code, product_id, is_used, created_at)
          VALUES (?, ?, 0, datetime('now'))
        `).bind(code.trim(), product_id).run();
        inserted++;
      } catch (e: any) {
        if (e.message.includes('UNIQUE')) {
          duplicates++;
        }
      }
    }
    
    return c.json({
      success: true,
      data: {
        total: codes.length,
        inserted,
        duplicates
      }
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to upload codes' 
    }, 500);
  }
});

// GET /api/admin/orders - Get all orders with filters
adminRoutes.get('/orders', requireAuth, async (c) => {
  try {
    const { DB } = c.env;
    const status = c.req.query('status');
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');
    
    let query = `
      SELECT 
        o.*,
        p.title as product_title,
        p.sku as product_sku
      FROM orders o
      LEFT JOIN products p ON o.product_id = p.id
    `;
    
    const params = [];
    if (status) {
      query += ' WHERE o.status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const orders = await DB.prepare(query).bind(...params).all();
    
    return c.json({
      success: true,
      data: orders.results || []
    });
    
  } catch (error) {
    console.error('Orders error:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to fetch orders' 
    }, 500);
  }
});