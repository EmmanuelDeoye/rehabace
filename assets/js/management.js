// assets/js/management.js - REHABACE Admin Panel

(function() {
    // Initialize Firebase
    if (typeof firebase === 'undefined') {
        console.error('Firebase not loaded');
        return;
    }

    const database = firebase.database();
    const auth = firebase.auth();
    
    // References
    const productsRef = database.ref('products');
    const ordersRef = database.ref('orders');
    const usersRef = database.ref('users');
    const deliveriesRef = database.ref('deliveries');
    
    // DOM Elements
    const loadingOverlay = document.getElementById('loading-overlay');
    const adminAccess = document.getElementById('admin-access-control');
    const adminDashboard = document.getElementById('admin-dashboard');
    const adminError = document.getElementById('admin-error');
    
    // Admin credentials (in production, this should be server-side)
    const ADMIN_CODE = 'REHABACE2025';
    const ADMIN_EMAIL = 'admin@rehabace.com';
    
    // State
    let currentAdmin = null;
    let products = [];
    let orders = [];
    let customers = [];
    let deliveries = [];
    let currentProductId = null;
    let currentOrderId = null;
    let currentDeleteId = null;
    let currentDeleteType = null;

    // Show loading overlay
    if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
    }

    // Check if already authenticated
    function checkAdminAuth() {
        const adminSession = sessionStorage.getItem('rehabace_admin');
        if (adminSession === 'authenticated') {
            showDashboard();
        } else {
            showAccess();
        }
        if (loadingOverlay) loadingOverlay.style.display = 'none';
    }

    // Show access form
    function showAccess() {
        if (adminAccess) adminAccess.style.display = 'flex';
        if (adminDashboard) adminDashboard.style.display = 'none';
    }

    // Show dashboard
    function showDashboard() {
        if (adminAccess) adminAccess.style.display = 'none';
        if (adminDashboard) adminDashboard.style.display = 'block';
        loadDashboardData();
    }

    // Admin login
    function adminLogin(email, password, code) {
        if (email !== ADMIN_EMAIL) {
            showError('Invalid admin email');
            return;
        }
        
        if (code !== ADMIN_CODE) {
            showError('Invalid access code');
            return;
        }
        
        // Show loading
        const loginBtn = document.getElementById('admin-login-btn');
        const originalText = loginBtn.innerHTML;
        loginBtn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Authenticating...';
        loginBtn.disabled = true;
        
        // Sign in with Firebase
        auth.signInWithEmailAndPassword(email, password)
            .then(userCredential => {
                currentAdmin = userCredential.user;
                sessionStorage.setItem('rehabace_admin', 'authenticated');
                showDashboard();
                showNotification('Admin login successful', 'success');
            })
            .catch(error => {
                console.error('Login error:', error);
                showError('Invalid password. Please use the correct admin password.');
            })
            .finally(() => {
                loginBtn.innerHTML = originalText;
                loginBtn.disabled = false;
            });
    }

    // Admin logout
    function adminLogout() {
        auth.signOut()
            .then(() => {
                currentAdmin = null;
                sessionStorage.removeItem('rehabace_admin');
                showAccess();
                showNotification('Logged out successfully', 'info');
            })
            .catch(error => {
                console.error('Logout error:', error);
            });
    }

    // Show error message
    function showError(message) {
        if (adminError) {
            adminError.textContent = message;
            adminError.style.display = 'block';
            setTimeout(() => {
                adminError.style.display = 'none';
            }, 5000);
        }
    }

    // Load all dashboard data
    function loadDashboardData() {
        loadProducts();
        loadOrders();
        loadCustomers();
        loadDeliveries();
        loadAnalytics();
    }

    // Load products
    function loadProducts() {
        productsRef.on('value', snapshot => {
            const data = snapshot.val();
            if (data) {
                products = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key]
                }));
            } else {
                products = [];
            }
            
            updateProductStats();
            renderProducts();
        });
    }

    // Update product stats
    function updateProductStats() {
        const statProducts = document.getElementById('stat-products');
        if (statProducts) {
            statProducts.textContent = products.length;
        }
    }

    // Render products
    function renderProducts() {
        const grid = document.getElementById('products-grid');
        if (!grid) return;
        
        const searchTerm = document.getElementById('product-search')?.value.toLowerCase() || '';
        const categoryFilter = document.getElementById('product-category-filter')?.value || 'all';
        
        let filtered = products;
        
        // Apply search
        if (searchTerm) {
            filtered = filtered.filter(p => 
                (p.title && p.title.toLowerCase().includes(searchTerm)) ||
                (p.description && p.description.toLowerCase().includes(searchTerm))
            );
        }
        
        // Apply category filter
        if (categoryFilter !== 'all') {
            filtered = filtered.filter(p => p.category && p.category.toLowerCase() === categoryFilter);
        }
        
        if (filtered.length === 0) {
            grid.innerHTML = '<div class="no-items-found">No products found</div>';
            return;
        }
        
        let html = '';
        filtered.forEach(product => {
            const inStock = product.stock > 0;
            const stockClass = inStock ? 'in-stock' : 'out-of-stock';
            const stockText = inStock ? `${product.stock} in stock` : 'Out of stock';
            const imageUrl = product.img || product.imageUrl || 'https://via.placeholder.com/300x300?text=No+Image';
            
            html += `
                <div class="admin-product-card" data-product-id="${product.id}">
                    <div class="admin-product-image">
                        <img src="${imageUrl}" alt="${product.title || 'Product'}" 
                             onerror="this.src='https://via.placeholder.com/300x300?text=No+Image'">
                        <span class="admin-product-badge ${stockClass}">${inStock ? 'In Stock' : 'Out of Stock'}</span>
                    </div>
                    <div class="admin-product-info">
                        <div class="admin-product-category">${product.category || 'Uncategorized'}</div>
                        <div class="admin-product-title">${product.title || 'Unnamed'}</div>
                        <div class="admin-product-price">${product.price || 'Price N/A'}</div>
                        <div class="admin-product-stock">${stockText}</div>
                        <div class="admin-product-actions">
                            <button class="admin-edit-btn" onclick="window.editProduct('${product.id}')">
                                <i class='bx bx-edit'></i>
                                <span>Edit</span>
                            </button>
                            <button class="admin-delete-btn" onclick="window.deleteProduct('${product.id}')">
                                <i class='bx bx-trash'></i>
                                <span>Delete</span>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        grid.innerHTML = html;
    }

    // Load orders
    function loadOrders() {
        ordersRef.on('value', snapshot => {
            const data = snapshot.val();
            if (data) {
                orders = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key]
                }));
            } else {
                orders = [];
            }
            
            updateOrderStats();
            renderOrders();
        });
    }

    // Update order stats
    function updateOrderStats() {
        const statOrders = document.getElementById('stat-orders');
        if (statOrders) {
            statOrders.textContent = orders.length;
        }
        
        const pendingDeliveries = orders.filter(o => o.status === 'pending' || o.status === 'processing').length;
        const statDeliveries = document.getElementById('stat-deliveries');
        if (statDeliveries) {
            statDeliveries.textContent = pendingDeliveries;
        }
    }

    // Render orders
    function renderOrders() {
        const list = document.getElementById('orders-list');
        if (!list) return;
        
        const statusFilter = document.getElementById('order-status-filter')?.value || 'all';
        
        let filtered = orders;
        if (statusFilter !== 'all') {
            filtered = filtered.filter(o => o.status === statusFilter);
        }
        
        // Sort by date (newest first)
        filtered.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        
        if (filtered.length === 0) {
            list.innerHTML = '<div class="no-items-found">No orders found</div>';
            return;
        }
        
        let html = '';
        filtered.forEach(order => {
            const status = order.status || 'pending';
            const date = order.timestamp ? new Date(order.timestamp).toLocaleDateString() : 'N/A';
            const customerName = order.customerName || order.customerEmail || 'Anonymous';
            const total = order.total || calculateOrderTotal(order);
            
            html += `
                <div class="order-card">
                    <div class="order-header">
                        <span class="order-id">#${order.id.slice(-8)}</span>
                        <span class="order-status ${status}">${status.toUpperCase()}</span>
                    </div>
                    <div class="order-customer">${escapeHtml(customerName)}</div>
                    <div class="order-total">₦${formatNumber(total)}</div>
                    <div class="order-date">${date}</div>
                    <div class="order-actions">
                        <button class="order-action-btn" onclick="window.viewOrder('${order.id}')">
                            <i class='bx bx-show'></i> View
                        </button>
                        <button class="order-action-btn" onclick="window.updateOrderStatus('${order.id}')">
                            <i class='bx bx-refresh'></i> Update
                        </button>
                    </div>
                </div>
            `;
        });
        
        list.innerHTML = html;
    }

    // Load customers
    function loadCustomers() {
        usersRef.on('value', snapshot => {
            const data = snapshot.val();
            if (data) {
                customers = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key]
                }));
            } else {
                customers = [];
            }
            
            updateCustomerStats();
            renderCustomers();
        });
    }

    // Update customer stats
    function updateCustomerStats() {
        const statCustomers = document.getElementById('stat-customers');
        if (statCustomers) {
            statCustomers.textContent = customers.length;
        }
    }

    // Render customers
    function renderCustomers() {
        const list = document.getElementById('customers-list');
        if (!list) return;
        
        const searchTerm = document.getElementById('customer-search')?.value.toLowerCase() || '';
        
        let filtered = customers;
        if (searchTerm) {
            filtered = filtered.filter(c => 
                (c.name && c.name.toLowerCase().includes(searchTerm)) ||
                (c.email && c.email.toLowerCase().includes(searchTerm))
            );
        }
        
        if (filtered.length === 0) {
            list.innerHTML = '<div class="no-items-found">No customers found</div>';
            return;
        }
        
        let html = '';
        filtered.forEach(customer => {
            const initials = getInitials(customer.name || customer.email || 'User');
            const orderCount = orders.filter(o => o.customerId === customer.id).length;
            
            html += `
                <div class="customer-card">
                    <div class="customer-avatar">${initials}</div>
                    <div class="customer-info">
                        <div class="customer-name">${escapeHtml(customer.name || 'Anonymous')}</div>
                        <div class="customer-email">${escapeHtml(customer.email || 'No email')}</div>
                        <div class="customer-meta">
                            <span><i class='bx bx-cart'></i> ${orderCount} orders</span>
                            <span><i class='bx bx-calendar'></i> ${formatJoinDate(customer.joined)}</span>
                        </div>
                    </div>
                </div>
            `;
        });
        
        list.innerHTML = html;
    }

    // Load deliveries
    function loadDeliveries() {
        deliveriesRef.on('value', snapshot => {
            const data = snapshot.val();
            if (data) {
                deliveries = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key]
                }));
            } else {
                deliveries = [];
            }
            
            updateDeliveryStats();
            renderDeliveries();
            renderDeliveryOptions();
        });
    }

    // Update delivery stats
    function updateDeliveryStats() {
        const pending = deliveries.filter(d => d.status === 'pending').length;
        const transit = deliveries.filter(d => d.status === 'transit').length;
        const delivered = deliveries.filter(d => d.status === 'delivered').length;
        
        const pendingEl = document.getElementById('pending-deliveries');
        const transitEl = document.getElementById('transit-deliveries');
        const deliveredEl = document.getElementById('delivered-deliveries');
        
        if (pendingEl) pendingEl.textContent = pending;
        if (transitEl) transitEl.textContent = transit;
        if (deliveredEl) deliveredEl.textContent = delivered;
    }

    // Render deliveries
    function renderDeliveries() {
        const list = document.getElementById('delivery-list');
        if (!list) return;
        
        if (deliveries.length === 0) {
            list.innerHTML = '<div class="no-items-found">No deliveries found</div>';
            return;
        }
        
        // Sort by date (newest first)
        deliveries.sort((a, b) => (b.date || 0) - (a.date || 0));
        
        let html = '';
        deliveries.forEach(delivery => {
            const status = delivery.status || 'pending';
            const date = delivery.estimatedDate ? new Date(delivery.estimatedDate).toLocaleDateString() : 'N/A';
            
            html += `
                <div class="delivery-card">
                    <div class="delivery-header">
                        <span class="delivery-id">Delivery #${delivery.id.slice(-8)}</span>
                        <span class="delivery-status ${status}">${status.toUpperCase()}</span>
                    </div>
                    <div class="delivery-info">
                        <div class="delivery-info-item">
                            <span class="delivery-info-label">Order</span>
                            <span class="delivery-info-value">#${delivery.orderId?.slice(-8) || 'N/A'}</span>
                        </div>
                        <div class="delivery-info-item">
                            <span class="delivery-info-label">Personnel</span>
                            <span class="delivery-info-value">${escapeHtml(delivery.personnel || 'Unassigned')}</span>
                        </div>
                        <div class="delivery-info-item">
                            <span class="delivery-info-label">Phone</span>
                            <span class="delivery-info-value">${escapeHtml(delivery.phone || 'N/A')}</span>
                        </div>
                        <div class="delivery-info-item">
                            <span class="delivery-info-label">Est. Delivery</span>
                            <span class="delivery-info-value">${date}</span>
                        </div>
                    </div>
                    <div class="delivery-actions">
                        <button class="order-action-btn" onclick="window.trackDelivery('${delivery.id}')">
                            <i class='bx bx-map'></i> Track
                        </button>
                        <button class="order-action-btn" onclick="window.updateDeliveryStatus('${delivery.id}')">
                            <i class='bx bx-check-circle'></i> Update
                        </button>
                    </div>
                </div>
            `;
        });
        
        list.innerHTML = html;
    }

    // Render delivery options in modal
    function renderDeliveryOptions() {
        const select = document.getElementById('delivery-order');
        if (!select) return;
        
        const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'processing');
        
        let options = '<option value="">Select Order</option>';
        pendingOrders.forEach(order => {
            options += `<option value="${order.id}">#${order.id.slice(-8)} - ${order.customerName || 'Customer'}</option>`;
        });
        
        select.innerHTML = options;
    }

    // Load analytics
    function loadAnalytics() {
        // Calculate total revenue
        const totalRevenue = orders
            .filter(o => o.status === 'delivered')
            .reduce((sum, o) => sum + (o.total || 0), 0);
        
        const totalRevenueEl = document.getElementById('total-revenue');
        if (totalRevenueEl) {
            totalRevenueEl.textContent = '₦' + formatNumber(totalRevenue);
        }
        
        // Calculate monthly orders
        const thisMonth = new Date().getMonth();
        const monthlyOrders = orders.filter(o => {
            if (!o.timestamp) return false;
            const date = new Date(o.timestamp);
            return date.getMonth() === thisMonth;
        }).length;
        
        const totalOrdersEl = document.getElementById('total-orders');
        if (totalOrdersEl) {
            totalOrdersEl.textContent = monthlyOrders;
        }
        
        // Calculate average order value
        const deliveredOrders = orders.filter(o => o.status === 'delivered');
        const avgOrder = deliveredOrders.length > 0 
            ? totalRevenue / deliveredOrders.length 
            : 0;
        
        const avgOrderEl = document.getElementById('avg-order');
        if (avgOrderEl) {
            avgOrderEl.textContent = '₦' + formatNumber(avgOrder);
        }
        
        // Calculate top categories
        renderTopCategories();
    }

    // Render top categories
    function renderTopCategories() {
        const container = document.getElementById('top-categories');
        if (!container) return;
        
        const categoryCount = {};
        orders.forEach(order => {
            if (order.items) {
                order.items.forEach(item => {
                    const cat = item.category || 'Other';
                    categoryCount[cat] = (categoryCount[cat] || 0) + 1;
                });
            }
        });
        
        const sorted = Object.entries(categoryCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        
        if (sorted.length === 0) {
            container.innerHTML = '<p>No data available</p>';
            return;
        }
        
        let html = '';
        sorted.forEach(([cat, count]) => {
            html += `
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span>${escapeHtml(cat)}</span>
                    <span style="font-weight: 600;">${count}</span>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }

    // Helper: Calculate order total
    function calculateOrderTotal(order) {
        if (!order.items) return 0;
        return order.items.reduce((sum, item) => {
            const price = extractPrice(item.price);
            return sum + (price * (item.quantity || 1));
        }, 0);
    }

    // Helper: Extract numeric price
    function extractPrice(priceString) {
        if (!priceString) return 0;
        const matches = String(priceString).match(/[\d,.]+/g);
        if (!matches) return 0;
        return parseFloat(matches[0].replace(/,/g, '')) || 0;
    }

    // Helper: Format number with commas
    function formatNumber(num) {
        return num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
    }

    // Helper: Escape HTML
    function escapeHtml(unsafe) {
        if (!unsafe) return '';
        return String(unsafe)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Helper: Get initials
    function getInitials(name) {
        if (!name) return 'U';
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    }

    // Helper: Format join date
    function formatJoinDate(timestamp) {
        if (!timestamp) return 'Recent';
        const date = new Date(timestamp);
        const now = new Date();
        const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
        
        if (diffDays < 30) return `${diffDays} days ago`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
        return `${Math.floor(diffDays / 365)} years ago`;
    }

    // Show add product modal
    window.showAddProductModal = function() {
        currentProductId = null;
        document.getElementById('product-modal-title').textContent = 'Add New Product';
        document.getElementById('product-form').reset();
        document.getElementById('product-modal').style.display = 'block';
    };

    // Edit product
    window.editProduct = function(productId) {
        const product = products.find(p => p.id === productId);
        if (!product) return;
        
        currentProductId = productId;
        document.getElementById('product-modal-title').textContent = 'Edit Product';
        
        // Fill form
        document.getElementById('product-title').value = product.title || '';
        document.getElementById('product-category').value = product.category || '';
        document.getElementById('product-price').value = product.price || '';
        document.getElementById('product-stock').value = product.stock || 0;
        document.getElementById('product-description').value = product.description || '';
        document.getElementById('product-image').value = product.img || product.imageUrl || '';
        document.getElementById('product-image2').value = product.img2 || '';
        document.getElementById('product-image3').value = product.img3 || '';
        document.getElementById('product-image4').value = product.img4 || '';
        document.getElementById('product-image5').value = product.img5 || '';
        document.getElementById('product-brand').value = product.brand || 'REHABACE';
        document.getElementById('product-weight').value = product.weight || '';
        document.getElementById('product-sku').value = product.sku || '';
        
        document.getElementById('product-modal').style.display = 'block';
    };

    // Delete product
    window.deleteProduct = function(productId) {
        currentDeleteId = productId;
        currentDeleteType = 'product';
        document.getElementById('delete-modal').style.display = 'block';
    };

    // Save product
    function saveProduct(event) {
        event.preventDefault();
        
        const productData = {
            title: document.getElementById('product-title').value,
            category: document.getElementById('product-category').value,
            price: document.getElementById('product-price').value,
            stock: parseInt(document.getElementById('product-stock').value) || 0,
            description: document.getElementById('product-description').value,
            img: document.getElementById('product-image').value,
            img2: document.getElementById('product-image2').value,
            img3: document.getElementById('product-image3').value,
            img4: document.getElementById('product-image4').value,
            img5: document.getElementById('product-image5').value,
            brand: document.getElementById('product-brand').value,
            weight: document.getElementById('product-weight').value,
            sku: document.getElementById('product-sku').value,
            timestamp: Date.now()
        };
        
        // Validate required fields
        if (!productData.title || !productData.category || !productData.price || !productData.img) {
            showNotification('Please fill all required fields', 'error');
            return;
        }
        
        const saveBtn = document.getElementById('save-product');
        const originalText = saveBtn.textContent;
        saveBtn.textContent = 'Saving...';
        saveBtn.disabled = true;
        
        const promise = currentProductId 
            ? productsRef.child(currentProductId).update(productData)
            : productsRef.push(productData);
        
        promise
            .then(() => {
                showNotification(currentProductId ? 'Product updated' : 'Product added', 'success');
                closeModal('product-modal');
            })
            .catch(error => {
                console.error('Save error:', error);
                showNotification('Error saving product', 'error');
            })
            .finally(() => {
                saveBtn.textContent = originalText;
                saveBtn.disabled = false;
            });
    }

    // View order
    window.viewOrder = function(orderId) {
        const order = orders.find(o => o.id === orderId);
        if (!order) return;
        
        currentOrderId = orderId;
        
        const content = document.getElementById('order-details-content');
        const actions = document.getElementById('order-actions');
        
        // Format items
        let itemsHtml = '';
        if (order.items && order.items.length > 0) {
            order.items.forEach(item => {
                itemsHtml += `
                    <tr>
                        <td>${escapeHtml(item.title || 'Product')}</td>
                        <td>${item.quantity || 1}</td>
                        <td>${item.price || 'N/A'}</td>
                        <td>₦${formatNumber((extractPrice(item.price) * (item.quantity || 1)))}</td>
                    </tr>
                `;
            });
        }
        
        content.innerHTML = `
            <div style="margin-bottom: 20px;">
                <p><strong>Order ID:</strong> ${order.id}</p>
                <p><strong>Customer:</strong> ${escapeHtml(order.customerName || 'N/A')}</p>
                <p><strong>Email:</strong> ${escapeHtml(order.customerEmail || 'N/A')}</p>
                <p><strong>Phone:</strong> ${escapeHtml(order.customerPhone || 'N/A')}</p>
                <p><strong>Address:</strong> ${escapeHtml(order.shippingAddress || 'N/A')}</p>
                <p><strong>Status:</strong> <span class="order-status ${order.status || 'pending'}">${(order.status || 'pending').toUpperCase()}</span></p>
                <p><strong>Date:</strong> ${order.timestamp ? new Date(order.timestamp).toLocaleString() : 'N/A'}</p>
                <p><strong>Payment Method:</strong> ${order.paymentMethod || 'N/A'}</p>
                <p><strong>Payment Status:</strong> ${order.paymentStatus || 'N/A'}</p>
            </div>
            
            <h3>Order Items</h3>
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                <thead>
                    <tr style="background: var(--secondary-color);">
                        <th style="padding: 10px; text-align: left;">Product</th>
                        <th style="padding: 10px; text-align: left;">Qty</th>
                        <th style="padding: 10px; text-align: left;">Price</th>
                        <th style="padding: 10px; text-align: left;">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="3" style="padding: 10px; text-align: right; font-weight: 600;">Total:</td>
                        <td style="padding: 10px; font-weight: 700; color: var(--primary-color);">₦${formatNumber(order.total || 0)}</td>
                    </tr>
                </tfoot>
            </table>
        `;
        
        // Status update buttons
        const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
        let buttonsHtml = '';
        statuses.forEach(status => {
            if (status !== order.status) {
                buttonsHtml += `
                    <button class="btn btn-outline" onclick="window.changeOrderStatus('${order.id}', '${status}')">
                        Mark as ${status}
                    </button>
                `;
            }
        });
        
        actions.innerHTML = buttonsHtml;
        
        document.getElementById('order-modal').style.display = 'block';
    };

    // Change order status
    window.changeOrderStatus = function(orderId, status) {
        ordersRef.child(orderId).update({ status: status })
            .then(() => {
                showNotification(`Order marked as ${status}`, 'success');
                closeModal('order-modal');
            })
            .catch(error => {
                console.error('Status update error:', error);
                showNotification('Error updating status', 'error');
            });
    };

    // Update order status (simplified)
    window.updateOrderStatus = function(orderId) {
        window.viewOrder(orderId);
    };

    // Show assign delivery modal
    window.showAssignDeliveryModal = function() {
        document.getElementById('delivery-modal').style.display = 'block';
    };

    // Assign delivery
    function assignDelivery(event) {
        event.preventDefault();
        
        const deliveryData = {
            orderId: document.getElementById('delivery-order').value,
            personnel: document.getElementById('delivery-person').value,
            phone: document.getElementById('delivery-phone').value,
            estimatedDate: document.getElementById('delivery-date').value,
            notes: document.getElementById('delivery-notes').value,
            status: 'pending',
            timestamp: Date.now()
        };
        
        if (!deliveryData.orderId || !deliveryData.personnel || !deliveryData.phone) {
            showNotification('Please fill all required fields', 'error');
            return;
        }
        
        const assignBtn = document.querySelector('#delivery-form button[type="submit"]');
        const originalText = assignBtn.textContent;
        assignBtn.textContent = 'Assigning...';
        assignBtn.disabled = true;
        
        // Update order status
        ordersRef.child(deliveryData.orderId).update({ status: 'processing' })
            .then(() => {
                return deliveriesRef.push(deliveryData);
            })
            .then(() => {
                showNotification('Delivery assigned successfully', 'success');
                closeModal('delivery-modal');
            })
            .catch(error => {
                console.error('Delivery assignment error:', error);
                showNotification('Error assigning delivery', 'error');
            })
            .finally(() => {
                assignBtn.textContent = originalText;
                assignBtn.disabled = false;
            });
    }

    // Track delivery
    window.trackDelivery = function(deliveryId) {
        const delivery = deliveries.find(d => d.id === deliveryId);
        if (!delivery) return;
        
        showNotification(`Delivery is ${delivery.status}`, 'info');
    };

    // Update delivery status
    window.updateDeliveryStatus = function(deliveryId) {
        const delivery = deliveries.find(d => d.id === deliveryId);
        if (!delivery) return;
        
        const statuses = ['pending', 'transit', 'delivered'];
        const currentIndex = statuses.indexOf(delivery.status);
        const nextStatus = statuses[(currentIndex + 1) % statuses.length];
        
        deliveriesRef.child(deliveryId).update({ status: nextStatus })
            .then(() => {
                if (nextStatus === 'delivered') {
                    // Also update order status
                    if (delivery.orderId) {
                        ordersRef.child(delivery.orderId).update({ status: 'delivered' });
                    }
                }
                showNotification(`Delivery status updated to ${nextStatus}`, 'success');
            })
            .catch(error => {
                console.error('Status update error:', error);
                showNotification('Error updating status', 'error');
            });
    };

    // Confirm delete
    window.confirmDelete = function() {
        if (!currentDeleteId || !currentDeleteType) return;
        
        let promise;
        if (currentDeleteType === 'product') {
            promise = productsRef.child(currentDeleteId).remove();
        }
        
        if (promise) {
            promise
                .then(() => {
                    showNotification(`${currentDeleteType} deleted successfully`, 'success');
                    closeModal('delete-modal');
                })
                .catch(error => {
                    console.error('Delete error:', error);
                    showNotification('Error deleting item', 'error');
                });
        }
    };

    // Export functions
    window.exportProducts = function() {
        exportData(products, 'products');
    };

    window.exportOrders = function() {
        exportData(orders, 'orders');
    };

    window.exportCustomers = function() {
        exportData(customers, 'customers');
    };

    // Export data as CSV
    function exportData(data, type) {
        if (!data || data.length === 0) {
            showNotification('No data to export', 'error');
            return;
        }
        
        let csv = '';
        
        if (type === 'products') {
            csv = 'ID,Title,Category,Price,Stock,Description,Image\n';
            data.forEach(p => {
                csv += `"${p.id}","${p.title || ''}","${p.category || ''}","${p.price || ''}",${p.stock || 0},"${(p.description || '').replace(/"/g, '""')}","${p.img || ''}"\n`;
            });
        } else if (type === 'orders') {
            csv = 'ID,Customer,Email,Total,Status,Date\n';
            data.forEach(o => {
                const date = o.timestamp ? new Date(o.timestamp).toLocaleDateString() : '';
                csv += `"${o.id}","${o.customerName || ''}","${o.customerEmail || ''}",${o.total || 0},"${o.status || ''}","${date}"\n`;
            });
        } else if (type === 'customers') {
            csv = 'ID,Name,Email,Orders\n';
            data.forEach(c => {
                const orderCount = orders.filter(o => o.customerId === c.id).length;
                csv += `"${c.id}","${c.name || ''}","${c.email || ''}",${orderCount}\n`;
            });
        }
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rehabace_${type}_${new Date().toISOString().slice(0,10)}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        showNotification(`${type} exported successfully`, 'success');
    }

    // Close modal
    function closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }

    // Show notification
    function showNotification(message, type = 'success') {
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.style.cssText = `
                position: fixed;
                top: 100px;
                right: 20px;
                z-index: 9999;
                display: flex;
                flex-direction: column;
                gap: 10px;
                pointer-events: none;
            `;
            document.body.appendChild(container);
        }
        
        const notification = document.createElement('div');
        notification.style.cssText = `
            background: ${type === 'success' ? 'var(--primary-color, #009688)' : 
                         type === 'error' ? '#e74c3c' : 
                         '#3498db'};
            color: white;
            padding: 12px 24px;
            border-radius: 50px;
            font-weight: 600;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            display: flex;
            align-items: center;
            gap: 10px;
            animation: slideInRight 0.3s ease forwards;
            pointer-events: auto;
            max-width: 300px;
            word-wrap: break-word;
        `;
        
        const icon = type === 'success' ? 'bx-check-circle' : 
                     type === 'error' ? 'bx-error-circle' : 
                     'bx-info-circle';
        
        notification.innerHTML = `
            <i class="bx ${icon}" style="font-size: 1.2rem;"></i>
            <span style="flex: 1;">${escapeHtml(message)}</span>
        `;
        
        container.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease forwards';
            setTimeout(() => {
                if (container.contains(notification)) {
                    container.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    window.showNotification = showNotification;

    // Event Listeners
    document.addEventListener('DOMContentLoaded', function() {
        checkAdminAuth();
        
        // Admin login
        const loginBtn = document.getElementById('admin-login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                const email = document.getElementById('admin-email').value;
                const password = document.getElementById('admin-password').value;
                const code = document.getElementById('admin-code').value;
                adminLogin(email, password, code);
            });
        }
        
        // Admin logout
        const logoutBtn = document.getElementById('admin-logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', adminLogout);
        }
        
        // Tab switching
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.addEventListener('click', function() {
                const tabName = this.dataset.tab;
                
                // Update tabs
                document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                
                // Update content
                document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
                document.getElementById(`${tabName}-tab`).classList.add('active');
            });
        });
        
        // Product filters
        const productSearch = document.getElementById('product-search');
        const categoryFilter = document.getElementById('product-category-filter');
        
        if (productSearch) {
            productSearch.addEventListener('input', renderProducts);
        }
        
        if (categoryFilter) {
            categoryFilter.addEventListener('change', renderProducts);
        }
        
        // Order filter
        const orderFilter = document.getElementById('order-status-filter');
        if (orderFilter) {
            orderFilter.addEventListener('change', renderOrders);
        }
        
        // Customer search
        const customerSearch = document.getElementById('customer-search');
        if (customerSearch) {
            customerSearch.addEventListener('input', renderCustomers);
        }
        
        // Add product button
        const addProductBtn = document.getElementById('add-product-btn');
        if (addProductBtn) {
            addProductBtn.addEventListener('click', window.showAddProductModal);
        }
        
        // Assign delivery button
        const assignDeliveryBtn = document.getElementById('assign-delivery-btn');
        if (assignDeliveryBtn) {
            assignDeliveryBtn.addEventListener('click', window.showAssignDeliveryModal);
        }
        
        // Product form
        const productForm = document.getElementById('product-form');
        if (productForm) {
            productForm.addEventListener('submit', saveProduct);
        }
        
        // Delivery form
        const deliveryForm = document.getElementById('delivery-form');
        if (deliveryForm) {
            deliveryForm.addEventListener('submit', assignDelivery);
        }
        
        // Password toggle
        const toggle = document.getElementById('admin-password-toggle');
        if (toggle) {
            toggle.addEventListener('click', function() {
                const input = document.getElementById('admin-password');
                const icon = this.querySelector('i');
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.className = 'bx bx-show';
                } else {
                    input.type = 'password';
                    icon.className = 'bx bx-hide';
                }
            });
        }
        
        // Modal close buttons
        document.querySelectorAll('.modal-close, #cancel-product, #cancel-delivery, #cancel-delete').forEach(btn => {
            btn.addEventListener('click', function() {
                const modal = this.closest('.modal');
                if (modal) modal.style.display = 'none';
            });
        });
        
        // Confirm delete
        const confirmDeleteBtn = document.getElementById('confirm-delete');
        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', window.confirmDelete);
        }
        
        // Export buttons
        const exportProducts = document.getElementById('export-products');
        const exportOrders = document.getElementById('export-orders');
        const exportCustomers = document.getElementById('export-customers');
        
        if (exportProducts) exportProducts.addEventListener('click', window.exportProducts);
        if (exportOrders) exportOrders.addEventListener('click', window.exportOrders);
        if (exportCustomers) exportCustomers.addEventListener('click', window.exportCustomers);
        
        // Apply date range
        const applyDate = document.getElementById('apply-date-range');
        if (applyDate) {
            applyDate.addEventListener('click', loadAnalytics);
        }
        
        // Close modals on outside click
        window.addEventListener('click', function(e) {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
        
        // Enter key for admin login
        document.getElementById('admin-password')?.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                loginBtn.click();
            }
        });
        
        document.getElementById('admin-code')?.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                loginBtn.click();
            }
        });
    });

    // Add animation styles
    if (!document.getElementById('admin-animation-styles')) {
        const style = document.createElement('style');
        style.id = 'admin-animation-styles';
        style.textContent = `
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes slideOutRight {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
            
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
})();