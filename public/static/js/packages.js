// Load cart from localStorage
let cart = JSON.parse(localStorage.getItem('aecoin_cart') || '[]');

// Load and display all packages
async function loadPackages() {
    try {
        const response = await axios.get('/api/products');
        if (response.data.success) {
            displayPackages(response.data.data);
        }
    } catch (error) {
        console.error('Error loading packages:', error);
        showError('Failed to load packages');
    }
}

// Display packages
function displayPackages(products) {
    const app = document.getElementById('app');
    
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
                        <a href="/packages" class="text-[#FFD600]">Packages</a>
                        <a href="/orders" class="hover:text-[#FFD600] transition">My Orders</a>
                    </nav>
                    <a href="/cart" class="relative">
                        <i class="fas fa-shopping-cart text-xl hover:text-[#FFD600] transition"></i>
                        <span class="absolute -top-2 -right-2 bg-[#FFD600] text-black text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                            ${cart.reduce((sum, item) => sum + item.quantity, 0)}
                        </span>
                    </a>
                </div>
            </div>
        </header>

        <!-- Page Content -->
        <div class="container mx-auto px-4 py-12">
            <h1 class="text-4xl font-bold mb-12">
                Choose Your <span class="text-[#FFD600]">AECOIN Package</span>
            </h1>
            
            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
    `;
    
    products.forEach(product => {
        const discount = Math.round((1 - product.price_now / product.price_original) * 100);
        html += `
            <div class="bg-[#1A1A1A] rounded-lg p-6 border border-gray-800 hover:border-[#FFD600] transition transform hover:scale-105">
                <div class="mb-4 flex justify-between items-start">
                    <h3 class="text-2xl font-bold">${product.amount_ae} AECOIN</h3>
                    <span class="bg-red-500 text-white px-2 py-1 rounded text-sm">-${discount}%</span>
                </div>
                
                <div class="mb-6">
                    <div class="text-gray-400 line-through text-lg">RM ${product.price_original.toFixed(2)}</div>
                    <div class="text-4xl font-bold text-[#FFD600]">RM ${product.price_now.toFixed(2)}</div>
                </div>
                
                <div class="space-y-2 mb-6">
                    <div class="flex items-center text-sm text-gray-400">
                        <i class="fas fa-check text-green-500 mr-2"></i>
                        Instant delivery
                    </div>
                    <div class="flex items-center text-sm text-gray-400">
                        <i class="fas fa-check text-green-500 mr-2"></i>
                        Secure payment
                    </div>
                    <div class="flex items-center text-sm text-gray-400">
                        <i class="fas fa-check text-green-500 mr-2"></i>
                        24/7 support
                    </div>
                </div>
                
                <button onclick="addToCart(${product.id}, '${product.title}', ${product.price_now})" 
                        class="w-full bg-[#FFD600] text-black py-3 rounded-lg font-bold hover:bg-yellow-400 transition">
                    <i class="fas fa-shopping-cart mr-2"></i>
                    Add to Basket
                </button>
            </div>
        `;
    });
    
    html += `
            </div>
        </div>
    `;
    
    app.innerHTML = html;
}

// Add to cart function
function addToCart(productId, productTitle, price) {
    const existingItem = cart.find(item => item.product_id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            product_id: productId,
            product_title: productTitle,
            price: price,
            quantity: 1
        });
    }
    
    localStorage.setItem('aecoin_cart', JSON.stringify(cart));
    
    // Show notification
    showNotification('Added to basket!');
    
    // Update cart count
    loadPackages(); // Reload to update cart count
}

// Show notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-20 right-4 bg-[#FFD600] text-black px-6 py-3 rounded-lg shadow-lg transform translate-x-0 transition-transform z-50';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
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
    loadPackages();
});