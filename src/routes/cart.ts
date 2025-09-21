import { Hono } from 'hono';
import { CloudflareBindings, CartItem } from '../types';
import { z } from 'zod';

export const cartRoutes = new Hono<{ Bindings: CloudflareBindings }>();

const cartPriceSchema = z.object({
  items: z.array(z.object({
    product_id: z.number(),
    quantity: z.number().min(1).max(10)
  }))
});

// POST /api/cart/price - Calculate cart total
cartRoutes.post('/price', async (c) => {
  try {
    const { DB } = c.env;
    const body = await c.req.json();
    
    // Validate request
    const validation = cartPriceSchema.safeParse(body);
    if (!validation.success) {
      return c.json({ 
        success: false, 
        error: 'Invalid cart items' 
      }, 400);
    }
    
    const { items } = validation.data;
    
    if (items.length === 0) {
      return c.json({
        success: true,
        data: {
          items: [],
          subtotal: 0,
          total: 0
        }
      });
    }
    
    // Get product prices
    const productIds = items.map(item => item.product_id);
    const placeholders = productIds.map(() => '?').join(',');
    
    const products = await DB.prepare(`
      SELECT id, title, price_now, price_original, amount_ae 
      FROM products 
      WHERE id IN (${placeholders}) AND is_active = 1
    `).bind(...productIds).all();
    
    const productMap = new Map(
      products.results?.map(p => [p.id, p]) || []
    );
    
    // Check stock availability
    let calculatedItems = [];
    let subtotal = 0;
    
    for (const item of items) {
      const product = productMap.get(item.product_id);
      if (!product) continue;
      
      // Check available stock
      const stockResult = await DB.prepare(`
        SELECT COUNT(*) as available
        FROM coupon_codes
        WHERE product_id = ? AND is_used = 0
      `).bind(item.product_id).first();
      
      const available = stockResult?.available || 0;
      
      if (available < item.quantity) {
        return c.json({
          success: false,
          error: `Insufficient stock for ${product.title}. Only ${available} available.`
        }, 400);
      }
      
      const itemTotal = product.price_now * item.quantity;
      subtotal += itemTotal;
      
      calculatedItems.push({
        product_id: item.product_id,
        product_title: product.title,
        price: product.price_now,
        price_original: product.price_original,
        quantity: item.quantity,
        total: itemTotal,
        amount_ae: product.amount_ae
      });
    }
    
    return c.json({
      success: true,
      data: {
        items: calculatedItems,
        subtotal: subtotal,
        total: subtotal // No tax or shipping
      }
    });
    
  } catch (error) {
    console.error('Error calculating cart price:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to calculate cart price' 
    }, 500);
  }
});