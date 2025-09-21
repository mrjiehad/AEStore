import { Hono } from 'hono';
import { CloudflareBindings, Product } from '../types';

export const productRoutes = new Hono<{ Bindings: CloudflareBindings }>();

// GET /api/products - Get all active products
productRoutes.get('/', async (c) => {
  try {
    const { DB } = c.env;
    
    const result = await DB.prepare(`
      SELECT * FROM products 
      WHERE is_active = 1 
      ORDER BY sort_order ASC, id ASC
    `).all();
    
    return c.json({
      success: true,
      data: result.results || []
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to fetch products' 
    }, 500);
  }
});

// GET /api/products/:id - Get single product
productRoutes.get('/:id', async (c) => {
  try {
    const { DB } = c.env;
    const id = c.req.param('id');
    
    const result = await DB.prepare(`
      SELECT * FROM products 
      WHERE id = ? AND is_active = 1
    `).bind(id).first();
    
    if (!result) {
      return c.json({ 
        success: false, 
        error: 'Product not found' 
      }, 404);
    }
    
    return c.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to fetch product' 
    }, 500);
  }
});

// GET /api/products/:id/stock - Get product stock
productRoutes.get('/:id/stock', async (c) => {
  try {
    const { DB } = c.env;
    const id = c.req.param('id');
    
    const result = await DB.prepare(`
      SELECT COUNT(*) as available_stock
      FROM coupon_codes 
      WHERE product_id = ? AND is_used = 0
    `).bind(id).first();
    
    return c.json({
      success: true,
      data: {
        product_id: parseInt(id),
        available_stock: result?.available_stock || 0
      }
    });
  } catch (error) {
    console.error('Error fetching stock:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to fetch stock' 
    }, 500);
  }
});