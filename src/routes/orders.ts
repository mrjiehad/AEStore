import { Hono } from 'hono';
import { CloudflareBindings } from '../types';
import { z } from 'zod';

export const orderRoutes = new Hono<{ Bindings: CloudflareBindings }>();

// GET /api/orders/lookup - Look up orders by email
orderRoutes.get('/lookup', async (c) => {
  try {
    const { DB } = c.env;
    const email = c.req.query('email');
    
    if (!email) {
      return c.json({ 
        success: false, 
        error: 'Email is required' 
      }, 400);
    }
    
    // Validate email format
    const emailSchema = z.string().email();
    const validation = emailSchema.safeParse(email);
    if (!validation.success) {
      return c.json({ 
        success: false, 
        error: 'Invalid email format' 
      }, 400);
    }
    
    // Get orders for email
    const orders = await DB.prepare(`
      SELECT 
        o.id,
        o.order_number,
        o.email,
        o.quantity,
        o.subtotal,
        o.status,
        o.created_at,
        o.paid_at,
        p.title as product_title,
        p.amount_ae
      FROM orders o
      LEFT JOIN products p ON o.product_id = p.id
      WHERE o.email = ?
      ORDER BY o.created_at DESC
      LIMIT 50
    `).bind(email).all();
    
    // For paid orders, get masked codes
    const ordersWithCodes = [];
    for (const order of orders.results || []) {
      let maskedCodes = [];
      
      if (order.status === 'paid') {
        const codes = await DB.prepare(`
          SELECT code FROM coupon_codes
          WHERE order_id = ?
        `).bind(order.id).all();
        
        // Mask codes (show only first 3 and last 3 characters)
        maskedCodes = codes.results?.map(c => {
          const code = c.code;
          if (code.length > 8) {
            return code.substring(0, 3) + '****' + code.substring(code.length - 3);
          }
          return '********';
        }) || [];
      }
      
      ordersWithCodes.push({
        ...order,
        masked_codes: maskedCodes
      });
    }
    
    return c.json({
      success: true,
      data: ordersWithCodes
    });
    
  } catch (error) {
    console.error('Error fetching orders:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to fetch orders' 
    }, 500);
  }
});

// GET /api/orders/:orderNumber - Get single order details
orderRoutes.get('/:orderNumber', async (c) => {
  try {
    const { DB } = c.env;
    const orderNumber = c.req.param('orderNumber');
    const email = c.req.query('email'); // Require email for security
    
    if (!email) {
      return c.json({ 
        success: false, 
        error: 'Email verification is required' 
      }, 400);
    }
    
    // Get order
    const order = await DB.prepare(`
      SELECT 
        o.*,
        p.title as product_title,
        p.amount_ae
      FROM orders o
      LEFT JOIN products p ON o.product_id = p.id
      WHERE o.order_number = ? AND o.email = ?
    `).bind(orderNumber, email).first();
    
    if (!order) {
      return c.json({ 
        success: false, 
        error: 'Order not found' 
      }, 404);
    }
    
    // Get order events
    const events = await DB.prepare(`
      SELECT type, payload, created_at
      FROM order_events
      WHERE order_id = ?
      ORDER BY created_at ASC
    `).bind(order.id).all();
    
    // For paid orders, get masked codes
    let maskedCodes = [];
    if (order.status === 'paid') {
      const codes = await DB.prepare(`
        SELECT code FROM coupon_codes
        WHERE order_id = ?
      `).bind(order.id).all();
      
      // Mask codes
      maskedCodes = codes.results?.map(c => {
        const code = c.code;
        if (code.length > 8) {
          return code.substring(0, 3) + '****' + code.substring(code.length - 3);
        }
        return '********';
      }) || [];
    }
    
    return c.json({
      success: true,
      data: {
        ...order,
        masked_codes: maskedCodes,
        events: events.results || []
      }
    });
    
  } catch (error) {
    console.error('Error fetching order:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to fetch order' 
    }, 500);
  }
});