// assets/js/cart.js - REHABACE Cart Functionality

// Initialize Cart from LocalStorage
let cart = JSON.parse(localStorage.getItem('rehabace_cart')) || [];
const paystackPublicKey = 'pk_live_4c70eb590578eaedff80c3ea23da34d711af4fec';

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Cart.js initialized');
    console.log('Current cart:', cart);
    
    // Get DOM Elements
    const cartIcon = document.getElementById('cart-icon-container');
    const cartModal = document.getElementById('cart-modal');
    const closeCartBtn = document.querySelector('.close-cart');
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartTotalElement = document.getElementById('cart-total-price');
    const cartCountBadge = document.getElementById('cart-count');
    const checkoutBtn = document.getElementById('checkout-btn');
    
    console.log('Cart icon found:', cartIcon);
    console.log('Cart modal found:', cartModal);
    console.log('Cart count badge found:', cartCountBadge);
    
    // Update UI on load
    updateCartUI(cart, cartCountBadge);
    
    // Define global cartAddItem function
    window.cartAddItem = function(product) {
        if (!product) {
            console.error('No product provided to cartAddItem');
            return;
        }
        
        console.log('Adding to cart:', product);
        console.log('Current cart before add:', cart);
        
        // Create cart product object with all necessary fields
        const cartProduct = {
            id: product.id || product.push || 'product-' + Date.now(),
            title: product.title || 'Product',
            price: product.price || 'Price on request',
            img: product.img || product.imageUrl || 'https://via.placeholder.com/300',
            quantity: 1,
            category: product.category || 'uncategorized'
        };
        
        // Check if item already exists
        const existingItemIndex = cart.findIndex(item => item.id === cartProduct.id);
        
        if (existingItemIndex !== -1) {
            // Item exists - increase quantity
            cart[existingItemIndex].quantity += 1;
            console.log('Increased quantity for:', cartProduct.title);
            showNotification(`Increased quantity: ${cartProduct.title}`, 'success');
        } else {
            // New item - add to cart
            cart.push(cartProduct);
            console.log('Added new item:', cartProduct.title);
            showNotification(`${cartProduct.title} added to cart!`, 'success');
        }
        
        // Save to localStorage
        localStorage.setItem('rehabace_cart', JSON.stringify(cart));
        console.log('Cart saved to localStorage:', cart);
        
        // Update UI
        updateCartUI(cart, cartCountBadge);
        
        // If modal is open, update it
        if (cartModal && cartModal.style.display === 'block') {
            renderCartItems(cart, cartItemsContainer, cartTotalElement);
        }
        
        // Return true for success
        return true;
    };
    
    // Cart icon click handler
    if (cartIcon) {
        cartIcon.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Cart icon clicked');
            if (cartModal) {
                // Get fresh cart data
                const freshCart = JSON.parse(localStorage.getItem('rehabace_cart')) || [];
                cart = freshCart; // Update global cart
                renderCartItems(cart, cartItemsContainer, cartTotalElement);
                cartModal.style.display = 'block';
            } else {
                console.error('Cart modal not found');
            }
        };
        console.log('Click handler attached to cart icon');
    } else {
        console.error('Cart icon element not found');
    }
    
    // Close modal with close button
    if (closeCartBtn) {
        closeCartBtn.onclick = function() {
            if (cartModal) cartModal.style.display = 'none';
        };
    }
    
    // Close modal when clicking outside
    window.onclick = function(e) {
        if (e.target === cartModal) {
            cartModal.style.display = 'none';
        }
    };
    
    // Checkout button
    if (checkoutBtn) {
        checkoutBtn.onclick = function() {
            // Get fresh cart data
            const freshCart = JSON.parse(localStorage.getItem('rehabace_cart')) || [];
            
            if (freshCart.length === 0) {
                showNotification('Your cart is empty', 'error');
                return;
            }
            
            if (typeof firebase !== 'undefined' && firebase.auth) {
                const user = firebase.auth().currentUser;
                if (user) {
                    payWithPaystackCart(freshCart, cartTotalElement, user.email);
                } else {
                    cartModal.style.display = 'none';
                    const authModal = document.getElementById('auth-modal');
                    if (authModal) authModal.style.display = 'block';
                    sessionStorage.setItem('postAuthAction', 'checkout');
                    showNotification('Please login to checkout', 'info');
                }
            } else {
                alert('Payment system unavailable');
            }
        };
    }
    
    // Migrate old cart data
    const oldCart = localStorage.getItem('rehabverve_cart');
    if (oldCart && !localStorage.getItem('rehabace_cart')) {
        try {
            cart = JSON.parse(oldCart);
            localStorage.setItem('rehabace_cart', JSON.stringify(cart));
            updateCartUI(cart, cartCountBadge);
            console.log('Migrated cart from rehabverve to rehabace');
        } catch (e) {
            console.log('Cart migration failed:', e);
        }
    }
});

// Update cart badge
function updateCartUI(cart, cartCountBadge) {
    if (cartCountBadge) {
        const totalItems = cart.reduce((acc, item) => acc + (item.quantity || 1), 0);
        cartCountBadge.textContent = totalItems;
        cartCountBadge.style.display = totalItems > 0 ? 'flex' : 'none';
        console.log('Cart badge updated:', totalItems);
    } else {
        console.error('Cart count badge not found in updateCartUI');
    }
}

// Render cart items in modal
function renderCartItems(cart, cartItemsContainer, cartTotalElement) {
    if (!cartItemsContainer) {
        console.error('Cart items container not found');
        return;
    }
    
    console.log('Rendering cart items:', cart);
    cartItemsContainer.innerHTML = '';
    let total = 0;
    
    if (!cart || cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="empty-cart-msg">
                <i class="bx bx-cart" style="font-size: 4rem; color: #ddd;"></i>
                <p style="margin-top: 10px;">Your cart is empty</p>
                <p style="font-size: 0.9rem; color: #666;">Browse our marketplace to add items</p>
            </div>
        `;
        if (cartTotalElement) cartTotalElement.textContent = '₦0.00';
        return;
    }
    
    cart.forEach(item => {
        // Clean price string to number
        let cleanPrice = 0;
        if (item.price) {
            const priceStr = item.price.toString().replace(/[^\d.]/g, '');
            cleanPrice = parseFloat(priceStr) || 0;
        }
        
        const itemTotal = cleanPrice * (item.quantity || 1);
        total += itemTotal;
        
        const itemDiv = document.createElement('div');
        itemDiv.className = 'cart-item';
        itemDiv.style.cssText = `
            display: flex;
            gap: 15px;
            margin-bottom: 15px;
            padding-bottom: 15px;
            border-bottom: 1px solid #eee;
        `;
        
        itemDiv.innerHTML = `
            <img src="${item.img || 'https://via.placeholder.com/60'}" 
                 alt="${item.title}" 
                 style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;">
            <div style="flex: 1;">
                <div style="font-weight: 600; margin-bottom: 5px;">${item.title}</div>
                <div style="color: #009688; font-weight: 600; margin-bottom: 8px;">₦${cleanPrice.toLocaleString()}</div>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <button onclick="updateCartItem('${item.id}', -1)" 
                            style="width: 28px; height: 28px; border-radius: 50%; border: 1px solid #ddd; background: #f5f5f5; cursor: pointer;">−</button>
                    <span style="min-width: 30px; text-align: center;">${item.quantity || 1}</span>
                    <button onclick="updateCartItem('${item.id}', 1)" 
                            style="width: 28px; height: 28px; border-radius: 50%; border: 1px solid #ddd; background: #f5f5f5; cursor: pointer;">+</button>
                    <button onclick="removeCartItem('${item.id}')" 
                            style="margin-left: 10px; color: #e74c3c; background: none; border: none; cursor: pointer; font-size: 1.2rem;">
                        <i class='bx bx-trash'></i>
                    </button>
                </div>
            </div>
        `;
        cartItemsContainer.appendChild(itemDiv);
    });
    
    if (cartTotalElement) {
        cartTotalElement.textContent = '₦' + total.toLocaleString();
        cartTotalElement.dataset.totalValue = total;
        console.log('Cart total:', total);
    }
}

// Global functions for cart operations
window.updateCartItem = function(id, change) {
    console.log('Updating cart item:', id, change);
    
    // Get fresh cart from localStorage
    let currentCart = JSON.parse(localStorage.getItem('rehabace_cart')) || [];
    const itemIndex = currentCart.findIndex(item => item.id === id);
    
    if (itemIndex !== -1) {
        const item = currentCart[itemIndex];
        const newQuantity = (item.quantity || 1) + change;
        
        if (newQuantity <= 0) {
            // Remove item
            currentCart = currentCart.filter(item => item.id !== id);
            showNotification('Item removed from cart', 'info');
        } else {
            // Update quantity
            currentCart[itemIndex].quantity = newQuantity;
        }
        
        // Save to localStorage
        localStorage.setItem('rehabace_cart', JSON.stringify(currentCart));
        
        // Update global cart variable
        cart = currentCart;
        
        // Update UI
        const cartCountBadge = document.getElementById('cart-count');
        updateCartUI(cart, cartCountBadge);
        
        const cartItemsContainer = document.getElementById('cart-items-container');
        const cartTotalElement = document.getElementById('cart-total-price');
        renderCartItems(cart, cartItemsContainer, cartTotalElement);
    }
};

window.removeCartItem = function(id) {
    console.log('Removing cart item:', id);
    
    // Get fresh cart from localStorage
    let currentCart = JSON.parse(localStorage.getItem('rehabace_cart')) || [];
    const removedItem = currentCart.find(item => item.id === id);
    
    currentCart = currentCart.filter(item => item.id !== id);
    
    // Save to localStorage
    localStorage.setItem('rehabace_cart', JSON.stringify(currentCart));
    
    // Update global cart variable
    cart = currentCart;
    
    // Update UI
    const cartCountBadge = document.getElementById('cart-count');
    updateCartUI(cart, cartCountBadge);
    
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartTotalElement = document.getElementById('cart-total-price');
    renderCartItems(cart, cartItemsContainer, cartTotalElement);
    
    if (removedItem) {
        showNotification(`${removedItem.title} removed from cart`, 'info');
    }
};

// Notification function
function showNotification(message, type) {
    // Remove any existing notification container
    const existingContainer = document.getElementById('cart-notification-container');
    if (existingContainer) {
        existingContainer.remove();
    }
    
    // Create new container
    const container = document.createElement('div');
    container.id = 'cart-notification-container';
    container.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        z-index: 10000;
    `;
    document.body.appendChild(container);
    
    // Create notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        background: ${type === 'success' ? '#009688' : type === 'error' ? '#e74c3c' : '#3498db'};
        color: white;
        padding: 12px 24px;
        border-radius: 50px;
        font-weight: 600;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease;
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
            if (container && container.parentNode) {
                container.remove();
            }
        }, 300);
    }, 3000);
}

// Paystack function
function payWithPaystackCart(cart, cartTotalElement, email) {
    const totalAmount = parseFloat(cartTotalElement.dataset.totalValue) * 100;
    
    const handler = PaystackPop.setup({
        key: paystackPublicKey,
        email: email,
        amount: totalAmount,
        currency: 'NGN',
        ref: 'REHABACE-' + Math.floor((Math.random() * 1000000000) + 1),
        metadata: {
            cart: cart
        },
        callback: function(response) {
            // Clear cart
            localStorage.removeItem('rehabace_cart');
            cart = [];
            
            // Update UI
            const cartCountBadge = document.getElementById('cart-count');
            updateCartUI(cart, cartCountBadge);
            
            document.getElementById('cart-modal').style.display = 'none';
            showNotification('Payment successful! Thank you for your order.', 'success');
            
            setTimeout(() => {
                window.location.href = `payment_successful.html?ref=${response.reference}`;
            }, 1500);
        },
        onClose: function() {
            showNotification('Transaction cancelled', 'info');
        }
    });
    handler.openIframe();
}

// Add animation styles
if (!document.getElementById('cart-animation-styles')) {
    const style = document.createElement('style');
    style.id = 'cart-animation-styles';
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}

// Log that cart.js is loaded
console.log('Cart.js loaded and ready');