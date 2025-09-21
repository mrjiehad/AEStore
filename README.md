# 🎮 AECOIN Store - GTA Online Currency Store

## Project Overview
- **Name**: AECOIN Store
- **Goal**: Gaming-focused e-commerce platform for selling GTA Online virtual currency (AECOIN) with instant delivery
- **Features**: Dark theme with yellow accent (#FFD600), gaming visuals, secure payment processing, instant code delivery via email
- **Target Audience**: Young gamers and GTA Online enthusiasts

## Live URLs
- **Development**: https://3000-i7p0hupqfybc18c8m5qt8-6532622b.e2b.dev
- **Production**: https://aecoin-store.pages.dev (ready for deployment)
- **Payment Gateway**: ✅ Stripe configured and active

## Features Completed ✅
- ✅ **Home Page** with full-page GTA-themed hero slider (4 rotating slides)
- ✅ **Product Packages** with simplified dark design (5 packages in one row)
- ✅ **Gallery Section** showcasing GTA game imagery (8 themed images)
- ✅ **Shopping Cart** with localStorage persistence and drawer UI
- ✅ **Checkout System** with email validation
- ✅ **Order Tracking** by email lookup
- ✅ **Admin Panel** for code management and statistics
- ✅ **Multiple Payment Gateway Integration**:
  - **Stripe** (Primary) - International payment gateway with cards and FPX
  - **Billplz** (Malaysian) - Local payment gateway with FPX, credit/debit cards
  - **ToyyibPay** (Malaysian) - Alternative local gateway
  - **Test Mode** - Development testing without real payments
- ✅ **Webhook Handler** for payment confirmation
- ✅ **Email Service** for sending activation codes
- ✅ **Database Schema** with D1 SQLite (Products, Orders, CouponCodes, OrderEvents)
- ✅ **Security Features**: Rate limiting, idempotent webhooks, secure signatures
- ✅ **Gaming-Focused Design**: Gaming fonts, character imagery, interactive elements
- ✅ **Responsive Design** with Tailwind CSS
- ✅ **Dark Theme** with yellow accents (#0D0D0D, #FFD600)
- ✅ **Clean Footer** without third-party branding

## New Gaming Features 🎮
### Package Cards Design
- Each package has a unique gaming image
- Clean, simplified dark cards with minimal color
- Hover effects with subtle image zoom
- Fire emoji discount badges
- Instant delivery indicators
- Gaming fonts (Orbitron, Bebas Neue, Russo One)

### Gallery Section
- 8 high-quality GTA-themed images
- Categories include:
  - 🏁 Street Racing
  - 🎮 Epic Gaming
  - 💥 Intense Action
  - 💰 Big Heists
  - 🚗 Supercars
  - 🔫 Weapons Arsenal
  - 🏢 Luxury Properties
  - 🌐 Online World
- Interactive hover overlays
- Smooth transitions and animations

## API Endpoints

### Public APIs
- `GET /api/products` - List all active products with images
- `GET /api/products/:id` - Get single product details
- `GET /api/products/:id/stock` - Check product stock availability
- `POST /api/cart/price` - Calculate cart total with stock validation
- `POST /api/checkout` - Process checkout and create payment
- `GET /api/orders/lookup?email=` - Look up orders by email
- `GET /api/orders/:orderNumber?email=` - Get order details

### Webhook
- `POST /api/webhook/stripe` - Handle Stripe payment callbacks
- `POST /api/webhook/billplz` - Handle Billplz payment callbacks
- `POST /api/webhook/toyyibpay` - Handle ToyyibPay payment callbacks
- `POST /api/webhook/test` - Test mode webhook for development

### Admin APIs (Protected)
- `POST /api/admin/login` - Admin authentication
- `GET /api/admin/dashboard` - Dashboard statistics and stock levels
- `POST /api/admin/codes/upload` - Upload coupon codes
- `GET /api/admin/orders` - List all orders with filters

## Data Architecture

### Database Schema (D1 SQLite)
```sql
- products (id, sku, title, amount_ae, price_original, price_now, image)
- coupon_codes (id, code, product_id, is_used, used_by_email, order_id)
- orders (id, order_number, email, product_id, quantity, subtotal, gateway, status, gateway_ref)
- order_events (id, order_id, type, payload, created_at)
- admin_sessions (id, token, expires_at)
```

### Storage Services
- **D1 Database**: Relational data storage for products, orders, codes
- **KV Storage**: Rate limiting and session management
- **localStorage**: Client-side cart persistence

## User Guide

### For Customers (Gamers)
1. **Browse Packages**: View all 5 AECOIN packages with gaming images
2. **Explore Gallery**: Check out GTA game screenshots and features
3. **Add to Cart**: Click "Add to Cart" on desired packages
4. **Checkout**: Review cart and proceed to secure checkout
5. **Payment**: Enter email and complete payment via ToyyibPay
6. **Receive Codes**: Check email for activation codes instantly
7. **Track Orders**: Visit `/orders` and enter email to see order history

### For Admins
1. **Access Admin**: Navigate to `/admin`
2. **Login**: Use admin password from environment variables
3. **View Dashboard**: Monitor sales, revenue, and stock levels
4. **Upload Codes**: Add new coupon codes for products
5. **Manage Orders**: View and track all customer orders

### Redeeming AECOIN Codes
1. Launch Grand Theft Auto Online 🎮
2. Navigate to the in-game store
3. Select "Redeem Code" option
4. Enter activation code from email
5. Confirm redemption and enjoy!

## Sample Products with Gaming Tiers
| Package | Badge | AECOIN | Original | Sale Price | Savings |
|---------|-------|--------|----------|------------|---------|
| Starter | 🎯 | 500 | RM 65 | RM 60 | 8% |
| Popular | ⭐ | 1000 | RM 110 | RM 98 | 11% |
| Best Value | 💎 | 3000 | RM 310 | RM 295 | 5% |
| Pro | 🚀 | 5000 | RM 510 | RM 490 | 4% |
| Ultimate | 👑 | 10000 | RM 1000 | RM 980 | 2% |

## Visual Features 🎨
- **Hero Slider**: 4 full-page gaming backgrounds with auto-rotation
- **Package Images**: Each tier has unique gaming artwork
- **Gallery Grid**: 8 interactive GTA-themed images
- **Animations**: Floating badges, pulse effects, hover zooms
- **Emojis**: Gaming-focused emojis throughout (🎮, 🔥, 💎, etc.)
- **Interactive Elements**: Hover effects, smooth transitions

## Payment Gateway Setup

### Stripe Integration (Primary - International)
1. **Get API Credentials**:
   - Sign up at https://stripe.com
   - Go to Developers → API Keys
   - Copy your Secret Key and Publishable Key
   
2. **Setup Webhook**:
   - Go to Developers → Webhooks
   - Add endpoint: `https://your-domain.com/api/webhook/stripe`
   - Select events: `checkout.session.completed`
   - Copy the webhook signing secret
   
3. **Test Cards**:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - 3D Secure: `4000 0025 0000 3155`
   
See full setup guide: [docs/STRIPE_SETUP.md](docs/STRIPE_SETUP.md)

### Billplz Integration (Malaysian)
1. **Get API Credentials**:
   - Sign up at https://www.billplz.com
   - Go to Settings → Account Settings → API Keys
   - Copy your API Secret Key

2. **Create Collection**:
   - Run setup script: `node scripts/setup-billplz.js`
   - Or manually create via Billplz dashboard
   - Copy the Collection ID

3. **Configure Webhooks** (Optional):
   - Set webhook URL: `https://your-domain.com/api/webhook/billplz`
   - Enable X-Signature for security

4. **Test in Sandbox**:
   - Use sandbox API: https://www.billplz-sandbox.com
   - Set `BILLPLZ_SANDBOX=true` for testing

### ToyyibPay Integration (Fallback)
1. Sign up at https://toyyibpay.com
2. Create a category for your store
3. Get Secret Key and Category Code from dashboard
4. Configure webhook URL: `https://your-domain.com/api/webhook/toyyibpay`

### Payment Flow
1. Customer selects payment method at checkout
2. System creates bill with selected gateway
3. Customer redirected to payment page (Billplz/ToyyibPay)
4. After payment, webhook updates order status
5. Activation codes sent via email automatically

## Deployment

### Tech Stack
- **Backend**: Hono Framework (TypeScript)
- **Frontend**: Vanilla JS with Tailwind CSS
- **Database**: Cloudflare D1 (SQLite)
- **Platform**: Cloudflare Pages/Workers
- **Payment**: ToyyibPay (Malaysia)
- **Email**: Resend API

### Environment Variables Required
```bash
# Stripe (Primary International Payment Gateway)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Billplz (Malaysian Payment Gateway)
BILLPLZ_API_KEY=your_billplz_api_secret_key
BILLPLZ_COLLECTION_ID=your_billplz_collection_id
BILLPLZ_X_SIGNATURE_KEY=your_x_signature_key_optional
BILLPLZ_SANDBOX=false

# ToyyibPay (Fallback Payment Gateway)
TOYYIBPAY_SECRET_KEY=your_toyyibpay_key
TOYYIBPAY_CATEGORY_CODE=your_category_code

# Email Service
RESEND_API_KEY=your_resend_key
RESEND_FROM_EMAIL=noreply@domain.com

# Admin & Security
ADMIN_PASSWORD=secure_password
APP_URL=https://your-domain.com
WEBHOOK_SECRET=random_secret
```

### Deployment Steps
1. Build: `npm run build`
2. Deploy: `npm run deploy`
3. Set secrets: `npx wrangler pages secret put KEY_NAME`

## Development
```bash
# Install dependencies
npm install

# Run locally
npm run dev:sandbox

# Build for production
npm run build

# Deploy to Cloudflare
npm run deploy
```

## Security Features 🔒
- ✅ Server-side price validation
- ✅ Rate limiting on checkout (5 requests/hour per email)
- ✅ Idempotent webhook processing
- ✅ Secure payment gateway signatures
- ✅ Admin authentication with session tokens
- ✅ SQL injection protection with prepared statements
- ✅ XSS protection with proper HTML escaping

## Recent Design Updates 🎨
- **Professional Headers**: Removed emoji icons from all section titles for cleaner look
- **Simplified Package Cards**: Removed colorful badges for minimalist design
- **Gaming Fonts**: Orbitron, Bebas Neue, and Russo One for gaming aesthetic
- **Character-Based Footer**: Gaming character silhouette with floating animation
- **Clean Branding**: No third-party references, pure AECOIN Store identity
- **Minimalist Dark Theme**: Professional black (#0D0D0D) with yellow (#FFD600) accents only
- **Subtle Interactions**: Professional hover effects and smooth transitions
- **Mobile-Optimized**: Fully responsive design for all devices

## Next Steps for Production
1. **Configure Payment Gateway**: Add real ToyyibPay/Billplz API credentials
2. **Setup Email Service**: Configure Resend API with verified domain
3. **Add SSL Certificate**: Configure custom domain with SSL
4. **Import Real Codes**: Upload actual AECOIN activation codes
5. **Enable Monitoring**: Setup error tracking and analytics
6. **Backup Strategy**: Configure regular database backups
7. **Legal Pages**: Add terms of service, privacy policy, refund policy
8. **Customer Support**: Add support ticket system or live chat
9. **Multi-language**: Add Malay language support for Malaysian market
10. **Marketing**: Setup SEO, social media integration, Discord community

## Support
For issues or questions, contact: support@aecoinstore.com

---
**Status**: ✅ Development Complete with Professional Gaming Design | Ready for Production Configuration
**Last Updated**: 2024
**Target Audience**: Young gamers and GTA Online enthusiasts