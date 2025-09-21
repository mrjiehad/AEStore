// Cart management
let cart = JSON.parse(localStorage.getItem('aecoin_cart') || '[]');

// Update cart count
function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const countEl = document.getElementById('cart-count');
    if (countEl) {
        countEl.textContent = count;
    }
}

// Open cart drawer
function openCart() {
    const drawer = document.getElementById('cart-drawer');
    if (drawer) {
        drawer.classList.remove('translate-x-full');
        updateCartDisplay();
    }
}

// Close cart drawer
function closeCart() {
    const drawer = document.getElementById('cart-drawer');
    if (drawer) {
        drawer.classList.add('translate-x-full');
    }
}

// Add to cart
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
    updateCartCount();
    
    // Show notification
    showNotification('Added to cart');
    
    // Open cart drawer
    openCart();
}

// Remove from cart
function removeFromCart(productId) {
    cart = cart.filter(item => item.product_id !== productId);
    localStorage.setItem('aecoin_cart', JSON.stringify(cart));
    updateCartCount();
    updateCartDisplay();
}

// Update cart quantity
function updateQuantity(productId, quantity) {
    const item = cart.find(item => item.product_id === productId);
    if (item) {
        item.quantity = Math.max(1, Math.min(10, quantity));
        localStorage.setItem('aecoin_cart', JSON.stringify(cart));
        updateCartCount();
        updateCartDisplay();
    }
}

// Update cart display
function updateCartDisplay() {
    const cartItemsEl = document.getElementById('cart-items');
    const cartTotalEl = document.getElementById('cart-total');
    
    if (!cartItemsEl || !cartTotalEl) return;
    
    if (cart.length === 0) {
        cartItemsEl.innerHTML = '<p class="text-gray-400 text-center">Your cart is empty</p>';
        cartTotalEl.textContent = 'RM 0.00';
        return;
    }
    
    let total = 0;
    let html = '';
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        html += `
            <div class="bg-[#0D0D0D] rounded-lg p-4">
                <div class="flex justify-between items-start mb-2">
                    <h4 class="font-bold">${item.product_title}</h4>
                    <button onclick="removeFromCart(${item.product_id})" class="text-red-500 hover:text-red-400">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="flex justify-between items-center">
                    <div class="flex items-center space-x-2">
                        <button onclick="updateQuantity(${item.product_id}, ${item.quantity - 1})" 
                                class="bg-gray-700 hover:bg-gray-600 w-8 h-8 rounded flex items-center justify-center">
                            <i class="fas fa-minus text-sm"></i>
                        </button>
                        <span class="w-10 text-center">${item.quantity}</span>
                        <button onclick="updateQuantity(${item.product_id}, ${item.quantity + 1})" 
                                class="bg-gray-700 hover:bg-gray-600 w-8 h-8 rounded flex items-center justify-center">
                            <i class="fas fa-plus text-sm"></i>
                        </button>
                    </div>
                    <span class="text-[#FFD600]">RM ${itemTotal.toFixed(2)}</span>
                </div>
            </div>
        `;
    });
    
    cartItemsEl.innerHTML = html;
    cartTotalEl.textContent = `RM ${total.toFixed(2)}`;
}

// Show notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-20 right-4 bg-[#FFD600] text-black px-6 py-3 rounded-lg shadow-lg transform translate-x-full transition-transform z-50 font-bold';
    notification.innerHTML = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 100);
    
    setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Package images for each tier
const packageImages = {
    500: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=400&auto=format&fit=crop',
    1000: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=400&auto=format&fit=crop',
    3000: 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?q=80&w=400&auto=format&fit=crop',
    5000: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=400&auto=format&fit=crop',
    10000: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?q=80&w=400&auto=format&fit=crop'
};

// Load featured packages on home page (ALL 5 packages in one row) - Using fetch instead of axios
async function loadFeaturedPackages() {
    const container = document.getElementById('featured-packages');
    if (!container) return;
    
    try {
        // Use fetch instead of axios for better compatibility
        const response = await fetch('/api/products');
        const data = await response.json();
        
        if (data.success) {
            const products = data.data; // Show ALL products
            
            let html = '';
            products.forEach(product => {
                const discount = Math.round((1 - product.price_now / product.price_original) * 100);
                const image = packageImages[product.amount_ae] || packageImages[500];
                
                // Simplified package card design - less colorful
                html += `
                    <div class="bg-[#0D0D0D] rounded-lg overflow-hidden border border-gray-800 hover:border-[#FFD600] transition-all transform hover:scale-105 hover:z-10 relative group">
                        <!-- Simple discount badge -->
                        <div class="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-bold z-10">
                            -${discount}%
                        </div>
                        
                        <!-- Package Image -->
                        <div class="relative h-32 overflow-hidden">
                            <img src="${image}" alt="${product.amount_ae} AECOIN" 
                                 class="w-full h-full object-cover group-hover:scale-110 transition duration-500">
                            <div class="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] to-transparent"></div>
                        </div>
                        
                        <!-- Content -->
                        <div class="p-4">
                            <!-- AECOIN Amount -->
                            <div class="text-center mb-3">
                                <p class="text-3xl font-bold text-[#FFD600] mb-1 orbitron">
                                    ${product.amount_ae}
                                </p>
                                <p class="text-xs text-gray-500 uppercase">AECOIN</p>
                            </div>
                            
                            <!-- Price -->
                            <div class="text-center mb-4">
                                <p class="text-gray-500 line-through text-sm">RM ${product.price_original.toFixed(2)}</p>
                                <p class="text-xl font-bold text-white">RM ${product.price_now.toFixed(2)}</p>
                            </div>
                            
                            <!-- Add to Cart Button -->
                            <button onclick="addToCart(${product.id}, '${product.title}', ${product.price_now})" 
                                    class="w-full bg-[#FFD600] text-black py-2 px-3 rounded font-bold hover:bg-yellow-400 transition text-sm uppercase">
                                Add to Cart
                            </button>
                        </div>
                    </div>
                `;
            });
            
            container.innerHTML = html;
        } else {
            // If API fails, show static fallback
            showStaticPackages();
        }
    } catch (error) {
        console.error('Error loading featured packages:', error);
        // Show static fallback on error
        showStaticPackages();
    }
}

// Static fallback for packages with simplified design
function showStaticPackages() {
    const container = document.getElementById('featured-packages');
    if (!container) return;
    
    // Static data matching our seed data
    const staticProducts = [
        { id: 1, title: '500 AECOIN Package', amount_ae: 500, price_original: 65, price_now: 60 },
        { id: 2, title: '1000 AECOIN Package', amount_ae: 1000, price_original: 110, price_now: 98 },
        { id: 3, title: '3000 AECOIN Package', amount_ae: 3000, price_original: 310, price_now: 295 },
        { id: 4, title: '5000 AECOIN Package', amount_ae: 5000, price_original: 510, price_now: 490 },
        { id: 5, title: '10000 AECOIN Package', amount_ae: 10000, price_original: 1000, price_now: 980 }
    ];
    
    let html = '';
    staticProducts.forEach(product => {
        const discount = Math.round((1 - product.price_now / product.price_original) * 100);
        const image = packageImages[product.amount_ae] || packageImages[500];
        
        html += `
            <div class="bg-[#0D0D0D] rounded-lg overflow-hidden border border-gray-800 hover:border-[#FFD600] transition-all transform hover:scale-105 hover:z-10 relative group">
                <!-- Simple discount badge -->
                <div class="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-bold z-10">
                    -${discount}%
                </div>
                
                <!-- Package Image -->
                <div class="relative h-32 overflow-hidden">
                    <img src="${image}" alt="${product.amount_ae} AECOIN" 
                         class="w-full h-full object-cover group-hover:scale-110 transition duration-500">
                    <div class="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] to-transparent"></div>
                </div>
                
                <!-- Content -->
                <div class="p-4">
                    <!-- AECOIN Amount -->
                    <div class="text-center mb-3">
                        <p class="text-3xl font-bold text-[#FFD600] mb-1 orbitron">
                            ${product.amount_ae}
                        </p>
                        <p class="text-xs text-gray-500 uppercase">AECOIN</p>
                    </div>
                    
                    <!-- Price -->
                    <div class="text-center mb-4">
                        <p class="text-gray-500 line-through text-sm">RM ${product.price_original.toFixed(2)}</p>
                        <p class="text-xl font-bold text-white">RM ${product.price_now.toFixed(2)}</p>
                    </div>
                    
                    <!-- Add to Cart Button -->
                    <button onclick="addToCart(${product.id}, '${product.title}', ${product.price_now})" 
                            class="w-full bg-[#FFD600] text-black py-2 px-3 rounded font-bold hover:bg-yellow-400 transition text-sm uppercase">
                        Add to Cart
                    </button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    loadFeaturedPackages();
});