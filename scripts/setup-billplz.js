#!/usr/bin/env node

/**
 * Setup script for Billplz integration
 * Run this script to create a collection and get your collection ID
 * 
 * Usage:
 * node scripts/setup-billplz.js
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createCollection(apiKey, title, isSandbox = false) {
  const apiUrl = isSandbox 
    ? 'https://www.billplz-sandbox.com/api' 
    : 'https://www.billplz.com/api';
    
  const url = `${apiUrl}/v3/collections`;
  
  const formData = new URLSearchParams({
    title: title,
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(apiKey + ':').toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Billplz API error: ${response.status} - ${error}`);
  }

  const collection = await response.json();
  return collection;
}

async function testBillCreation(apiKey, collectionId, isSandbox = false) {
  const apiUrl = isSandbox 
    ? 'https://www.billplz-sandbox.com/api' 
    : 'https://www.billplz.com/api';
    
  const url = `${apiUrl}/v3/bills`;
  
  const formData = new URLSearchParams({
    collection_id: collectionId,
    email: 'test@example.com',
    name: 'Test User',
    amount: '100', // RM1.00
    description: 'Test Bill - AECOIN Store',
    callback_url: 'https://example.com/webhook',
    redirect_url: 'https://example.com/success',
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(apiKey + ':').toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Billplz API error: ${response.status} - ${error}`);
  }

  const bill = await response.json();
  return bill;
}

async function main() {
  console.log('========================================');
  console.log('  Billplz Setup Script for AECOIN Store');
  console.log('========================================\n');
  
  try {
    const apiKey = await question('Enter your Billplz API Secret Key: ');
    const isSandbox = (await question('Is this for sandbox? (yes/no): ')).toLowerCase() === 'yes';
    const createNew = (await question('Do you want to create a new collection? (yes/no): ')).toLowerCase() === 'yes';
    
    if (createNew) {
      const title = await question('Enter collection title (e.g., "AECOIN Store"): ') || 'AECOIN Store';
      
      console.log('\nCreating collection...');
      const collection = await createCollection(apiKey, title, isSandbox);
      
      console.log('\n✅ Collection created successfully!');
      console.log('Collection ID:', collection.id);
      console.log('Collection Title:', collection.title);
      
      console.log('\n📋 Add these to your .env file:');
      console.log('================================');
      console.log(`BILLPLZ_API_KEY=${apiKey}`);
      console.log(`BILLPLZ_COLLECTION_ID=${collection.id}`);
      console.log(`BILLPLZ_SANDBOX=${isSandbox}`);
      console.log('================================\n');
      
      const testBill = (await question('Do you want to create a test bill? (yes/no): ')).toLowerCase() === 'yes';
      
      if (testBill) {
        console.log('\nCreating test bill...');
        const bill = await testBillCreation(apiKey, collection.id, isSandbox);
        
        console.log('\n✅ Test bill created successfully!');
        console.log('Bill ID:', bill.id);
        console.log('Payment URL:', bill.url);
        console.log('\nYou can test the payment flow by visiting the URL above.');
      }
      
    } else {
      const collectionId = await question('Enter your existing Collection ID: ');
      
      console.log('\n📋 Add these to your .env file:');
      console.log('================================');
      console.log(`BILLPLZ_API_KEY=${apiKey}`);
      console.log(`BILLPLZ_COLLECTION_ID=${collectionId}`);
      console.log(`BILLPLZ_SANDBOX=${isSandbox}`);
      console.log('================================\n');
    }
    
    console.log('\n✨ Setup complete! Next steps:');
    console.log('1. Add the environment variables to your .env file');
    console.log('2. Deploy your application');
    console.log('3. Set up webhook URL in Billplz dashboard (optional)');
    console.log('4. Test the payment flow\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
  
  rl.close();
}

// Run the setup
main();