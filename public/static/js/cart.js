// Load cart from localStorage
let cart = JSON.parse(localStorage.getItem('aecoin_cart') || '[]');

// Load and display cart
async function loadCart() {
    if (cart.length === 0) {
        displayEmptyCart();
        return;
    }
    
    try {
        const response = await axios.post('/api/cart/price', {
            items: cart.map(item => ({
                product_id: item.product_id,
                quantity: item.quantity
            }))
        });
        
        if (response.data.success) {
            displayCart(response.data.data);
        } else {
            showError(response.data.error || 'Failed to load cart');
        }
    } catch (error) {
        console.error('Error loading cart:', error);
        showError('Failed to load cart');
    }
}

// Display cart
function displayCart(cartData) {
    const app = document.getElementById('app');
    
    let itemsHtml = '';
    cartData.items.forEach(item => {
        const savings = (item.price_original - item.price) * item.quantity;
        itemsHtml += `
            <div class="bg-[#1A1A1A] rounded-lg p-6 mb-4">
                <div class="flex justify-between items-start">
                    <div>
                        <h3 class="text-xl font-bold mb-2">${item.product_title}</h3>
                        <p class="text-gray-400 mb-4">${item.amount_ae} AECOIN per package</p>
                        
                        <div class="flex items-center space-x-4 mb-4">
                            <div class="flex items-center space-x-2">
                                <button onclick="updateQuantity(${item.product_id}, ${item.quantity - 1})" 
                                        class="bg-gray-700 hover:bg-gray-600 w-10 h-10 rounded flex items-center justify-center">
                                    <i class="fas fa-minus"></i>
                                </button>
                                <span class="w-12 text-center text-lg">${item.quantity}</span>
                                <button onclick="updateQuantity(${item.product_id}, ${item.quantity + 1})" 
                                        class="bg-gray-700 hover:bg-gray-600 w-10 h-10 rounded flex items-center justify-center">
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                            
                            <button onclick="removeFromCart(${item.product_id})" 
                                    class="text-red-500 hover:text-red-400">
                                <i class="fas fa-trash mr-2"></i>
                                Remove
                            </button>
                        </div>
                    </div>
                    
                    <div class="text-right">
                        <p class="text-2xl font-bold text-[#FFD600]">RM ${item.total.toFixed(2)}</p>
                        <p class="text-gray-400 line-through">RM ${(item.price_original * item.quantity).toFixed(2)}</p>
                        <p class="text-green-500 text-sm">Save RM ${savings.toFixed(2)}</p>
                    </div>
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
                        <a href="/cart" class="text-[#FFD600]">Cart</a>
                        <a href="/orders" class="hover:text-[#FFD600] transition">My Orders</a>
                    </nav>
                </div>
            </div>
        </header>

        <!-- Cart Content -->
        <div class="container mx-auto px-4 py-12 max-w-6xl">
            <h1 class="text-3xl font-bold mb-8">Shopping Cart</h1>
            
            <div class="grid md:grid-cols-3 gap-8">
                <div class="md:col-span-2">
                    ${itemsHtml}
                    
                    <a href="/packages" class="inline-flex items-center text-[#FFD600] hover:text-yellow-400 mt-4">
                        <i class="fas fa-arrow-left mr-2"></i>
                        Continue Shopping
                    </a>
                </div>
                
                <!-- Cart Summary -->
                <div class="bg-[#1A1A1A] rounded-lg p-6 h-fit">
                    <h2 class="text-xl font-bold mb-4">Order Summary</h2>
                    
                    <div class="space-y-3 mb-6">
                        <div class="flex justify-between">
                            <span class="text-gray-400">Subtotal:</span>
                            <span>RM ${cartData.subtotal.toFixed(2)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-400">Discount:</span>
                            <span class="text-green-500">-RM ${cartData.items.reduce((sum, item) => sum + (item.price_original - item.price) * item.quantity, 0).toFixed(2)}</span>
                        </div>
                        <div class="border-t border-gray-700 pt-3">
                            <div class="flex justify-between">
                                <span class="text-lg font-bold">Total:</span>
                                <span class="text-2xl font-bold text-[#FFD600]">RM ${cartData.total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                    
                    <a href="/checkout" class="block bg-[#FFD600] text-black text-center py-3 rounded-lg font-bold hover:bg-yellow-400 transition">
                        <i class="fas fa-lock mr-2"></i>
                        Proceed to Checkout
                    </a>
                    
                    <div class="mt-4 text-center text-sm text-gray-400">
                        <i class="fas fa-shield-alt mr-1"></i>
                        Secure Checkout
                    </div>
                </div>
            </div>
        </div>
    `;
    
    app.innerHTML = html;
}

// Display empty cart
function displayEmptyCart() {
    const app = document.getElementById('app');
    app.innerHTML = `
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
                        <a href="/cart" class="text-[#FFD600]">Cart</a>
                        <a href="/orders" class="hover:text-[#FFD600] transition">My Orders</a>
                    </nav>
                </div>
            </div>
        </header>
        
        <!-- Empty Cart -->
        <div class="min-h-[60vh] flex items-center justify-center">
            <div class="text-center">
                <i class="fas fa-shopping-cart text-gray-600 text-6xl mb-4"></i>
                <h2 class="text-2xl font-bold mb-2">Your cart is empty</h2>
                <p class="text-gray-400 mb-6">Add some AECOIN packages to get started!</p>
                <a href="/packages" class="bg-[#FFD600] text-black px-8 py-3 rounded-lg font-bold hover:bg-yellow-400 transition">
                    Browse Packages
                </a>
            </div>
        </div>
    `;
}

// Update quantity
function updateQuantity(productId, newQuantity) {
    if (newQuantity < 1) {
        removeFromCart(productId);
        return;
    }
    
    if (newQuantity > 10) {
        alert('Maximum quantity is 10');
        return;
    }
    
    const item = cart.find(item => item.product_id === productId);
    if (item) {
        item.quantity = newQuantity;
        localStorage.setItem('aecoin_cart', JSON.stringify(cart));
        loadCart();
    }
}

// Remove from cart
function removeFromCart(productId) {
    if (confirm('Remove this item from cart?')) {
        cart = cart.filter(item => item.product_id !== productId);
        localStorage.setItem('aecoin_cart', JSON.stringify(cart));
        loadCart();
    }
}

// Show error
function showError(message) {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="min-h-screen flex items-center justify-center">
            <div class="text-center">
                <i class="fas fa-exclamation-circle text-red-500 text-6xl mb-4"></i>
                <h1 class="text-2xl font-bold mb-2">Error</h1>
                <p class="text-gray-400">${message}</p>
                <a href="/" class="mt-4 inline-block bg-[#FFD600] text-black px-6 py-2 rounded-lg font-bold hover:bg-yellow-400 transition">
                    Go Home
                </a>
            </div>
        </div>
    `;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadCart();
});