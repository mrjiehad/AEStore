// Stripe Payment Gateway Integration
import { Context } from 'hono';

interface StripeConfig {
  secretKey: string;
  webhookSecret?: string;
  apiUrl: string;
}

interface CreateCheckoutSessionParams {
  orderNumber: string;
  email: string;
  items: Array<{
    name: string;
    description?: string;
    amount: number; // in cents
    quantity: number;
  }>;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

interface StripeCheckoutSession {
  id: string;
  url: string;
  payment_status: string;
  amount_total: number;
  currency: string;
  customer_email: string;
  metadata: Record<string, string>;
  payment_intent?: string;
  status: string;
}

interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
}

export class StripeGateway {
  private config: StripeConfig;

  constructor(config: StripeConfig) {
    this.config = config;
  }

  /**
   * Create a Stripe Checkout Session
   */
  async createCheckoutSession(params: CreateCheckoutSessionParams): Promise<StripeCheckoutSession> {
    const url = `${this.config.apiUrl}/v1/checkout/sessions`;
    
    // Prepare form data
    const formData = new URLSearchParams();
    
    // Add line items
    params.items.forEach((item, index) => {
      formData.append(`line_items[${index}][price_data][currency]`, 'myr'); // Malaysian Ringgit
      formData.append(`line_items[${index}][price_data][product_data][name]`, item.name);
      if (item.description) {
        formData.append(`line_items[${index}][price_data][product_data][description]`, item.description);
      }
      formData.append(`line_items[${index}][price_data][unit_amount]`, item.amount.toString());
      formData.append(`line_items[${index}][quantity]`, item.quantity.toString());
    });
    
    // Add other parameters
    formData.append('mode', 'payment');
    formData.append('success_url', params.successUrl);
    formData.append('cancel_url', params.cancelUrl);
    formData.append('customer_email', params.email);
    
    // Add metadata
    if (params.metadata) {
      Object.entries(params.metadata).forEach(([key, value]) => {
        formData.append(`metadata[${key}]`, value);
      });
    }
    
    // Add order number to metadata
    formData.append('metadata[order_number]', params.orderNumber);
    
    // Configure payment methods - card and FPX for Malaysia
    formData.append('payment_method_types[]', 'card');
    formData.append('payment_method_types[]', 'fpx'); // Malaysian online banking
    
    // Make API request with Basic Auth
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(this.config.secretKey + ':')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Stripe API error: ${response.status} - ${error}`);
    }

    const session = await response.json() as StripeCheckoutSession;
    return session;
  }

  /**
   * Retrieve a checkout session by ID
   */
  async retrieveSession(sessionId: string): Promise<StripeCheckoutSession> {
    const url = `${this.config.apiUrl}/v1/checkout/sessions/${sessionId}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${btoa(this.config.secretKey + ':')}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Stripe API error: ${response.status} - ${error}`);
    }

    const session = await response.json() as StripeCheckoutSession;
    return session;
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!this.config.webhookSecret) {
      console.warn('Webhook secret not configured, skipping signature verification');
      return true; // Skip verification if not configured
    }

    // Stripe signature format: t=timestamp,v1=signature
    const parts = signature.split(',');
    const timestamp = parts[0]?.replace('t=', '');
    const sig = parts[1]?.replace('v1=', '');

    if (!timestamp || !sig) {
      return false;
    }

    // Create the signed payload
    const signedPayload = `${timestamp}.${payload}`;
    
    // In production, you should use proper HMAC-SHA256 verification
    // For now, we'll return true for testing
    // TODO: Implement proper signature verification
    console.log('Webhook signature verification placeholder - implement HMAC-SHA256');
    return true;
  }

  /**
   * Process webhook event from Stripe
   */
  async processWebhook(event: StripeWebhookEvent): Promise<{
    success: boolean;
    type: string;
    sessionId?: string;
    paymentIntentId?: string;
    paid?: boolean;
  }> {
    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as StripeCheckoutSession;
        return {
          success: true,
          type: 'checkout.session.completed',
          sessionId: session.id,
          paymentIntentId: session.payment_intent,
          paid: session.payment_status === 'paid',
        };
        
      case 'payment_intent.succeeded':
        return {
          success: true,
          type: 'payment_intent.succeeded',
          paymentIntentId: event.data.object.id,
          paid: true,
        };
        
      case 'payment_intent.payment_failed':
        return {
          success: true,
          type: 'payment_intent.payment_failed',
          paymentIntentId: event.data.object.id,
          paid: false,
        };
        
      default:
        console.log(`Unhandled webhook event type: ${event.type}`);
        return {
          success: true,
          type: event.type,
        };
    }
  }

  /**
   * List all checkout sessions (for admin purposes)
   */
  async listSessions(limit: number = 10): Promise<Array<StripeCheckoutSession>> {
    const url = `${this.config.apiUrl}/v1/checkout/sessions?limit=${limit}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${btoa(this.config.secretKey + ':')}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Stripe API error: ${response.status} - ${error}`);
    }

    const result = await response.json() as { data: Array<StripeCheckoutSession> };
    return result.data;
  }
}

/**
 * Initialize Stripe gateway with environment configuration
 */
export function initStripeGateway(env: any): StripeGateway {
  const config: StripeConfig = {
    secretKey: env.STRIPE_SECRET_KEY || '',
    webhookSecret: env.STRIPE_WEBHOOK_SECRET,
    apiUrl: 'https://api.stripe.com',
  };

  if (!config.secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }

  return new StripeGateway(config);
}