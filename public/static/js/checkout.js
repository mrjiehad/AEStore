// Load cart from localStorage
let cart = JSON.parse(localStorage.getItem('aecoin_cart') || '[]');
let cartTotal = 0;

// Load checkout page
async function loadCheckout() {
    if (cart.length === 0) {
        window.location.href = '/packages';
        return;
    }
    
    // Calculate cart price
    try {
        const response = await axios.post('/api/cart/price', {
            items: cart.map(item => ({
                product_id: item.product_id,
                quantity: item.quantity
            }))
        });
        
        if (response.data.success) {
            displayCheckout(response.data.data);
        } else {
            showError(response.data.error || 'Failed to calculate cart total');
        }
    } catch (error) {
        console.error('Error calculating cart:', error);
        showError('Failed to load checkout');
    }
}

// Display checkout page
function displayCheckout(cartData) {
    cartTotal = cartData.total;
    const app = document.getElementById('app');
    
    let itemsHtml = '';
    cartData.items.forEach(item => {
        itemsHtml += `
            <div class="flex justify-between py-3 border-b border-gray-700">
                <div>
                    <h4 class="font-bold">${item.product_title}</h4>
                    <p class="text-gray-400 text-sm">${item.amount_ae} AECOIN × ${item.quantity}</p>
                </div>
                <div class="text-right">
                    <p class="text-[#FFD600] font-bold">RM ${item.total.toFixed(2)}</p>
                    <p class="text-gray-400 line-through text-sm">RM ${(item.price_original * item.quantity).toFixed(2)}</p>
                </div>
            </div>
        `;
    });
    
    let html = `
        <!-- Header -->
        <header class="sticky top-0 z-50 bg-[#0D0D0D]/95 backdrop-blur-sm border-b border-[#FFD600]/20">
            <div class="container mx-auto px-4">
                <div class="flex items-center justify-between h-16">
                    <a href="/" class="flex items-center space-x-2">
                        <i class="fas fa-coins text-[#FFD600] text-2xl"></i>
                        <span class="text-xl font-bold">AECOIN STORE</span>
                    </a>
                    <nav class="hidden md:flex space-x-6">
                        <a href="/" class="hover:text-[#FFD600] transition">Home</a>
                        <a href="/packages" class="hover:text-[#FFD600] transition">Packages</a>
                        <a href="/orders" class="hover:text-[#FFD600] transition">My Orders</a>
                    </nav>
                </div>
            </div>
        </header>

        <!-- Checkout Content -->
        <div class="container mx-auto px-4 py-12 max-w-4xl">
            <h1 class="text-3xl font-bold mb-8">Checkout</h1>
            
            <div class="grid md:grid-cols-2 gap-8">
                <!-- Order Summary -->
                <div class="bg-[#1A1A1A] rounded-lg p-6">
                    <h2 class="text-xl font-bold mb-4">Order Summary</h2>
                    ${itemsHtml}
                    <div class="flex justify-between pt-4">
                        <span class="text-xl font-bold">Total:</span>
                        <span class="text-2xl font-bold text-[#FFD600]">RM ${cartTotal.toFixed(2)}</span>
                    </div>
                </div>
                
                <!-- Checkout Form -->
                <div class="bg-[#1A1A1A] rounded-lg p-6">
                    <h2 class="text-xl font-bold mb-4">Payment Details</h2>
                    <form id="checkout-form">
                        <div class="mb-6">
                            <label class="block text-sm font-medium mb-2">Email Address</label>
                            <input type="email" 
                                   id="email" 
                                   required
                                   placeholder="your@email.com"
                                   class="w-full bg-[#0D0D0D] border border-gray-700 rounded-lg px-4 py-3 focus:border-[#FFD600] focus:outline-none">
                            <p class="text-xs text-gray-400 mt-1">We'll send your codes to this email</p>
                        </div>
                        
                        <!-- Payment Method Selection -->
                        <div class="mb-6">
                            <label class="block text-sm font-medium mb-2">Payment Method</label>
                            <div class="grid grid-cols-2 gap-3">
                                <label class="relative">
                                    <input type="radio" name="payment_method" value="stripe" id="payment-stripe" checked class="peer sr-only">
                                    <div class="bg-[#0D0D0D] border-2 border-gray-700 rounded-lg p-4 cursor-pointer hover:border-[#FFD600]/50 peer-checked:border-[#FFD600] transition">
                                        <div class="flex items-center justify-center space-x-2">
                                            <i class="fab fa-stripe text-2xl text-purple-400"></i>
                                            <span class="font-semibold">Stripe</span>
                                        </div>
                                        <p class="text-xs text-gray-400 mt-2 text-center">Cards & FPX</p>
                                    </div>
                                </label>
                                
                                <label class="relative">
                                    <input type="radio" name="payment_method" value="test" id="payment-test" class="peer sr-only">
                                    <div class="bg-[#0D0D0D] border-2 border-gray-700 rounded-lg p-4 cursor-pointer hover:border-[#FFD600]/50 peer-checked:border-[#FFD600] transition">
                                        <div class="flex items-center justify-center space-x-2">
                                            <i class="fas fa-flask text-2xl text-yellow-400"></i>
                                            <span class="font-semibold">Test Mode</span>
                                        </div>
                                        <p class="text-xs text-gray-400 mt-2 text-center">No real payment</p>
                                    </div>
                                </label>
                            </div>
                        </div>
                        
                        <!-- Dynamic Notice Based on Selection -->
                        <div id="payment-notice" class="mb-6">
                            <!-- Will be updated dynamically -->
                        </div>
                        
                        <div class="mb-6">
                            <label class="flex items-center">
                                <input type="checkbox" id="terms" required class="mr-3">
                                <span class="text-sm">I accept the <a href="#" class="text-[#FFD600] hover:underline">terms and conditions</a></span>
                            </label>
                        </div>
                        
                        <button type="submit" 
                                id="checkout-btn"
                                class="w-full bg-[#FFD600] text-black py-3 rounded-lg font-bold hover:bg-yellow-400 transition">
                            <i class="fas fa-credit-card mr-2"></i>
                            Pay with Stripe RM ${cartTotal.toFixed(2)}
                        </button>
                    </form>
                    
                    <div class="mt-6 flex items-center justify-center space-x-4 text-gray-400 text-sm">
                        <i class="fas fa-shield-alt"></i>
                        <span>Secure Payment</span>
                        <i class="fas fa-lock"></i>
                        <span>SSL Encrypted</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    app.innerHTML = html;
    
    // Add form submission handler
    document.getElementById('checkout-form').addEventListener('submit', handleCheckout);
    
    // Add payment method change handlers
    const paymentRadios = document.querySelectorAll('input[name="payment_method"]');
    paymentRadios.forEach(radio => {
        radio.addEventListener('change', updatePaymentUI);
    });
    
    // Initialize payment UI
    updatePaymentUI();
}

// Update UI based on selected payment method
function updatePaymentUI() {
    const selectedMethod = document.querySelector('input[name="payment_method"]:checked').value;
    const noticeDiv = document.getElementById('payment-notice');
    const checkoutBtn = document.getElementById('checkout-btn');
    
    if (selectedMethod === 'stripe') {
        noticeDiv.innerHTML = `
            <div class="bg-purple-900/20 border border-purple-700/50 rounded-lg p-4">
                <div class="flex items-center text-purple-400">
                    <i class="fab fa-stripe mr-3 text-xl"></i>
                    <div>
                        <p class="font-bold">Stripe Payment Gateway</p>
                        <p class="text-sm text-purple-400/80">Secure payment via cards or FPX (Malaysian online banking)</p>
                        <p class="text-xs text-gray-400 mt-1">Test Mode: Use card 4242 4242 4242 4242</p>
                    </div>
                </div>
            </div>
        `;
        checkoutBtn.innerHTML = `<i class="fas fa-credit-card mr-2"></i>Pay with Stripe RM ${cartTotal.toFixed(2)}`;
    } else if (selectedMethod === 'test') {
        noticeDiv.innerHTML = `
            <div class="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4">
                <div class="flex items-center text-yellow-400">
                    <i class="fas fa-flask mr-3 text-xl"></i>
                    <div>
                        <p class="font-bold">Test Mode Active</p>
                        <p class="text-sm text-yellow-400/80">No real payment will be processed</p>
                        <p class="text-xs text-gray-400 mt-1">For development and testing purposes only</p>
                    </div>
                </div>
            </div>
        `;
        checkoutBtn.innerHTML = `<i class="fas fa-flask mr-2"></i>Test Payment RM ${cartTotal.toFixed(2)}`;
    }
}

// Handle checkout submission
async function handleCheckout(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const terms = document.getElementById('terms').checked;
    const paymentMethod = document.querySelector('input[name="payment_method"]:checked').value;
    const btn = document.getElementById('checkout-btn');
    
    if (!terms) {
        alert('Please accept the terms and conditions');
        return;
    }
    
    // Store original button text
    const originalBtnText = btn.innerHTML;
    
    // Disable button and show loading
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Processing...';
    
    try {
        const response = await axios.post('/api/checkout', {
            email: email,
            items: cart.map(item => ({
                product_id: item.product_id,
                quantity: item.quantity
            })),
            terms_accepted: terms,
            payment_method: paymentMethod
        });
        
        if (response.data.success) {
            // Clear cart
            localStorage.removeItem('aecoin_cart');
            
            // Show success message for test mode or redirect for real payment
            if (paymentMethod === 'test') {
                // For test mode, show success page
                showTestSuccess(response.data.data);
            } else {
                // Redirect to payment gateway (Stripe)
                window.location.href = response.data.data.payment_url;
            }
        } else {
            showError(response.data.error || 'Failed to process checkout');
            btn.disabled = false;
            btn.innerHTML = originalBtnText;
        }
    } catch (error) {
        console.error('Checkout error:', error);
        showError('Failed to process payment. Please try again.');
        btn.disabled = false;
        btn.innerHTML = originalBtnText;
    }
}

// Show test mode success
function showTestSuccess(data) {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="min-h-screen flex items-center justify-center p-4">
            <div class="bg-[#1A1A1A] rounded-lg p-8 max-w-md w-full text-center">
                <div class="text-green-500 text-6xl mb-4">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h2 class="text-2xl font-bold mb-4">Test Payment Successful!</h2>
                <p class="text-gray-400 mb-6">Your test order has been created successfully.</p>
                
                <div class="bg-[#0D0D0D] rounded-lg p-4 mb-6 text-left">
                    <p class="text-sm text-gray-400 mb-2">Order Number:</p>
                    <p class="font-mono text-[#FFD600] font-bold">${data.order_number}</p>
                    <p class="text-sm text-gray-400 mt-3 mb-2">Total Amount:</p>
                    <p class="text-xl font-bold">RM ${data.total}</p>
                    <p class="text-sm text-yellow-400 mt-3">
                        <i class="fas fa-flask mr-2"></i>
                        ${data.message || 'Test mode - No real payment processed'}
                    </p>
                </div>
                
                <div class="space-y-3">
                    <a href="/orders" class="block w-full bg-[#FFD600] text-black py-3 rounded-lg font-bold hover:bg-yellow-400 transition">
                        <i class="fas fa-receipt mr-2"></i>
                        View Orders
                    </a>
                    <a href="/" class="block w-full bg-gray-700 text-white py-3 rounded-lg font-bold hover:bg-gray-600 transition">
                        <i class="fas fa-home mr-2"></i>
                        Back to Home
                    </a>
                </div>
            </div>
        </div>
    `;
}

// Show error
function showError(message) {
    alert(message); // Simple alert for now
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadCheckout();
});