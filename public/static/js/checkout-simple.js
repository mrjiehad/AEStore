// Simple checkout without payment selector (for test mode)
async function processCheckout(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const terms = document.getElementById('terms').checked;
    
    if (!email || !terms) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    // Get cart from localStorage
    const cart = JSON.parse(localStorage.getItem('aecoin_cart') || '[]');
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
                payment_method: 'test' // Always use test mode for now
            })
        });
        
        const data = await response.json();
        
        if (data.success && data.data.payment_url) {
            // Clear cart
            localStorage.removeItem('aecoin_cart');
            
            // Show success message
            showNotification('Redirecting to payment...', 'success');
            
            // Redirect to payment URL
            setTimeout(() => {
                window.location.href = data.data.payment_url;
            }, 1500);
        } else {
            showNotification(data.error || 'Checkout failed. Please try again.', 'error');
            submitButton.disabled = false;
            submitButton.innerHTML = originalText;
        }
    } catch (error) {
        console.error('Checkout error:', error);
        showNotification('An error occurred. Please try again.', 'error');
        submitButton.disabled = false;
        submitButton.innerHTML = originalText;
    }
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 px-6 py-4 rounded-lg shadow-lg z-50 ${
        type === 'success' ? 'bg-green-600' : 'bg-red-600'
    } text-white`;
    notification.innerHTML = `
        <div class="flex items-center">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-2"></i>
            <span>${message}</span>
        </div>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}