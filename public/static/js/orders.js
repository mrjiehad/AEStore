// Orders page
let userEmail = '';

// Load orders page
function loadOrdersPage() {
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
                        <a href="/packages" class="hover:text-[#FFD600] transition">Packages</a>
                        <a href="/orders" class="text-[#FFD600]">My Orders</a>
                    </nav>
                </div>
            </div>
        </header>

        <!-- Orders Content -->
        <div class="container mx-auto px-4 py-12 max-w-4xl">
            <h1 class="text-3xl font-bold mb-8">My Orders</h1>
            
            <div class="bg-[#1A1A1A] rounded-lg p-6">
                <p class="text-gray-400 mb-6">Enter your email address to view your order history</p>
                
                <form id="lookup-form" class="flex gap-4">
                    <input type="email" 
                           id="email" 
                           required
                           placeholder="your@email.com"
                           class="flex-1 bg-[#0D0D0D] border border-gray-700 rounded-lg px-4 py-3 focus:border-[#FFD600] focus:outline-none">
                    <button type="submit" 
                            class="bg-[#FFD600] text-black px-8 py-3 rounded-lg font-bold hover:bg-yellow-400 transition">
                        <i class="fas fa-search mr-2"></i>
                        Look Up Orders
                    </button>
                </form>
            </div>
            
            <div id="orders-list" class="mt-8">
                <!-- Orders will be displayed here -->
            </div>
        </div>
    `;
    
    app.innerHTML = html;
    
    // Add form handler
    document.getElementById('lookup-form').addEventListener('submit', handleOrderLookup);
}

// Handle order lookup
async function handleOrderLookup(e) {
    e.preventDefault();
    
    userEmail = document.getElementById('email').value;
    const ordersListEl = document.getElementById('orders-list');
    
    // Show loading
    ordersListEl.innerHTML = `
        <div class="text-center py-8">
            <i class="fas fa-spinner fa-spin text-4xl text-[#FFD600]"></i>
            <p class="mt-4 text-gray-400">Loading your orders...</p>
        </div>
    `;
    
    try {
        const response = await axios.get(`/api/orders/lookup?email=${encodeURIComponent(userEmail)}`);
        
        if (response.data.success) {
            displayOrders(response.data.data);
        } else {
            showError(response.data.error || 'Failed to fetch orders');
        }
    } catch (error) {
        console.error('Error fetching orders:', error);
        showError('Failed to fetch orders. Please try again.');
    }
}

// Display orders
function displayOrders(orders) {
    const ordersListEl = document.getElementById('orders-list');
    
    if (orders.length === 0) {
        ordersListEl.innerHTML = `
            <div class="bg-[#1A1A1A] rounded-lg p-8 text-center">
                <i class="fas fa-inbox text-gray-600 text-6xl mb-4"></i>
                <h3 class="text-xl font-bold mb-2">No Orders Found</h3>
                <p class="text-gray-400 mb-6">You don't have any orders with this email address.</p>
                <a href="/packages" class="bg-[#FFD600] text-black px-6 py-2 rounded-lg font-bold hover:bg-yellow-400 transition">
                    Shop Now
                </a>
            </div>
        `;
        return;
    }
    
    let html = '<div class="space-y-4">';
    
    orders.forEach(order => {
        const statusColor = order.status === 'paid' ? 'text-green-500' : 
                           order.status === 'pending' ? 'text-yellow-500' : 'text-red-500';
        const statusIcon = order.status === 'paid' ? 'fa-check-circle' : 
                          order.status === 'pending' ? 'fa-clock' : 'fa-times-circle';
        
        html += `
            <div class="bg-[#1A1A1A] rounded-lg p-6">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h3 class="text-xl font-bold mb-2">Order #${order.order_number}</h3>
                        <p class="text-gray-400 text-sm">${new Date(order.created_at).toLocaleString()}</p>
                    </div>
                    <div class="text-right">
                        <span class="${statusColor} font-bold">
                            <i class="fas ${statusIcon} mr-2"></i>
                            ${order.status.toUpperCase()}
                        </span>
                    </div>
                </div>
                
                <div class="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <p class="text-gray-400 text-sm">Product</p>
                        <p class="font-bold">${order.product_title}</p>
                    </div>
                    <div>
                        <p class="text-gray-400 text-sm">Quantity</p>
                        <p class="font-bold">${order.quantity} × ${order.amount_ae} AECOIN</p>
                    </div>
                </div>
                
                <div class="flex justify-between items-center pt-4 border-t border-gray-700">
                    <div>
                        <p class="text-gray-400 text-sm">Total Paid</p>
                        <p class="text-2xl font-bold text-[#FFD600]">RM ${order.subtotal.toFixed(2)}</p>
                    </div>
        `;
        
        if (order.status === 'paid' && order.masked_codes && order.masked_codes.length > 0) {
            html += `
                    <button onclick="viewOrderDetails('${order.order_number}')" 
                            class="bg-[#FFD600] text-black px-6 py-2 rounded-lg font-bold hover:bg-yellow-400 transition">
                        <i class="fas fa-eye mr-2"></i>
                        View Codes
                    </button>
            `;
        }
        
        html += `
                </div>
        `;
        
        if (order.status === 'paid' && order.masked_codes && order.masked_codes.length > 0) {
            html += `
                <div class="mt-4 p-4 bg-[#0D0D0D] rounded-lg">
                    <p class="text-sm text-gray-400 mb-2">Activation Codes (check your email for full codes):</p>
                    <div class="grid grid-cols-2 gap-2">
            `;
            
            order.masked_codes.forEach(code => {
                html += `<span class="font-mono text-sm text-[#FFD600]">${code}</span>`;
            });
            
            html += `
                    </div>
                </div>
            `;
        }
        
        html += `
            </div>
        `;
    });
    
    html += '</div>';
    ordersListEl.innerHTML = html;
}

// View order details
async function viewOrderDetails(orderNumber) {
    try {
        const response = await axios.get(`/api/orders/${orderNumber}?email=${encodeURIComponent(userEmail)}`);
        
        if (response.data.success) {
            displayOrderModal(response.data.data);
        } else {
            alert(response.data.error || 'Failed to fetch order details');
        }
    } catch (error) {
        console.error('Error fetching order details:', error);
        alert('Failed to fetch order details');
    }
}

// Display order modal
function displayOrderModal(order) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4';
    
    let codesHtml = '';
    if (order.masked_codes && order.masked_codes.length > 0) {
        codesHtml = '<div class="grid gap-2">';
        order.masked_codes.forEach(code => {
            codesHtml += `
                <div class="bg-[#FFD600] text-black p-3 rounded font-mono text-center font-bold">
                    ${code}
                </div>
            `;
        });
        codesHtml += '</div>';
    }
    
    modal.innerHTML = `
        <div class="bg-[#1A1A1A] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div class="p-6">
                <div class="flex justify-between items-start mb-6">
                    <h2 class="text-2xl font-bold">Order #${order.order_number}</h2>
                    <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-white">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                
                <div class="space-y-4">
                    <div>
                        <p class="text-gray-400 text-sm">Product</p>
                        <p class="font-bold">${order.product_title}</p>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <p class="text-gray-400 text-sm">Quantity</p>
                            <p class="font-bold">${order.quantity}</p>
                        </div>
                        <div>
                            <p class="text-gray-400 text-sm">Total</p>
                            <p class="font-bold text-[#FFD600]">RM ${order.subtotal.toFixed(2)}</p>
                        </div>
                    </div>
                    
                    <div>
                        <p class="text-gray-400 text-sm mb-2">Activation Codes</p>
                        ${codesHtml}
                        <p class="text-sm text-gray-400 mt-2">
                            <i class="fas fa-info-circle mr-1"></i>
                            Full codes have been sent to ${order.email}
                        </p>
                    </div>
                    
                    <div class="bg-[#0D0D0D] rounded-lg p-4">
                        <h3 class="font-bold mb-2">How to Redeem:</h3>
                        <ol class="list-decimal list-inside space-y-1 text-sm text-gray-400">
                            <li>Launch Grand Theft Auto Online</li>
                            <li>Navigate to the in-game store</li>
                            <li>Select "Redeem Code" option</li>
                            <li>Enter your activation code</li>
                            <li>Confirm redemption</li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Show error
function showError(message) {
    const ordersListEl = document.getElementById('orders-list');
    ordersListEl.innerHTML = `
        <div class="bg-red-500/10 border border-red-500 rounded-lg p-6 text-center">
            <i class="fas fa-exclamation-circle text-red-500 text-4xl mb-4"></i>
            <p class="text-red-500">${message}</p>
        </div>
    `;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadOrdersPage();
});