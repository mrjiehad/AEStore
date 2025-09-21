#!/usr/bin/env node

/**
 * Configuration Update Script for AECOIN Store
 * This script helps you update your configuration easily
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('=====================================');
  console.log('  AECOIN Store Configuration Helper');
  console.log('=====================================\n');
  
  const configPath = path.join(__dirname, '..', '.dev.vars');
  
  // Check if .dev.vars exists
  if (!fs.existsSync(configPath)) {
    console.log('Creating new .dev.vars file...\n');
  } else {
    console.log('Updating existing .dev.vars file...\n');
  }
  
  console.log('Please provide your configuration details:\n');
  
  // Get configuration from user
  const config = {};
  
  // Billplz Configuration
  console.log('--- BILLPLZ CONFIGURATION ---');
  const useBillplz = (await question('Do you want to configure Billplz? (yes/no): ')).toLowerCase() === 'yes';
  
  if (useBillplz) {
    config.BILLPLZ_API_KEY = await question('Billplz API Key: ');
    config.BILLPLZ_COLLECTION_ID = await question('Billplz Collection ID: ');
    config.BILLPLZ_X_SIGNATURE_KEY = await question('Billplz X-Signature Key (optional, press Enter to skip): ') || '';
    const isSandbox = (await question('Is this for sandbox? (yes/no): ')).toLowerCase() === 'yes';
    config.BILLPLZ_SANDBOX = isSandbox ? 'true' : 'false';
  }
  
  console.log('\n--- TOYYIBPAY CONFIGURATION (Optional) ---');
  const useToyyibPay = (await question('Do you want to configure ToyyibPay as fallback? (yes/no): ')).toLowerCase() === 'yes';
  
  if (useToyyibPay) {
    config.TOYYIBPAY_SECRET_KEY = await question('ToyyibPay Secret Key: ');
    config.TOYYIBPAY_CATEGORY_CODE = await question('ToyyibPay Category Code: ');
    config.TOYYIBPAY_API_URL = 'https://toyyibpay.com/index.php/api';
  }
  
  console.log('\n--- EMAIL CONFIGURATION (Optional) ---');
  const useEmail = (await question('Do you want to configure email for sending codes? (yes/no): ')).toLowerCase() === 'yes';
  
  if (useEmail) {
    config.RESEND_API_KEY = await question('Resend API Key: ');
    config.RESEND_FROM_EMAIL = await question('From Email Address: ');
  }
  
  console.log('\n--- ADMIN CONFIGURATION ---');
  config.ADMIN_PASSWORD = await question('Admin Password (current: admin123): ') || 'admin123';
  
  console.log('\n--- APPLICATION CONFIGURATION ---');
  config.APP_URL = await question('Your Application URL (e.g., https://your-domain.com): ') || 'http://localhost:3000';
  config.WEBHOOK_SECRET = await question('Webhook Secret (press Enter to generate): ') || 
    Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
  
  // Generate .dev.vars content
  let content = '# AECOIN Store Configuration\n';
  content += '# Generated: ' + new Date().toISOString() + '\n\n';
  
  if (useBillplz) {
    content += '# Billplz Payment Gateway (Primary)\n';
    content += `BILLPLZ_API_KEY=${config.BILLPLZ_API_KEY}\n`;
    content += `BILLPLZ_COLLECTION_ID=${config.BILLPLZ_COLLECTION_ID}\n`;
    if (config.BILLPLZ_X_SIGNATURE_KEY) {
      content += `BILLPLZ_X_SIGNATURE_KEY=${config.BILLPLZ_X_SIGNATURE_KEY}\n`;
    }
    content += `BILLPLZ_SANDBOX=${config.BILLPLZ_SANDBOX}\n\n`;
  }
  
  if (useToyyibPay) {
    content += '# ToyyibPay Payment Gateway (Fallback)\n';
    content += `TOYYIBPAY_SECRET_KEY=${config.TOYYIBPAY_SECRET_KEY}\n`;
    content += `TOYYIBPAY_CATEGORY_CODE=${config.TOYYIBPAY_CATEGORY_CODE}\n`;
    content += `TOYYIBPAY_API_URL=${config.TOYYIBPAY_API_URL}\n\n`;
  }
  
  if (useEmail) {
    content += '# Email Configuration\n';
    content += `RESEND_API_KEY=${config.RESEND_API_KEY}\n`;
    content += `RESEND_FROM_EMAIL=${config.RESEND_FROM_EMAIL}\n\n`;
  }
  
  content += '# Admin & Security\n';
  content += `ADMIN_PASSWORD=${config.ADMIN_PASSWORD}\n`;
  content += `APP_URL=${config.APP_URL}\n`;
  content += `WEBHOOK_SECRET=${config.WEBHOOK_SECRET}\n`;
  
  // Write to file
  fs.writeFileSync(configPath, content);
  
  console.log('\n✅ Configuration saved to .dev.vars');
  console.log('\n📋 Next Steps:');
  console.log('1. Restart the application: pm2 restart aecoin-store');
  console.log('2. Access admin panel at: /admin');
  console.log(`3. Your admin password is: ${config.ADMIN_PASSWORD}`);
  
  if (useBillplz) {
    console.log('\n🔔 Billplz Webhook URL:');
    console.log(`${config.APP_URL}/api/webhook/billplz`);
  }
  
  if (useToyyibPay) {
    console.log('\n🔔 ToyyibPay Webhook URL:');
    console.log(`${config.APP_URL}/api/webhook/toyyibpay`);
  }
  
  console.log('\n🚀 Your store is ready to accept payments!');
  
  rl.close();
}

// Run the script
main().catch(error => {
  console.error('Error:', error);
  rl.close();
});