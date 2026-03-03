// assets/js/marketplace.js - REHABACE marketplace functionality

(function() {
    // Initialize Firebase
    if (typeof firebase === 'undefined') {
        console.error('Firebase not loaded');
        return;
    }

    const database = firebase.database();
    const firebaseProductsCollection = database.ref('products');
    
    // DOM Elements
    const marketplaceItemsContainer = document.getElementById('marketplace-items');
    const loadingOverlay = document.getElementById('loading-overlay');
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');
    const sortBySelect = document.getElementById('sort-by');
    
    // State
    let allItems = [];
    let isInitialLoad = true;

    // Expose allItems globally for cart functions
    Object.defineProperty(window, 'allItems', {
        get: function() {
            return allItems;
        }
    });

    // Initialize ScrollReveal
    const sr = ScrollReveal({
        origin: 'bottom',
        distance: '30px',
        duration: 800,
        delay: 100,
        easing: 'cubic-bezier(0.5, 0, 0, 1)',
        reset: false
    });

    // Show loading overlay
    if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
    }

    // Helper: Extract numeric price
    function extractPrice(priceString) {
        if (!priceString) return 0;
        const matches = priceString.match(/[\d,.]+/g);
        if (!matches) return 0;
        return parseFloat(matches[0].replace(/,/g, '')) || 0;
    }

    // Sort items
    function sortItems(items, sortBy) {
        const sorted = [...items];
        
        switch(sortBy) {
            case 'newest':
                return sorted.sort((a, b) => (b.time || 0) - (a.time || 0));
            case 'oldest':
                return sorted.sort((a, b) => (a.time || 0) - (b.time || 0));
            case 'price-asc':
                return sorted.sort((a, b) => extractPrice(a.price) - extractPrice(b.price));
            case 'price-desc':
                return sorted.sort((a, b) => extractPrice(b.price) - extractPrice(a.price));
            default:
                return sorted;
        }
    }

    // Filter items by search and category
    function filterItems(items, searchTerm, category) {
        return items.filter(item => {
            const matchesSearch = !searchTerm || 
                item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.description?.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesCategory = category === 'all' || !category ||
                item.category?.toLowerCase() === category.toLowerCase();
            
            return matchesSearch && matchesCategory;
        });
    }

    // Check if item is in stock
    function isInStock(item) {
        if (item.stock === undefined && item.inStock === undefined && item.quantity === undefined) {
            return true; // Default to in stock if no stock info
        }
        
        const stock = item.stock !== undefined ? item.stock : 
                     (item.inStock !== undefined ? item.inStock : 
                     (item.quantity !== undefined ? item.quantity : 0));
        
        return stock > 0;
    }

    // Get stock status text
    function getStockStatus(item) {
        return isInStock(item) ? 'In Stock' : 'Out of Stock';
    }

    // Get stock status class
    function getStockClass(item) {
        return isInStock(item) ? 'in-stock' : 'out-of-stock';
    }

    // Check if item is in cart
    function isInCart(productId) {
        const cart = JSON.parse(localStorage.getItem('rehabace_cart') || '[]');
        return cart.some(item => item.id === productId);
    }

    // Get item quantity from cart
    function getCartQuantity(productId) {
        const cart = JSON.parse(localStorage.getItem('rehabace_cart') || '[]');
        const item = cart.find(item => item.id === productId);
        return item ? item.quantity || 1 : 0;
    }

    // Create product card HTML with dynamic cart controls
    function createProductCard(product) {
        const category = product.category || 'uncategorized';
        const price = product.price || 'Price on request';
        const imageUrl = product.img || product.imageUrl || 'https://via.placeholder.com/300x300?text=REHABACE';
        const productId = product.id || product.push || '';
        const inStock = isInStock(product);
        const stockStatus = getStockStatus(product);
        const stockClass = getStockClass(product);
        const inCart = isInCart(productId);
        const cartQuantity = getCartQuantity(productId);
        
        // Generate cart controls or add to cart button based on cart status
        let cartControls = '';
        if (inCart) {
            cartControls = `
                <div class="quantity-controls" data-product-id="${productId}">
                    <button class="qty-btn minus" onclick="window.updateCartQuantity('${productId}', -1, event)">
                        <i class='bx bx-minus'></i>
                    </button>
                    <span class="qty-value">${cartQuantity}</span>
                    <button class="qty-btn plus" onclick="window.updateCartQuantity('${productId}', 1, event)">
                        <i class='bx bx-plus'></i>
                    </button>
                </div>
            `;
        } else {
            cartControls = `
                <button class="add-to-cart-btn ${!inStock ? 'disabled' : ''}" 
                        onclick="window.addToCart('${productId}', event)" 
                        data-product-id="${productId}"
                        ${!inStock ? 'disabled' : ''}>
                    <i class='bx bx-cart-add'></i> 
                    ${inStock ? 'Add to Cart' : 'Out of Stock'}
                </button>
            `;
        }
        
        return `
            <div class="marketplace-card" data-product-id="${encodeURIComponent(productId)}">
                <div class="card-image">
                    <img src="${imageUrl}" alt="${product.title || 'Product'}" 
                         loading="lazy"
                         onerror="this.src='https://via.placeholder.com/300x300?text=No+Image'">
                    <span class="card-badge ${stockClass}">${stockStatus}</span>
                </div>
                <div class="card-content">
                    <h3 class="card-title">${product.title || 'Unnamed Product'}</h3>
                    <div class="card-price">${price}</div>
                    <div class="card-footer">
                        ${cartControls}
                    </div>
                </div>
            </div>
        `;
    }

    // Display items in grid
    function displayItems(items) {
        if (!marketplaceItemsContainer) return;

        if (!items || items.length === 0) {
            marketplaceItemsContainer.innerHTML = `
                <div class="no-items-found">
                    <i class='bx bx-package'></i>
                    <p>No items found</p>
                    <p class="suggestion">Try adjusting your search or filter</p>
                </div>
            `;
            return;
        }

        let html = '';
        items.forEach(product => {
            html += createProductCard(product);
        });

        marketplaceItemsContainer.innerHTML = html;

        // Add click handlers to cards for navigation
        document.querySelectorAll('.marketplace-card').forEach(card => {
            card.addEventListener('click', function(e) {
                // Don't redirect if clicking on buttons or quantity controls
                if (e.target.closest('.add-to-cart-btn') || 
                    e.target.closest('.qty-btn') || 
                    e.target.closest('.quantity-controls')) return;
                
                const productId = this.dataset.productId;
                if (productId) {
                    // Save scroll position before navigating
                    sessionStorage.setItem('marketplaceScroll', window.scrollY);
                    window.location.href = `display.html?push=${encodeURIComponent(productId)}`;
                }
            });
        });

        // Apply scroll reveal animations on initial load
        if (isInitialLoad && sr && typeof sr.reveal === 'function') {
            sr.reveal('.marketplace-card', { interval: 100 });
            isInitialLoad = false;
        }
    }

    // Update display based on current filters
    function updateDisplay() {
        const searchTerm = searchInput?.value || '';
        const category = categoryFilter?.value || 'all';
        const sortBy = sortBySelect?.value || 'newest';

        let filtered = filterItems(allItems, searchTerm, category);
        filtered = sortItems(filtered, sortBy);
        
        displayItems(filtered);
        
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    }

    // Load from cache first
    function loadFromCache() {
        const cachedData = sessionStorage.getItem('rehabace_marketplace');
        if (cachedData) {
            try {
                allItems = JSON.parse(cachedData);
                updateDisplay();
                console.log('Loaded marketplace from cache');
            } catch (e) {
                console.log('Cache read error');
            }
        }
    }

    // Fetch fresh data from Firebase
    function fetchFromFirebase() {
        firebaseProductsCollection.on('value', snapshot => {
            const productsData = snapshot.val();
            
            if (productsData) {
                allItems = Object.keys(productsData).map(key => ({
                    id: key,
                    ...productsData[key]
                }));
                
                // Save to cache
                sessionStorage.setItem('rehabace_marketplace', JSON.stringify(allItems));
                
                updateDisplay();
            } else {
                allItems = [];
                updateDisplay();
            }
            
            if (loadingOverlay) {
                loadingOverlay.style.display = 'none';
            }
        }, error => {
            console.error('Error fetching products:', error);
            if (loadingOverlay) {
                loadingOverlay.style.display = 'none';
            }
            
            // Show sample data on error
            showSampleData();
        });
    }

    // Sample data for demonstration
    function showSampleData() {
        const sampleProducts = [
            { title: 'Sensory Brush Set', price: '₦18,000', category: 'sensory materials', img: 'https://via.placeholder.com/300?text=Sensory+Brush', stock: 15 },
            { title: 'Therapy Swing', price: '₦45,000', category: 'sensory materials', img: 'https://via.placeholder.com/300?text=Therapy+Swing', stock: 5 },
            { title: 'Weighted Blanket', price: '₦25,000', category: 'weights', img: 'https://via.placeholder.com/300?text=Weighted+Blanket', stock: 0 },
            { title: 'Balance Board', price: '₦12,500', category: 'toys', img: 'https://via.placeholder.com/300?text=Balance+Board', stock: 8 },
            { title: 'Massage Roller', price: '₦8,500', category: 'massager', img: 'https://via.placeholder.com/300?text=Massage+Roller', stock: 12 },
            { title: 'Tactile Puzzle', price: '₦6,500', category: 'puzzle', img: 'https://via.placeholder.com/300?text=Tactile+Puzzle', stock: 3 },
            { title: 'Oral Motor Kit', price: '₦15,000', category: 'orals', img: 'https://via.placeholder.com/300?text=Oral+Motor', stock: 0 },
            { title: 'Sensory Balls Set', price: '₦9,500', category: 'ball', img: 'https://via.placeholder.com/300?text=Sensory+Balls', stock: 20 }
        ];
        
        allItems = sampleProducts.map((p, index) => ({ ...p, id: `sample${index}`, time: Date.now() - index * 86400000 }));
        updateDisplay();
    }

    // Event Listeners for filters
    if (searchInput) {
        searchInput.addEventListener('input', updateDisplay);
    }

    if (categoryFilter) {
        categoryFilter.addEventListener('change', updateDisplay);
    }

    if (sortBySelect) {
        sortBySelect.addEventListener('change', updateDisplay);
    }

    // Listen for cart updates to refresh buttons
    document.addEventListener('cart-updated', function() {
        updateDisplay(); // Refresh the display to update cart controls
    });

    // Restore scroll position
    const savedScroll = sessionStorage.getItem('marketplaceScroll');
    if (savedScroll) {
        window.scrollTo(0, parseInt(savedScroll));
        sessionStorage.removeItem('marketplaceScroll');
    }

    // Initialize
    loadFromCache();
    
    // Fetch fresh data after a short delay
    setTimeout(() => {
        fetchFromFirebase();
    }, 100);
})();

// Global function for add to cart - defined outside the IIFE to ensure global availability
window.addToCart = function(productId, event) {
    // Prevent event bubbling
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    console.log('Add to cart clicked for product:', productId);
    
    // Find the product from allItems (global)
    let product = null;
    
    if (window.allItems && Array.isArray(window.allItems)) {
        product = window.allItems.find(item => item.id === productId || item.push === productId);
    }
    
    if (!product) {
        console.error('Product not found:', productId);
        if (typeof window.showNotification === 'function') {
            window.showNotification('Product information not found', 'error');
        } else {
            alert('Product not found');
        }
        return;
    }
    
    // Check if product is in stock
    const inStock = product.stock === undefined ? true : product.stock > 0;
    if (!inStock) {
        if (typeof window.showNotification === 'function') {
            window.showNotification('This item is out of stock', 'error');
        } else {
            alert('This item is out of stock');
        }
        return;
    }
    
    // Call cart function directly
    if (window.cartAddItem && typeof window.cartAddItem === 'function') {
        window.cartAddItem(product);
        console.log('Called cartAddItem with product:', product);
        
        // Dispatch cart updated event
        document.dispatchEvent(new CustomEvent('cart-updated'));
    } else {
        console.error('cartAddItem function not found - make sure cart.js is loaded');
        // Fallback: try to dispatch event
        const event_detail = new CustomEvent('add-to-cart', { 
            detail: { 
                productId: productId,
                product: product
            } 
        });
        document.dispatchEvent(event_detail);
    }
    
    // Show visual feedback on button
    const button = event?.target?.closest('.add-to-cart-btn');
    if (button) {
        const originalText = button.innerHTML;
        const originalBackground = button.style.background;
        const originalColor = button.style.color;
        
        button.innerHTML = '<i class="bx bx-check"></i> Added!';
        button.style.background = 'var(--primary-color)';
        button.style.color = 'white';
        
        setTimeout(() => {
            button.innerHTML = originalText;
            button.style.background = originalBackground;
            button.style.color = originalColor;
        }, 2000);
    }
    
    // Show success notification
    if (typeof window.showNotification === 'function') {
        window.showNotification('Item added to cart!', 'success');
    }
};

// Global function to update cart quantity
window.updateCartQuantity = function(productId, change, event) {
    // Prevent event bubbling
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    console.log('Update quantity for product:', productId, 'change:', change);
    
    // Get cart from localStorage
    let cart = JSON.parse(localStorage.getItem('rehabace_cart') || '[]');
    const itemIndex = cart.findIndex(item => item.id === productId);
    
    if (itemIndex === -1) return;
    
    const item = cart[itemIndex];
    const newQuantity = (item.quantity || 1) + change;
    
    if (newQuantity <= 0) {
        // Remove item
        cart.splice(itemIndex, 1);
        if (typeof window.showNotification === 'function') {
            window.showNotification('Item removed from cart', 'info');
        }
    } else {
        // Check stock limit
        const product = window.allItems?.find(p => p.id === productId);
        const maxStock = product?.stock || Infinity;
        
        if (maxStock !== Infinity && newQuantity > maxStock) {
            if (typeof window.showNotification === 'function') {
                window.showNotification(`Only ${maxStock} available`, 'error');
            }
            return;
        }
        item.quantity = newQuantity;
    }
    
    // Save updated cart
    localStorage.setItem('rehabace_cart', JSON.stringify(cart));
    
    // Update cart count in header
    const cartCount = document.getElementById('cart-count');
    if (cartCount) {
        const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        cartCount.textContent = totalItems;
        cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
    }
    
    // Update the quantity display for this specific product
    const quantityDisplay = document.querySelector(`.quantity-controls[data-product-id="${productId}"] .qty-value`);
    if (quantityDisplay) {
        if (newQuantity > 0) {
            quantityDisplay.textContent = newQuantity;
        } else {
            // If item was removed, replace controls with add to cart button
            const card = document.querySelector(`.marketplace-card[data-product-id="${productId}"]`);
            if (card) {
                const footer = card.querySelector('.card-footer');
                const product = window.allItems?.find(p => p.id === productId);
                const inStock = product ? (product.stock === undefined ? true : product.stock > 0) : true;
                
                if (footer) {
                    footer.innerHTML = `
                        <button class="add-to-cart-btn ${!inStock ? 'disabled' : ''}" 
                                onclick="window.addToCart('${productId}', event)" 
                                data-product-id="${productId}"
                                ${!inStock ? 'disabled' : ''}>
                            <i class='bx bx-cart-add'></i> 
                            ${inStock ? 'Add to Cart' : 'Out of Stock'}
                        </button>
                    `;
                }
            }
        }
    }
    
    // Update cart modal if open
    const cartModal = document.getElementById('cart-modal');
    if (cartModal && cartModal.style.display === 'block' && typeof window.renderCartItems === 'function') {
        window.renderCartItems();
    }
    
    // Dispatch cart updated event
    document.dispatchEvent(new CustomEvent('cart-updated'));
};

// Local notification function (in case cart.js notification isn't available)
if (typeof window.showNotification !== 'function') {
    window.showNotification = function(message, type = 'success') {
        // Check if notification container exists
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
            `;
            document.body.appendChild(container);
        }
        
        // Create notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            background: ${type === 'success' ? 'var(--primary-color, #009688)' : type === 'error' ? '#e74c3c' : '#3498db'};
            color: white;
            padding: 12px 24px;
            border-radius: 50px;
            font-weight: 600;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            animation: slideIn 0.3s ease forwards;
            display: flex;
            align-items: center;
            gap: 10px;
        `;
        
        notification.innerHTML = `
            <i class="bx ${type === 'success' ? 'bx-check-circle' : type === 'error' ? 'bx-error-circle' : 'bx-info-circle'}"></i>
            <span>${message}</span>
        `;
        
        container.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => {
                if (container.contains(notification)) {
                    container.removeChild(notification);
                }
            }, 300);
        }, 3000);
    };
}

// Add animation styles if not already present
if (!document.getElementById('marketplace-animation-styles')) {
    const style = document.createElement('style');
    style.id = 'marketplace-animation-styles';
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
        
        /* Quantity Controls Styles */
        .quantity-controls {
            display: flex;
            align-items: center;
            gap: 8px;
            background: var(--secondary-color);
            border-radius: 40px;
            padding: 4px;
            border: 1px solid var(--border-color);
            width: fit-content;
        }
        
        .qty-btn {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            border: none;
            background: var(--card-bg);
            color: var(--text-main);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s ease;
            font-size: 1.1rem;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        
        .qty-btn:hover {
            background: var(--primary-color);
            color: white;
        }
        
        .qty-btn:active {
            transform: scale(0.95);
        }
        
        .qty-value {
            font-weight: 700;
            color: var(--text-main);
            min-width: 24px;
            text-align: center;
        }
        
        /* Dark mode adjustments */
        [data-theme="dark"] .qty-btn {
            background: var(--bg-color);
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        }
    `;
    document.head.appendChild(style);
}

// Log that marketplace.js is loaded
console.log('Marketplace.js loaded and ready with enhanced cart controls');