export interface Product {
  id: number;
  sku: string;
  title: string;
  amount_ae: number;
  price_original: number;
  price_now: number;
  image?: string;
  is_active?: boolean;
  sort_order?: number;
}

export interface CouponCode {
  id: number;
  code: string;
  product_id: number;
  is_used: boolean;
  used_by_email?: string;
  order_id?: number;
  reserved_at?: string;
  created_at: string;
}

export interface Order {
  id: number;
  order_number: string;
  email: string;
  product_id: number;
  quantity: number;
  subtotal: number;
  gateway: 'toyyibpay' | 'billplz';
  status: 'pending' | 'paid' | 'failed';
  gateway_ref?: string;
  gateway_bill_code?: string;
  payment_url?: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderEvent {
  id: number;
  order_id: number;
  type: 'created' | 'payment_initiated' | 'payment_completed' | 'payment_failed' | 'codes_sent';
  payload?: any;
  created_at: string;
}

export interface CartItem {
  product_id: number;
  quantity: number;
}

export interface CheckoutRequest {
  email: string;
  items: CartItem[];
  terms_accepted: boolean;
}

export interface CloudflareBindings {
  DB: D1Database;
  KV: KVNamespace;
  TOYYIBPAY_SECRET_KEY: string;
  TOYYIBPAY_CATEGORY_CODE: string;
  TOYYIBPAY_API_URL: string;
  BILLPLZ_API_KEY: string;
  BILLPLZ_COLLECTION_ID: string;
  BILLPLZ_SECRET_KEY: string;
  BILLPLZ_API_URL: string;
  RESEND_API_KEY: string;
  RESEND_FROM_EMAIL: string;
  ADMIN_PASSWORD: string;
  APP_URL: string;
  WEBHOOK_SECRET: string;
}