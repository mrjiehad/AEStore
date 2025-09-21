// Payment Method Selector for Checkout Page
let selectedPaymentMethod = 'billplz'; // Default to Billplz

function initPaymentSelector() {
    const checkoutForm = document.getElementById('checkout-form');
    if (!checkoutForm) return;

    // Add payment method selector to the form
    const paymentSection = document.createElement('div');
    paymentSection.className = 'mb-6';
    paymentSection.innerHTML = `
        <label class="block text-sm font-medium text-gray-300 mb-3">
            <i class="fas fa-credit-card mr-2"></i>
            Select Payment Method
        </label>
        <div class="grid grid-cols-2 gap-4">
            <!-- Billplz Option -->
            <div class="payment-option relative">
                <input type="radio" name="payment_method" value="billplz" id="payment_billplz" 
                       class="sr-only peer" checked>
                <label for="payment_billplz" 
                       class="block p-4 bg-[#1A1A1A] border-2 border-gray-700 rounded-lg cursor-pointer 
                              hover:border-[#FFD600] transition-all peer-checked:border-[#FFD600] 
                              peer-checked:bg-[#FFD600]/10">
                    <div class="flex items-center justify-between mb-2">
                        <img src="https://www.billplz.com/images/logo-billplz-primary.png" 
                             alt="Billplz" class="h-6">
                        <span class="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                            Recommended
                        </span>
                    </div>
                    <p class="text-sm text-gray-400 mt-2">
                        Pay with FPX Online Banking, Credit/Debit Cards
                    </p>
                    <div class="flex gap-2 mt-3">
                        <i class="fas fa-university text-gray-500"></i>
                        <i class="fab fa-cc-visa text-gray-500"></i>
                        <i class="fab fa-cc-mastercard text-gray-500"></i>
                    </div>
                </label>
            </div>

            <!-- ToyyibPay Option -->
            <div class="payment-option relative">
                <input type="radio" name="payment_method" value="toyyibpay" id="payment_toyyibpay" 
                       class="sr-only peer">
                <label for="payment_toyyibpay" 
                       class="block p-4 bg-[#1A1A1A] border-2 border-gray-700 rounded-lg cursor-pointer 
                              hover:border-[#FFD600] transition-all peer-checked:border-[#FFD600] 
                              peer-checked:bg-[#FFD600]/10">
                    <div class="flex items-center justify-between mb-2">
                        <span class="font-bold text-lg">ToyyibPay</span>
                        <span class="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                            Alternative
                        </span>
                    </div>
                    <p class="text-sm text-gray-400 mt-2">
                        Malaysian Payment Gateway with FPX
                    </p>
                    <div class="flex gap-2 mt-3">
                        <i class="fas fa-university text-gray-500"></i>
                        <i class="fas fa-mobile-alt text-gray-500"></i>
                    </div>
                </label>
            </div>
        </div>

        <!-- Payment Security Notice -->
        <div class="mt-4 p-3 bg-green-900/20 border border-green-700/50 rounded-lg">
            <p class="text-xs text-green-400">
                <i class="fas fa-lock mr-2"></i>
                All payments are processed securely through encrypted Malaysian payment gateways
            </p>
        </div>
    `;

    // Find the terms checkbox and insert payment selector before it
    const termsSection = checkoutForm.querySelector('.mb-6:last-child');
    if (termsSection) {
        checkoutForm.insertBefore(paymentSection, termsSection);
    }

    // Add event listeners for payment method selection
    document.querySelectorAll('input[name="payment_method"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            selectedPaymentMethod = e.target.value;
            console.log('Selected payment method:', selectedPaymentMethod);
            
            // Update button text based on selection
            const submitButton = checkoutForm.querySelector('button[type="submit"]');
            if (submitButton) {
                const methodName = selectedPaymentMethod === 'billplz' ? 'Billplz' : 'ToyyibPay';
                submitButton.innerHTML = `
                    <i class="fas fa-lock mr-2"></i>
                    Proceed to ${methodName}
                `;
            }
        });
    });
}

// Override the existing checkout function to include payment method
const originalProcessCheckout = window.processCheckout;
window.processCheckout = async function(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const terms = document.getElementById('terms').checked;
    
    if (!email || !terms) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    const cart = getCart();
    if (cart.length === 0) {
        showNotification('Your cart is empty', 'error');
        return;
    }
    
    const submitButton = event.target.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Processing...';
    
    try {
        const response = await fetch('/api/checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                items: cart,
                terms_accepted: terms,
                payment_method: selectedPaymentMethod // Include selected payment method
            })
        });
        
        const data = await response.json();
        
        if (data.success && data.data.payment_url) {
            // Clear cart
            localStorage.removeItem('cart');
            
            // Show success message
            showNotification('Redirecting to payment gateway...', 'success');
            
            // Redirect to payment URL
            setTimeout(() => {
                window.location.href = data.data.payment_url;
            }, 1500);
        } else {
            showNotification(data.error || 'Checkout failed', 'error');
            submitButton.disabled = false;
            submitButton.innerHTML = originalText;
        }
    } catch (error) {
        console.error('Checkout error:', error);
        showNotification('An error occurred. Please try again.', 'error');
        submitButton.disabled = false;
        submitButton.innerHTML = originalText;
    }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', initPaymentSelector);