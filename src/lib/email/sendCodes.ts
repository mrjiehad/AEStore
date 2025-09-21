import { Order, CouponCode } from '../../types';

interface EmailData {
  to: string;
  from: string;
  subject: string;
  html: string;
}

export class EmailService {
  private resendApiKey: string;
  private fromEmail: string;

  constructor(resendApiKey: string, fromEmail: string) {
    this.resendApiKey = resendApiKey;
    this.fromEmail = fromEmail;
  }

  async sendCouponCodes(order: Order, codes: CouponCode[], productTitle: string): Promise<void> {
    const emailHtml = this.generateEmailTemplate(order, codes, productTitle);
    
    const emailData: EmailData = {
      to: order.email,
      from: this.fromEmail,
      subject: `Your AECOIN codes - Order ${order.order_number}`,
      html: emailHtml
    };

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.resendApiKey}`
        },
        body: JSON.stringify(emailData)
      });

      if (!response.ok) {
        throw new Error(`Failed to send email: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Email send error:', error);
      // Fallback: Log codes for manual recovery
      console.log('Codes for manual recovery:', {
        order: order.order_number,
        email: order.email,
        codes: codes.map(c => c.code)
      });
    }
  }

  private generateEmailTemplate(order: Order, codes: CouponCode[], productTitle: string): string {
    const codesHtml = codes.map(code => `
      <div style="background: #FFD600; color: #0D0D0D; padding: 15px; margin: 10px 0; border-radius: 8px; font-size: 18px; font-weight: bold; text-align: center; font-family: monospace;">
        ${code.code}
      </div>
    `).join('');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background: #0D0D0D; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background: #1A1A1A; color: #FFFFFF;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #FFD600 0%, #FFA500 100%); padding: 40px 20px; text-align: center;">
      <h1 style="margin: 0; color: #0D0D0D; font-size: 32px;">🎮 AECOIN STORE</h1>
      <p style="margin: 10px 0 0; color: #0D0D0D; font-size: 16px;">Grand Theft Auto Online Currency</p>
    </div>

    <!-- Content -->
    <div style="padding: 40px 20px;">
      <h2 style="color: #FFD600; margin-bottom: 20px;">Your AECOIN Codes Are Ready!</h2>
      
      <p style="color: #CCCCCC; line-height: 1.6;">
        Thank you for your purchase! Your order <strong style="color: #FFD600;">#${order.order_number}</strong> has been processed successfully.
      </p>

      <div style="background: #2A2A2A; padding: 20px; border-radius: 8px; margin: 30px 0;">
        <h3 style="color: #FFD600; margin-top: 0;">Order Details:</h3>
        <p style="color: #CCCCCC; margin: 5px 0;">Product: <strong>${productTitle}</strong></p>
        <p style="color: #CCCCCC; margin: 5px 0;">Quantity: <strong>${order.quantity}</strong></p>
        <p style="color: #CCCCCC; margin: 5px 0;">Total: <strong>RM ${order.subtotal.toFixed(2)}</strong></p>
      </div>

      <h3 style="color: #FFD600; margin-top: 30px;">Your Activation Codes:</h3>
      ${codesHtml}

      <div style="background: #2A2A2A; padding: 20px; border-radius: 8px; margin: 30px 0;">
        <h3 style="color: #FFD600; margin-top: 0;">📖 How to Redeem Your AECOIN:</h3>
        <ol style="color: #CCCCCC; line-height: 1.8; padding-left: 20px;">
          <li>Launch Grand Theft Auto Online</li>
          <li>Navigate to the in-game store</li>
          <li>Select "Redeem Code" option</li>
          <li>Enter your activation code exactly as shown above</li>
          <li>Confirm redemption and enjoy your AECOIN!</li>
        </ol>
      </div>

      <div style="background: #FF4444; padding: 15px; border-radius: 8px; margin: 30px 0;">
        <p style="color: #FFFFFF; margin: 0; font-weight: bold;">⚠️ Important:</p>
        <p style="color: #FFFFFF; margin: 5px 0 0;">Keep these codes safe! Each code can only be redeemed once.</p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background: #0D0D0D; padding: 30px 20px; text-align: center;">
      <p style="color: #888888; margin: 0; font-size: 14px;">
        Need help? Contact support@aecoinstore.com
      </p>
      <p style="color: #666666; margin: 10px 0 0; font-size: 12px;">
        © 2024 AECOIN Store. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
    `;
  }
}