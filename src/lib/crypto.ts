export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `AE${timestamp}${random}`.toUpperCase();
}

export async function verifyToyyibPaySignature(
  payload: any,
  signature: string,
  secret: string
): Promise<boolean> {
  // ToyyibPay uses MD5 for signature verification
  // In Cloudflare Workers, we'll use Web Crypto API
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(payload) + secret);
  
  const hashBuffer = await crypto.subtle.digest('MD5', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const expectedSignature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return signature === expectedSignature;
}

export async function verifyBillplzSignature(
  payload: any,
  signature: string,
  secret: string
): Promise<boolean> {
  // Billplz uses SHA256 for X-Signature
  const source = Object.keys(payload)
    .filter(key => key !== 'x_signature')
    .sort()
    .map(key => `${key}${payload[key]}`)
    .join('|');
    
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(source)
  );
  
  const hashArray = Array.from(new Uint8Array(signatureBuffer));
  const expectedSignature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return signature === expectedSignature;
}

export async function hashPassword(password: string): Promise<string> {
  // Simple hash for admin password using Web Crypto API
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'aecoin-salt');
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}