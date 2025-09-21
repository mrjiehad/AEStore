# 🎉 Stripe is Now Active! - Webhook Setup Guide

Your Stripe payment gateway is now configured and working! Here's how to complete the setup and test the full payment flow.

## ✅ Current Status

- **API Keys**: ✅ Configured and working
- **Checkout Sessions**: ✅ Creating successfully
- **Test Mode**: ✅ Active (using test keys)
- **Webhook**: ⏳ Needs to be configured in Stripe Dashboard

## 🔧 Step 1: Set Up Webhook in Stripe Dashboard

1. **Go to Stripe Dashboard**: https://dashboard.stripe.com/test/webhooks
2. **Click "Add endpoint"**
3. **Enter the following details**:
   - **Endpoint URL**: `https://3000-i7p0hupqfybc18c8m5qt8-6532622b.e2b.dev/api/webhook/stripe`
   - **Description**: AECOIN Store Payment Webhook
   - **Events to listen for**: Select these events:
     - ✅ `checkout.session.completed` (Required)
     - ✅ `checkout.session.expired` (Optional)
     - ✅ `payment_intent.succeeded` (Optional)
     - ✅ `payment_intent.payment_failed` (Optional)

4. **Click "Add endpoint"**
5. **After creation, click on the webhook to view details**
6. **Click "Reveal" under "Signing secret"**
7. **Copy the signing secret** (starts with `whsec_...`)

## 🔐 Step 2: Add Webhook Secret to Configuration

Edit `.dev.vars` file and add your webhook secret:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_51S9p3rRs9zOcnkoyQTeUBbDIUCVeKfnkd4F4lZp03lhGYVXayRILC5hxdVd0G17lH1JF62jVrELILUNwGOMG7Cig00ULUfOtj1
STRIPE_PUBLISHABLE_KEY=pk_test_51S9p3rRs9zOcnkoyLqNmKGJObmWdYFdQJSjUGVBI65GMJvpNNYF1p6gG6wmpGAbV68FttUqMujqVhvZICupdgl3w00ukK0qF01
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE  # <-- Add this line
```

## 🧪 Step 3: Test the Full Payment Flow

### Test via Website UI:

1. **Visit the store**: https://3000-i7p0hupqfybc18c8m5qt8-6532622b.e2b.dev
2. **Add items to cart**: Click on any AECOIN package
3. **Go to checkout**: Click cart icon
4. **Select Stripe payment**: Choose Stripe option
5. **Enter email**: Use any test email
6. **Complete payment**: You'll be redirected to Stripe Checkout
7. **Use test card**: 
   - Card Number: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/34`)
   - CVC: Any 3 digits (e.g., `123`)
   - Name: Any name
   - Billing ZIP: Any ZIP code

### Test via API:

```bash
# Create a checkout session
curl -X POST https://3000-i7p0hupqfybc18c8m5qt8-6532622b.e2b.dev/api/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "items": [{"product_id": 1, "quantity": 1}],
    "payment_method": "stripe",
    "terms_accepted": true
  }'

# Response will include payment_url
# Visit the payment_url in browser to complete payment
```

## 📊 Step 4: Monitor Payments

### In Stripe Dashboard:
1. Go to https://dashboard.stripe.com/test/payments
2. You'll see all test payments
3. Click on any payment to see details

### In Your Application:
1. Visit https://3000-i7p0hupqfybc18c8m5qt8-6532622b.e2b.dev/orders
2. Enter the email used for payment
3. View order status and details

### Check Webhook Logs:
1. Go to https://dashboard.stripe.com/test/webhooks
2. Click on your webhook endpoint
3. View "Webhook attempts" to see all events

## 🎯 Test Scenarios

### Successful Payment:
- Use card: `4242 4242 4242 4242`
- Order status should update to "paid"
- Codes should be allocated (if available)

### Declined Payment:
- Use card: `4000 0000 0000 0002`
- Payment will be declined
- Order remains "pending"

### 3D Secure Authentication:
- Use card: `4000 0025 0000 3155`
- Extra authentication step required
- Simulates strong customer authentication (SCA)

## 🚀 Production Checklist

Before going live:

- [ ] Switch to live API keys (remove "test" from keys)
- [ ] Update webhook URL to production domain
- [ ] Test with a real card (small amount)
- [ ] Ensure email service is configured (Resend API)
- [ ] Upload real AECOIN codes via admin panel
- [ ] Set up proper domain and SSL certificate
- [ ] Enable Stripe Radar for fraud protection
- [ ] Configure receipt emails in Stripe

## 📝 Important URLs

- **Your Store**: https://3000-i7p0hupqfybc18c8m5qt8-6532622b.e2b.dev
- **Checkout Page**: https://3000-i7p0hupqfybc18c8m5qt8-6532622b.e2b.dev/checkout
- **Order Tracking**: https://3000-i7p0hupqfybc18c8m5qt8-6532622b.e2b.dev/orders
- **Admin Panel**: https://3000-i7p0hupqfybc18c8m5qt8-6532622b.e2b.dev/admin

## 💡 Tips

1. **Testing Different Amounts**: Stripe test mode accepts any amount
2. **Email Receipts**: Enable in Stripe Dashboard → Settings → Email receipts
3. **Custom Metadata**: You can add custom data to checkout sessions
4. **Refunds**: Can be tested via Stripe Dashboard even in test mode
5. **Subscriptions**: Current setup is for one-time payments, can be extended for subscriptions

## 🆘 Troubleshooting

### "Invalid API Key":
- Check that keys are correctly copied
- Ensure you're using test keys (start with `_test_`)

### "Webhook signature verification failed":
- Webhook secret must match exactly
- Use raw request body for verification
- Check that webhook URL is accessible

### "No such price":
- Ensure amounts are in smallest currency unit (cents for MYR)
- Minimum amount is 50 cents (RM 0.50)

### "Payment requires authentication":
- Normal for certain cards/amounts
- Stripe handles 3D Secure automatically

## 🎉 Congratulations!

Your Stripe integration is ready! You can now:
- Accept payments from customers worldwide
- Process Malaysian FPX payments
- Handle cards from all major providers
- Automatically deliver AECOIN codes after payment

**Next Step**: Set up the webhook in Stripe Dashboard to enable automatic order processing!