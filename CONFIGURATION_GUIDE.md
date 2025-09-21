# 📋 AECOIN Store Configuration Guide

## 🔐 Admin Access
- **Admin URL**: `/admin`
- **Current Password**: `admin123`
- **Change this** in production!

## 🏃 Quick Start Configuration

### For Local Development Testing

1. The app is currently configured with test credentials
2. Access the admin panel at: `/admin`
3. Password: `admin123`

### For Production Setup

## 1️⃣ Billplz Setup (Primary Payment Gateway)

### Option A: Sandbox Testing (FREE)
1. Sign up at: https://www.billplz-sandbox.com
2. Get API Key from: Settings → Account Settings → API Keys
3. Run setup script:
```bash
node scripts/setup-billplz.js
```

### Option B: Production
1. Sign up at: https://www.billplz.com
2. Complete KYC verification
3. Get API credentials
4. Run setup script or create collection manually

## 2️⃣ Configuration File Setup

Edit `.dev.vars` file with your credentials:

```bash
# For Sandbox Testing
BILLPLZ_API_KEY=your_sandbox_api_key_here
BILLPLZ_COLLECTION_ID=your_collection_id_here
BILLPLZ_SANDBOX=true

# For Production
BILLPLZ_API_KEY=your_production_api_key_here
BILLPLZ_COLLECTION_ID=your_collection_id_here
BILLPLZ_SANDBOX=false

# Admin Password (CHANGE THIS!)
ADMIN_PASSWORD=your_secure_password_here

# Your Domain
APP_URL=https://your-domain.com
```

## 3️⃣ ToyyibPay Setup (Optional Fallback)

1. Sign up at: https://toyyibpay.com
2. Create a category for your store
3. Get credentials from dashboard
4. Add to `.dev.vars`:
```bash
TOYYIBPAY_SECRET_KEY=your_secret_key
TOYYIBPAY_CATEGORY_CODE=your_category_code
```

## 4️⃣ Email Configuration (For Sending Codes)

### Using Resend (Recommended)
1. Sign up at: https://resend.com
2. Verify your domain
3. Get API key
4. Add to `.dev.vars`:
```bash
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

## 5️⃣ Deployment Configuration

### For Cloudflare Pages Deployment

1. After deployment, go to Cloudflare Pages dashboard
2. Settings → Environment Variables
3. Add all the variables from `.dev.vars`
4. Deploy your site

### Important Production Variables:
```bash
# REQUIRED
BILLPLZ_API_KEY=<your_api_key>
BILLPLZ_COLLECTION_ID=<your_collection_id>
ADMIN_PASSWORD=<strong_password>
APP_URL=https://your-production-domain.com

# OPTIONAL but recommended
BILLPLZ_X_SIGNATURE_KEY=<for_webhook_security>
RESEND_API_KEY=<for_email_delivery>
RESEND_FROM_EMAIL=<your_email>
```

## 6️⃣ Testing Your Configuration

### Test Billplz Integration:
```bash
# Check if Billplz is configured
curl https://your-site.com/api/products

# Test checkout (will redirect to Billplz)
# Add items to cart and checkout
```

### Test Admin Panel:
1. Go to `/admin`
2. Login with your password
3. Upload test coupon codes
4. View dashboard statistics

## 7️⃣ Managing Coupon Codes

### Via Admin Panel:
1. Login to `/admin`
2. Go to "Upload Codes"
3. Select product
4. Paste codes (one per line)
5. Click Upload

### Via Database:
```sql
INSERT INTO coupon_codes (code, product_id, is_used) 
VALUES ('TEST-CODE-123', 1, false);
```

## 🚨 Security Checklist

- [ ] Changed default admin password
- [ ] Using HTTPS in production
- [ ] Set strong WEBHOOK_SECRET
- [ ] Configured Billplz X-Signature
- [ ] Verified email domain for Resend
- [ ] Set up webhook URLs in payment gateways
- [ ] Removed `.dev.vars` from git repository

## 📞 Webhook URLs to Configure

Configure these in your payment gateway dashboards:

### Billplz:
```
https://your-domain.com/api/webhook/billplz
```

### ToyyibPay:
```
https://your-domain.com/api/webhook/toyyibpay
```

## 🧪 Testing Payments

### Billplz Sandbox Test Banks:
- Use any Malaysian test bank
- Test FPX credentials provided in sandbox

### Test Flow:
1. Add products to cart
2. Go to checkout
3. Enter email
4. Select payment method
5. Complete payment on gateway
6. Check email for codes
7. Verify order in admin panel

## 📊 Monitoring

### Check Application Logs:
```bash
pm2 logs aecoin-store
```

### Check Database:
```bash
# Check orders
wrangler d1 execute webapp-production --local --command="SELECT * FROM orders"

# Check available codes
wrangler d1 execute webapp-production --local --command="SELECT COUNT(*) FROM coupon_codes WHERE is_used = false"
```

## 🆘 Troubleshooting

### Payment Gateway Not Working:
1. Check API credentials in `.dev.vars`
2. Verify collection ID is correct
3. Check PM2 logs for errors
4. Ensure webhook URLs are accessible

### Codes Not Sending:
1. Check Resend API key
2. Verify email configuration
3. Check order status in database
4. Review webhook logs

### Admin Panel Access Issues:
1. Verify password in `.dev.vars`
2. Clear browser cache
3. Check console for errors

## 📱 Support Contacts

- **Billplz Support**: support@billplz.com
- **ToyyibPay Support**: https://toyyibpay.com/contact
- **Resend Support**: https://resend.com/support

---

**Remember**: Always test in sandbox/development before going live!