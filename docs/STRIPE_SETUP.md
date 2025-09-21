# Stripe Payment Gateway Setup Guide

This guide will help you set up Stripe payment gateway for the AECOIN Store.

## Prerequisites

- A Stripe account (sign up at https://stripe.com)
- Access to your Stripe Dashboard

## Step 1: Get Your API Keys

1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers** → **API keys**
3. You'll see two modes: **Test mode** and **Live mode**
   - Start with **Test mode** for development and testing
   - Switch to **Live mode** when ready for production

4. Copy your keys:
   - **Publishable key**: Starts with `pk_test_` (for test mode) or `pk_live_` (for live mode)
   - **Secret key**: Starts with `sk_test_` (for test mode) or `sk_live_` (for live mode)

## Step 2: Set Up Webhook Endpoint

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter your webhook URL:
   - For development: `http://localhost:3000/api/webhook/stripe`
   - For production: `https://your-domain.pages.dev/api/webhook/stripe`
4. Select events to listen for:
   - `checkout.session.completed` (Required)
   - `payment_intent.succeeded` (Optional)
   - `payment_intent.payment_failed` (Optional)
5. Click **Add endpoint**
6. After creation, click on the webhook to reveal the **Signing secret**
   - Copy this value (starts with `whsec_`)

## Step 3: Configure Environment Variables

### For Local Development

Edit `.dev.vars` file:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### For Production (Cloudflare Pages)

Set secrets using Wrangler:

```bash
# Set Stripe secret key
npx wrangler pages secret put STRIPE_SECRET_KEY --project-name your-project

# Set webhook secret
npx wrangler pages secret put STRIPE_WEBHOOK_SECRET --project-name your-project

# Set publishable key (can be environment variable instead of secret)
npx wrangler pages secret put STRIPE_PUBLISHABLE_KEY --project-name your-project
```

## Step 4: Test Your Integration

### Test Card Numbers

Use these test card numbers in test mode:

- **Successful payment**: `4242 4242 4242 4242`
- **Declined payment**: `4000 0000 0000 0002`
- **Requires authentication**: `4000 0025 0000 3155`

For all test cards:
- Use any valid future expiry date (e.g., 12/34)
- Use any 3-digit CVC
- Use any billing postal code

### Malaysian Payment Methods (Test Mode)

For FPX (Malaysian online banking) testing:
1. Enable FPX in your Stripe Dashboard under **Settings** → **Payment methods**
2. When testing, select FPX as payment method
3. Use the test bank accounts provided by Stripe

### Test Webhook Locally

1. Install Stripe CLI:
```bash
# macOS
brew install stripe/stripe-cli/stripe

# Windows (using Scoop)
scoop install stripe

# Linux
# Download from https://github.com/stripe/stripe-cli/releases
```

2. Login to Stripe CLI:
```bash
stripe login
```

3. Forward webhooks to your local server:
```bash
stripe listen --forward-to http://localhost:3000/api/webhook/stripe
```

4. The CLI will display your webhook signing secret - use this in `.dev.vars`

5. In another terminal, trigger test events:
```bash
stripe trigger checkout.session.completed
```

## Step 5: Monitor Payments

1. View payments in **Stripe Dashboard** → **Payments**
2. Check webhook logs in **Developers** → **Webhooks** → Click your endpoint → **Webhook attempts**
3. Monitor your application logs for payment processing

## Troubleshooting

### Common Issues

1. **"Invalid API Key"**
   - Ensure you're using the correct key (test vs live)
   - Check that the key is properly set in environment variables

2. **"Webhook signature verification failed"**
   - Verify the webhook secret is correct
   - Ensure you're using the raw request body for signature verification

3. **"Payment requires authentication"**
   - This is normal for certain cards/amounts
   - Stripe handles 3D Secure authentication automatically

4. **"No such price"**
   - Ensure you're creating checkout sessions with correct price data
   - Check currency codes (use "MYR" for Malaysian Ringgit)

### Debug Mode

Enable debug logging by setting:
```javascript
// In your Stripe gateway initialization
const stripe = new StripeGateway(env, { debug: true });
```

## Security Best Practices

1. **Never expose your secret key** - Keep it server-side only
2. **Always verify webhook signatures** - Prevents fake webhook calls
3. **Use HTTPS in production** - Required for PCI compliance
4. **Enable Radar** - Stripe's fraud prevention tool (free with Stripe)
5. **Set up proper CORS** - Restrict API access to your domains only
6. **Monitor failed payments** - Set up alerts for unusual activity

## Going Live

When ready for production:

1. Switch to Live mode in Stripe Dashboard
2. Update your API keys to live keys
3. Update webhook endpoint URL to production domain
4. Test with a real card (small amount)
5. Monitor first few real transactions closely

## Support

- Stripe Documentation: https://stripe.com/docs
- API Reference: https://stripe.com/docs/api
- Support: https://support.stripe.com