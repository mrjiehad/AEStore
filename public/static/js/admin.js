// Admin panel
let adminToken = localStorage.getItem('admin_token');

// Check if logged in
async function checkAuth() {
    if (!adminToken) {
        showLoginForm();
        return false;
    }
    
    // Verify token by making a request
    try {
        const response = await axios.get('/api/admin/dashboard', {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });
        
        if (response.data.success) {
            showDashboard(response.data.data);
            return true;
        }
    } catch (error) {
        if (error.response?.status === 401) {
            localStorage.removeItem('admin_token');
            showLoginForm();
            return false;
        }
    }
}

// Show login form
function showLoginForm() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="min-h-screen flex items-center justify-center bg-[#0D0D0D]">
            <div class="bg-[#1A1A1A] rounded-lg p-8 w-full max-w-md">
                <h1 class="text-2xl font-bold mb-6 text-center">
                    <i class="fas fa-lock text-[#FFD600] mr-2"></i>
                    Admin Login
                </h1>
                
                <form id="login-form">
                    <div class="mb-6">
                        <label class="block text-sm font-medium mb-2">Admin Password</label>
                        <input type="password" 
                               id="password" 
                               required
                               class="w-full bg-[#0D0D0D] border border-gray-700 rounded-lg px-4 py-3 focus:border-[#FFD600] focus:outline-none">
                    </div>
                    
                    <button type="submit" 
                            class="w-full bg-[#FFD600] text-black py-3 rounded-lg font-bold hover:bg-yellow-400 transition">
                        Login
                    </button>
                </form>
                
                <div id="error-message" class="mt-4 text-red-500 text-center hidden"></div>
            </div>
        </div>
    `;
    
    document.getElementById('login-form').addEventListener('submit', handleLogin);
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();
    
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('error-message');
    
    try {
        const response = await axios.post('/api/admin/login', {
            password: password
        });
        
        if (response.data.success) {
            adminToken = response.data.data.token;
            localStorage.setItem('admin_token', adminToken);
            checkAuth();
        }
    } catch (error) {
        errorEl.textContent = 'Invalid password';
        errorEl.classList.remove('hidden');
    }
}

// Show dashboard
function showDashboard(data) {
    const app = document.getElementById('app');
    
    let stockHtml = '';
    data.stock_levels.forEach(stock => {
        const stockPercent = stock.total > 0 ? (stock.available / stock.total * 100).toFixed(1) : 0;
        const stockColor = stockPercent > 50 ? 'bg-green-500' : stockPercent > 20 ? 'bg-yellow-500' : 'bg-red-500';
        
        stockHtml += `
            <div class="bg-[#0D0D0D] rounded-lg p-4">
                <h4 class="font-bold mb-2">${stock.title}</h4>
                <p class="text-sm text-gray-400 mb-2">SKU: ${stock.sku}</p>
                <div class="flex justify-between text-sm mb-2">
                    <span>Available: ${stock.available}</span>
                    <span>Used: ${stock.used}</span>
                </div>
                <div class="bg-gray-700 rounded-full h-2">
                    <div class="${stockColor} rounded-full h-2" style="width: ${stockPercent}%"></div>
                </div>
            </div>
        `;
    });
    
    let ordersHtml = '';
    data.recent_orders.forEach(order => {
        const statusColor = order.status === 'paid' ? 'text-green-500' : 
                           order.status === 'pending' ? 'text-yellow-500' : 'text-red-500';
        
        ordersHtml += `
            <tr>
                <td class="px-4 py-3">${order.order_number}</td>
                <td class="px-4 py-3">${order.email}</td>
                <td class="px-4 py-3">${order.product_title}</td>
                <td class="px-4 py-3">RM ${order.subtotal.toFixed(2)}</td>
                <td class="px-4 py-3"><span class="${statusColor}">${order.status}</span></td>
                <td class="px-4 py-3 text-gray-400">${new Date(order.created_at).toLocaleDateString()}</td>
            </tr>
        `;
    });
    
    let html = `
        <!-- Header -->
        <header class="sticky top-0 z-50 bg-[#0D0D0D]/95 backdrop-blur-sm border-b border-[#FFD600]/20">
            <div class="container mx-auto px-4">
                <div class="flex items-center justify-between h-16">
                    <div class="flex items-center space-x-2">
                        <i class="fas fa-cog text-[#FFD600] text-2xl"></i>
                        <span class="text-xl font-bold">Admin Panel</span>
                    </div>
                    <button onclick="logout()" class="text-red-500 hover:text-red-400">
                        <i class="fas fa-sign-out-alt mr-2"></i>
                        Logout
                    </button>
                </div>
            </div>
        </header>

        <div class="container mx-auto px-4 py-8">
            <!-- Stats -->
            <div class="grid md:grid-cols-4 gap-6 mb-8">
                <div class="bg-[#1A1A1A] rounded-lg p-6">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-gray-400">Total Revenue</span>
                        <i class="fas fa-dollar-sign text-[#FFD600]"></i>
                    </div>
                    <p class="text-3xl font-bold">RM ${(data.stats.total_revenue || 0).toFixed(2)}</p>
                </div>
                
                <div class="bg-[#1A1A1A] rounded-lg p-6">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-gray-400">Paid Orders</span>
                        <i class="fas fa-check-circle text-green-500"></i>
                    </div>
                    <p class="text-3xl font-bold">${data.stats.total_paid_orders || 0}</p>
                </div>
                
                <div class="bg-[#1A1A1A] rounded-lg p-6">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-gray-400">Available Codes</span>
                        <i class="fas fa-ticket-alt text-blue-500"></i>
                    </div>
                    <p class="text-3xl font-bold">${data.stats.available_codes || 0}</p>
                </div>
                
                <div class="bg-[#1A1A1A] rounded-lg p-6">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-gray-400">Pending Orders</span>
                        <i class="fas fa-clock text-yellow-500"></i>
                    </div>
                    <p class="text-3xl font-bold">${data.stats.pending_orders || 0}</p>
                </div>
            </div>
            
            <!-- Stock Levels -->
            <div class="bg-[#1A1A1A] rounded-lg p-6 mb-8">
                <h2 class="text-xl font-bold mb-4">Stock Levels</h2>
                <div class="grid md:grid-cols-3 gap-4">
                    ${stockHtml}
                </div>
            </div>
            
            <!-- Upload Codes -->
            <div class="bg-[#1A1A1A] rounded-lg p-6 mb-8">
                <h2 class="text-xl font-bold mb-4">Upload Codes</h2>
                <form id="upload-form" class="flex gap-4">
                    <select id="product_id" class="bg-[#0D0D0D] border border-gray-700 rounded-lg px-4 py-2">
                        ${data.stock_levels.map(s => `<option value="${s.id}">${s.title}</option>`).join('')}
                    </select>
                    <textarea id="codes" 
                              placeholder="Enter codes (one per line)"
                              class="flex-1 bg-[#0D0D0D] border border-gray-700 rounded-lg px-4 py-2 h-24"></textarea>
                    <button type="submit" class="bg-[#FFD600] text-black px-6 py-2 rounded-lg font-bold hover:bg-yellow-400 transition">
                        Upload
                    </button>
                </form>
                <div id="upload-result" class="mt-4"></div>
            </div>
            
            <!-- Recent Orders -->
            <div class="bg-[#1A1A1A] rounded-lg p-6">
                <h2 class="text-xl font-bold mb-4">Recent Orders</h2>
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead>
                            <tr class="border-b border-gray-700">
                                <th class="text-left px-4 py-3">Order #</th>
                                <th class="text-left px-4 py-3">Email</th>
                                <th class="text-left px-4 py-3">Product</th>
                                <th class="text-left px-4 py-3">Total</th>
                                <th class="text-left px-4 py-3">Status</th>
                                <th class="text-left px-4 py-3">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${ordersHtml}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    app.innerHTML = html;
    
    // Add upload handler
    document.getElementById('upload-form').addEventListener('submit', handleUpload);
}

// Handle code upload
async function handleUpload(e) {
    e.preventDefault();
    
    const productId = document.getElementById('product_id').value;
    const codesText = document.getElementById('codes').value;
    const resultEl = document.getElementById('upload-result');
    
    const codes = codesText.split('\n').filter(c => c.trim());
    
    if (codes.length === 0) {
        resultEl.innerHTML = '<p class="text-red-500">Please enter at least one code</p>';
        return;
    }
    
    try {
        const response = await axios.post('/api/admin/codes/upload', {
            product_id: parseInt(productId),
            codes: codes
        }, {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });
        
        if (response.data.success) {
            const result = response.data.data;
            resultEl.innerHTML = `
                <p class="text-green-500">
                    ✓ Uploaded successfully! 
                    Inserted: ${result.inserted}, 
                    Duplicates: ${result.duplicates}
                </p>
            `;
            document.getElementById('codes').value = '';
            
            // Refresh dashboard
            setTimeout(() => checkAuth(), 2000);
        }
    } catch (error) {
        resultEl.innerHTML = `<p class="text-red-500">Failed to upload codes</p>`;
    }
}

// Logout
function logout() {
    localStorage.removeItem('admin_token');
    adminToken = null;
    showLoginForm();
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});