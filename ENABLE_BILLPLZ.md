# 🎯 How to Enable Billplz Payment Gateway

## Current Status
✅ **Test Mode Active** - The store is working in test mode (no real payments)

## To Enable Real Billplz Payments:

### Step 1: Get FREE Billplz Sandbox Account (5 minutes)
1. Go to: https://www.billplz-sandbox.com
2. Click "Sign Up" (it's FREE)
3. Fill in your details
4. Verify email
5. Login to dashboard

### Step 2: Get Your API Credentials
1. In Billplz Dashboard, go to: **Settings → Account Settings**
2. Click on **API Keys** tab
3. Click "Show" next to Secret Key
4. Copy the API Secret Key (starts with random letters/numbers)

### Step 3: Create a Collection
Run this command:
```bash
cd /home/user/webapp
node scripts/setup-billplz.js
```

When prompted:
- Paste your API Secret Key
- Answer "yes" for sandbox
- Answer "yes" to create collection
- Enter "AECOIN Store" as collection name

The script will give you a Collection ID - copy it!

### Step 4: Update Configuration
```bash
cd /home/user/webapp
nano .dev.vars
```

Replace the commented lines with:
```
BILLPLZ_API_KEY=your_actual_api_key_here
BILLPLZ_COLLECTION_ID=your_actual_collection_id_here
BILLPLZ_SANDBOX=true
```

Save the file (Ctrl+X, Y, Enter)

### Step 5: Restart Application
```bash
pm2 restart aecoin-store
```

### Step 6: Test It!
1. Go to your store
2. Add products to cart
3. Go to checkout
4. You'll now see Billplz option!
5. Complete a test payment

## What You'll See After Setup:

### Before (Test Mode):
- Yellow "Test Mode Active" notice
- Test Payment button
- Simulated payment page

### After (Billplz Enabled):
- Payment method selector
- Billplz and ToyyibPay options
- Real payment gateway redirect
- Professional checkout flow

## Testing in Sandbox
When using Billplz Sandbox:
- Use any email
- For FPX: Select any bank and use test credentials
- For Cards: Use test card numbers
- No real money is charged

## Going to Production
When ready for real payments:
1. Sign up at https://www.billplz.com (production)
2. Complete KYC verification
3. Get production API credentials
4. Update .dev.vars with production keys
5. Set BILLPLZ_SANDBOX=false

## Quick Commands Reference
```bash
# Check current config
cat .dev.vars | grep BILLPLZ

# Setup Billplz
node scripts/setup-billplz.js

# Update config
node scripts/update-config.js

# Restart app
pm2 restart aecoin-store

# Check logs
pm2 logs aecoin-store --lines 20
```

## Need Help?
- Billplz Documentation: https://www.billplz.com/api
- Billplz Support: support@billplz.com
- Test in sandbox first before production!

---
**Remember**: Sandbox is FREE and perfect for testing!