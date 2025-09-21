-- Insert sample products
INSERT OR REPLACE INTO products (sku, title, amount_ae, price_original, price_now, image, is_active, sort_order) VALUES 
  ('AE500', '500 AECOIN Package', 500, 65.00, 60.00, '/static/images/package-500.jpg', 1, 1),
  ('AE1000', '1000 AECOIN Package', 1000, 110.00, 98.00, '/static/images/package-1000.jpg', 1, 2),
  ('AE3000', '3000 AECOIN Package', 3000, 310.00, 295.00, '/static/images/package-3000.jpg', 1, 3),
  ('AE5000', '5000 AECOIN Package', 5000, 510.00, 490.00, '/static/images/package-5000.jpg', 1, 4),
  ('AE10000', '10000 AECOIN Package', 10000, 1000.00, 980.00, '/static/images/package-10000.jpg', 1, 5);

-- Insert sample coupon codes for testing
-- 500 AECOIN codes
INSERT OR REPLACE INTO coupon_codes (code, product_id, is_used) VALUES 
  ('AE500-TEST-001', 1, 0),
  ('AE500-TEST-002', 1, 0),
  ('AE500-TEST-003', 1, 0),
  ('AE500-TEST-004', 1, 0),
  ('AE500-TEST-005', 1, 0);

-- 1000 AECOIN codes
INSERT OR REPLACE INTO coupon_codes (code, product_id, is_used) VALUES 
  ('AE1000-TEST-001', 2, 0),
  ('AE1000-TEST-002', 2, 0),
  ('AE1000-TEST-003', 2, 0),
  ('AE1000-TEST-004', 2, 0),
  ('AE1000-TEST-005', 2, 0);

-- 3000 AECOIN codes
INSERT OR REPLACE INTO coupon_codes (code, product_id, is_used) VALUES 
  ('AE3000-TEST-001', 3, 0),
  ('AE3000-TEST-002', 3, 0),
  ('AE3000-TEST-003', 3, 0);

-- 5000 AECOIN codes
INSERT OR REPLACE INTO coupon_codes (code, product_id, is_used) VALUES 
  ('AE5000-TEST-001', 4, 0),
  ('AE5000-TEST-002', 4, 0),
  ('AE5000-TEST-003', 4, 0);

-- 10000 AECOIN codes
INSERT OR REPLACE INTO coupon_codes (code, product_id, is_used) VALUES 
  ('AE10000-TEST-001', 5, 0),
  ('AE10000-TEST-002', 5, 0),
  ('AE10000-TEST-003', 5, 0);