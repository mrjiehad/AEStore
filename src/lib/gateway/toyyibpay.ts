import { Order } from '../../types';

interface ToyyibPayBillRequest {
  categoryCode: string;
  billName: string;
  billDescription: string;
  billPriceSetting: number; // 1 for fixed price
  billPayorInfo: number; // 1 for mandatory email
  billAmount: number; // in sen (RM * 100)
  billReturnUrl: string;
  billCallbackUrl: string;
  billExternalReferenceNo: string;
  billTo: string;
  billEmail: string;
  billPhone: string;
  billPaymentChannel: string; // '0' for FPX, '1' for credit card, '2' for both
}

interface ToyyibPayBillResponse {
  BillCode: string;
  status: string;
  msg?: string;
}

export class ToyyibPayGateway {
  private apiUrl: string;
  private secretKey: string;
  private categoryCode: string;

  constructor(apiUrl: string, secretKey: string, categoryCode: string) {
    this.apiUrl = apiUrl;
    this.secretKey = secretKey;
    this.categoryCode = categoryCode;
  }

  async createBill(order: Order, returnUrl: string, callbackUrl: string): Promise<{ billCode: string; paymentUrl: string }> {
    const billData: ToyyibPayBillRequest = {
      categoryCode: this.categoryCode,
      billName: 'AECOIN Purchase',
      billDescription: `Order ${order.order_number}`,
      billPriceSetting: 1,
      billPayorInfo: 1,
      billAmount: Math.round(order.subtotal * 100), // Convert RM to sen
      billReturnUrl: returnUrl,
      billCallbackUrl: callbackUrl,
      billExternalReferenceNo: order.order_number,
      billTo: order.email,
      billEmail: order.email,
      billPhone: '0123456789', // Default phone
      billPaymentChannel: '2' // Both FPX and credit card
    };

    const formData = new URLSearchParams();
    Object.entries(billData).forEach(([key, value]) => {
      formData.append(key, value.toString());
    });
    formData.append('userSecretKey', this.secretKey);

    const response = await fetch(`${this.apiUrl}/createBill`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString()
    });

    const data: any = await response.json();

    if (data[0]?.BillCode) {
      return {
        billCode: data[0].BillCode,
        paymentUrl: `https://toyyibpay.com/${data[0].BillCode}`
      };
    }

    throw new Error(data[0]?.msg || 'Failed to create ToyyibPay bill');
  }

  async getBillStatus(billCode: string): Promise<any> {
    const formData = new URLSearchParams({
      billCode,
      billpaymentStatus: '1' // Get paid transactions only
    });

    const response = await fetch(`${this.apiUrl}/getBillTransactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString()
    });

    return response.json();
  }
}