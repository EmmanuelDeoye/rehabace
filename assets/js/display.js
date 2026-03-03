// assets/js/display.js - REHABACE product display page

(function() {
    // Initialize Firebase
    if (typeof firebase === 'undefined') {
        console.error('Firebase not loaded');
        return;
    }

    const database = firebase.database();
    const firebaseProductsCollection = database.ref('products');
    
    // DOM Elements
    const loadingOverlay = document.getElementById('loading-overlay');
    const productWrapper = document.getElementById('product-display-wrapper');
    const relatedContainer = document.getElementById('related-products-container');
    const breadcrumbSpan = document.getElementById('breadcrumb-product');
    
    // Fullscreen modal elements
    const fullscreenModal = document.getElementById('fullscreen-modal');
    const fullscreenImage = document.getElementById('fullscreen-image');
    const fullscreenCaption = document.getElementById('fullscreen-caption');
    const fullscreenClose = document.querySelector('.fullscreen-close');
    const fullscreenPrev = document.getElementById('fullscreen-prev');
    const fullscreenNext = document.getElementById('fullscreen-next');
    
    // State
    let currentProduct = null;
    let allProducts = [];
    let currentImageIndex = 0;
    let productImages = [];

    // Show loading overlay
    if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
    }

    // Helper: Escape HTML to prevent XSS and handle special characters
    function escapeHtml(unsafe) {
        if (!unsafe) return '';
        return String(unsafe)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;")
            .replace(/\//g, "&#047;");
    }

    // Helper: Extract numeric price
    function extractPrice(priceString) {
        if (!priceString) return 0;
        const matches = String(priceString).match(/[\d,.]+/g);
        if (!matches) return 0;
        return parseFloat(matches[0].replace(/,/g, '')) || 0;
    }

    // Format price
    function formatPrice(price) {
        if (!price) return 'Price on request';
        if (typeof price === 'number') {
            return '₦' + price.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
        }
        return String(price);
    }

    // Check if item is in stock
    function isInStock(item) {
        if (!item) return false;
        if (item.stock === undefined && item.inStock === undefined && item.quantity === undefined) {
            return true;
        }
        
        const stock = item.stock !== undefined ? item.stock : 
                     (item.inStock !== undefined ? item.inStock : 
                     (item.quantity !== undefined ? item.quantity : 0));
        
        return parseInt(stock) > 0;
    }

    // Get stock quantity
    function getStockQuantity(item) {
        if (!item) return 0;
        return item.stock !== undefined ? item.stock : 
               (item.quantity !== undefined ? item.quantity : 0);
    }

    // Get all product images
    function getProductImages(product) {
        const images = [];
        
        // Add main image
        if (product.img) images.push(product.img);
        if (product.imageUrl && !images.includes(product.imageUrl)) images.push(product.imageUrl);
        
        // Add additional images (img2, img3, img4, etc.)
        for (let i = 2; i <= 10; i++) {
            const imgKey = `img${i}`;
            if (product[imgKey]) {
                images.push(product[imgKey]);
            }
        }
        
        // If no images, add placeholder
        if (images.length === 0) {
            images.push('https://via.placeholder.com/800x800?text=REHABACE');
        }
        
        return images;
    }

    // Get product ID from URL
    function getProductIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('push') || urlParams.get('id');
    }

    // Render thumbnail strip
    function renderThumbnails(images, activeIndex = 0) {
        if (!images || images.length === 0) return '';
        
        let html = '';
        images.forEach((img, index) => {
            const escapedImg = escapeHtml(img);
            html += `
                <div class="thumbnail-item ${index === activeIndex ? 'active' : ''}" 
                     onclick="window.changeImage(${index})">
                    <img src="${escapedImg}" alt="Thumbnail ${index + 1}" 
                         onerror="this.src='https://via.placeholder.com/100x100?text=No+Image'">
                </div>
            `;
        });
        return html;
    }

    // Render product display
    function renderProduct(product) {
        if (!product) {
            productWrapper.innerHTML = `
                <div class="no-items-found">
                    <i class='bx bx-error-circle'></i>
                    <p>Product not found</p>
                    <a href="marketplace.html" class="btn btn-primary" style="display: inline-block; margin-top: 20px;">
                        Back to Marketplace
                    </a>
                </div>
            `;
            return;
        }

        // Update breadcrumb
        if (breadcrumbSpan) {
            breadcrumbSpan.textContent = product.title || 'Product Details';
        }

        // Get all images
        productImages = getProductImages(product);
        currentImageIndex = 0;

        const inStock = isInStock(product);
        const stockStatus = inStock ? 'In Stock' : 'Out of Stock';
        const stockClass = inStock ? 'in-stock' : 'out-of-stock';
        const stockIcon = inStock ? 'bx-check-circle' : 'bx-x-circle';
        const stockQuantity = getStockQuantity(product);
        
        // Get meta information with escaping
        const category = escapeHtml(product.category || 'Uncategorized');
        const sku = escapeHtml(product.sku || product.id || 'N/A');
        const brand = escapeHtml(product.brand || 'REHABACE');
        const weight = escapeHtml(product.weight || 'N/A');
        const title = escapeHtml(product.title || 'Unnamed Product');
        const price = formatPrice(product.price);
        const description = product.description ? escapeHtml(product.description).replace(/\n/g, '<br>') : '';
        const mainImage = escapeHtml(productImages[0] || 'https://via.placeholder.com/800x800?text=No+Image');

        const html = `
            <div class="product-container">
                <!-- Image Gallery -->
                <div class="product-gallery">
                    <div class="main-image-container" onclick="window.openFullscreen(${currentImageIndex})">
                        <img src="${mainImage}" alt="${title}" 
                             class="main-image" id="main-product-image"
                             onerror="this.src='https://via.placeholder.com/800x800?text=No+Image'">
                    </div>
                    
                    <div class="thumbnail-strip" id="thumbnail-strip">
                        ${renderThumbnails(productImages, 0)}
                    </div>
                </div>
                
                <!-- Product Info -->
                <div class="product-info">
                    <span class="product-category">${category}</span>
                    
                    <h1 class="product-title">${title}</h1>
                    
                    <div class="product-price">${price}</div>
                    
                    <div class="product-stock">
                        <span class="stock-badge ${stockClass}">
                            <i class='bx ${stockIcon}'></i> ${stockStatus}
                        </span>
                        ${stockQuantity > 0 ? `<span class="stock-quantity">${stockQuantity} units available</span>` : ''}
                    </div>
                    
                    ${description ? `
                        <div class="product-description">
                            <h3>Description</h3>
                            <p>${description}</p>
                        </div>
                    ` : ''}
                    
                    <div class="product-meta">
                        <div class="meta-item">
                            <div class="meta-icon"><i class='bx bx-category'></i></div>
                            <div class="meta-text">
                                <span class="meta-label">Category</span>
                                <span class="meta-value">${category}</span>
                            </div>
                        </div>
                        
                        <div class="meta-item">
                            <div class="meta-icon"><i class='bx bx-barcode'></i></div>
                            <div class="meta-text">
                                <span class="meta-label">SKU</span>
                                <span class="meta-value">${sku}</span>
                            </div>
                        </div>
                        
                        <div class="meta-item">
                            <div class="meta-icon"><i class='bx bx-package'></i></div>
                            <div class="meta-text">
                                <span class="meta-label">Brand</span>
                                <span class="meta-value">${brand}</span>
                            </div>
                        </div>
                        
                        <div class="meta-item">
                            <div class="meta-icon"><i class='bx bx-weight'></i></div>
                            <div class="meta-text">
                                <span class="meta-label">Weight</span>
                                <span class="meta-value">${weight}</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Quantity Selector -->
                    <div class="quantity-selector">
                        <span class="quantity-label">Quantity:</span>
                        <div class="quantity-controls-lg">
                            <button class="quantity-btn minus" onclick="window.updateDisplayQuantity(-1)" 
                                    ${!inStock ? 'disabled' : ''}>
                                <i class='bx bx-minus'></i>
                            </button>
                            <span class="quantity-value" id="display-quantity">1</span>
                            <button class="quantity-btn plus" onclick="window.updateDisplayQuantity(1)" 
                                    ${!inStock ? 'disabled' : ''}>
                                <i class='bx bx-plus'></i>
                            </button>
                        </div>
                    </div>
                    
                    <!-- Action Buttons -->
                    <div class="product-actions">
                        <button class="btn btn-primary" onclick="window.addToCartFromDisplay()" 
                                ${!inStock ? 'disabled' : ''}>
                            <i class='bx bx-cart-add'></i> Add to Cart
                        </button>
                        <button class="btn btn-outline" onclick="window.buyNow()" 
                                ${!inStock ? 'disabled' : ''}>
                            <i class='bx bx-credit-card'></i> Buy Now
                        </button>
                    </div>
                    
                    <!-- Additional info -->
                    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px dashed var(--border-color);">
                        <p style="color: var(--text-muted); font-size: 0.9rem;">
                            <i class='bx bx-shield'></i> Secure checkout via Paystack
                        </p>
                    </div>
                </div>
            </div>
        `;
        
        productWrapper.innerHTML = html;
    }

    // Change main image
    window.changeImage = function(index) {
        if (index < 0 || index >= productImages.length) return;
        
        currentImageIndex = index;
        const mainImage = document.getElementById('main-product-image');
        if (mainImage) {
            mainImage.src = productImages[index];
        }
        
        // Update active thumbnail
        const thumbnails = document.querySelectorAll('.thumbnail-item');
        thumbnails.forEach((thumb, i) => {
            if (i === index) {
                thumb.classList.add('active');
            } else {
                thumb.classList.remove('active');
            }
        });
    };

    // Open fullscreen modal
    window.openFullscreen = function(index) {
        if (!fullscreenModal || !fullscreenImage || !productImages.length) return;
        
        currentImageIndex = index;
        fullscreenImage.src = productImages[index];
        fullscreenCaption.textContent = `${index + 1} of ${productImages.length}`;
        fullscreenModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    };

    // Close fullscreen modal
    window.closeFullscreen = function() {
        if (!fullscreenModal) return;
        fullscreenModal.style.display = 'none';
        document.body.style.overflow = '';
    };

    // Navigate fullscreen images
    window.navigateFullscreen = function(direction) {
        if (!productImages.length) return;
        
        let newIndex = currentImageIndex + direction;
        
        if (newIndex < 0) {
            newIndex = productImages.length - 1;
        } else if (newIndex >= productImages.length) {
            newIndex = 0;
        }
        
        currentImageIndex = newIndex;
        fullscreenImage.src = productImages[newIndex];
        fullscreenCaption.textContent = `${newIndex + 1} of ${productImages.length}`;
    };

    // Update quantity on display page
    window.updateDisplayQuantity = function(change) {
        const quantityElement = document.getElementById('display-quantity');
        if (!quantityElement) return;
        
        let currentQty = parseInt(quantityElement.textContent) || 1;
        let newQty = currentQty + change;
        
        if (newQty < 1) newQty = 1;
        
        // Check stock limit
        if (currentProduct) {
            const stockQuantity = getStockQuantity(currentProduct);
            if (stockQuantity > 0 && newQty > stockQuantity) {
                showNotification(`Only ${stockQuantity} available`, 'error');
                return;
            }
        }
        
        quantityElement.textContent = newQty;
    };

    // Add to cart from display page
    window.addToCartFromDisplay = function() {
        if (!currentProduct) {
            showNotification('Product information not found', 'error');
            return;
        }
        
        if (!isInStock(currentProduct)) {
            showNotification('This item is out of stock', 'error');
            return;
        }
        
        const quantity = parseInt(document.getElementById('display-quantity')?.textContent || '1');
        
        // Create a product object with quantity
        const productToAdd = {
            ...currentProduct,
            quantity: quantity
        };
        
        if (window.cartAddItem && typeof window.cartAddItem === 'function') {
            window.cartAddItem(productToAdd);
            showNotification(`${quantity} item(s) added to cart!`, 'success');
        } else {
            console.error('cartAddItem function not found');
            showNotification('Cart function not available', 'error');
        }
    };

    // Buy now function
    window.buyNow = function() {
        if (!currentProduct) {
            showNotification('Product information not found', 'error');
            return;
        }
        
        if (!isInStock(currentProduct)) {
            showNotification('This item is out of stock', 'error');
            return;
        }
        
        const quantity = parseInt(document.getElementById('display-quantity')?.textContent || '1');
        
        // Add to cart first
        const productToAdd = {
            ...currentProduct,
            quantity: quantity
        };
        
        if (window.cartAddItem && typeof window.cartAddItem === 'function') {
            window.cartAddItem(productToAdd);
            
            // Open cart modal after a short delay
            setTimeout(() => {
                const cartIcon = document.querySelector('.cart-icon-container');
                if (cartIcon) {
                    cartIcon.click();
                }
            }, 500);
            
            showNotification('Proceeding to checkout...', 'info');
        } else {
            console.error('cartAddItem function not found');
            showNotification('Cart function not available', 'error');
        }
    };

    // Render related products
    function renderRelatedProducts(products, currentProductId) {
        if (!relatedContainer) return;
        
        if (!products || products.length === 0) {
            relatedContainer.innerHTML = '<div class="no-items-found">No related products found</div>';
            return;
        }
        
        // Filter out current product and get up to 4 random products
        const related = products
            .filter(p => p.id !== currentProductId)
            .sort(() => 0.5 - Math.random())
            .slice(0, 4);
        
        if (related.length === 0) {
            relatedContainer.innerHTML = '<div class="no-items-found">No related products found</div>';
            return;
        }
        
        let html = '';
        related.forEach(product => {
            const imageUrl = escapeHtml(product.img || product.imageUrl || 'https://via.placeholder.com/300x300?text=REHABACE');
            const price = formatPrice(product.price);
            const title = escapeHtml(product.title || 'Unnamed Product');
            const productId = escapeHtml(product.id || product.push || '');
            
            html += `
                <a href="display.html?push=${productId}" class="related-card">
                    <div class="related-card-image">
                        <img src="${imageUrl}" alt="${title}" 
                             loading="lazy"
                             onerror="this.src='https://via.placeholder.com/300x300?text=No+Image'">
                    </div>
                    <div class="related-card-content">
                        <h3 class="related-card-title">${title}</h3>
                        <div class="related-card-price">${price}</div>
                    </div>
                </a>
            `;
        });
        
        relatedContainer.innerHTML = html;
    }

    // Load product from Firebase
    function loadProduct(productId) {
        if (!productId) {
            renderProduct(null);
            if (loadingOverlay) loadingOverlay.style.display = 'none';
            return;
        }
        
        // Try from cache first
        const cachedData = sessionStorage.getItem('rehabace_marketplace');
        if (cachedData) {
            try {
                const products = JSON.parse(cachedData);
                allProducts = products;
                currentProduct = products.find(p => p.id === productId || p.push === productId);
                
                if (currentProduct) {
                    renderProduct(currentProduct);
                    renderRelatedProducts(products, productId);
                    if (loadingOverlay) loadingOverlay.style.display = 'none';
                    
                    // Update page title
                    document.title = `${currentProduct.title || 'Product'} · REHABACE`;
                    return;
                }
            } catch (e) {
                console.log('Cache read error:', e);
            }
        }
        
        // Fetch from Firebase
        firebaseProductsCollection.once('value')
            .then(snapshot => {
                const productsData = snapshot.val();
                
                if (productsData) {
                    allProducts = Object.keys(productsData).map(key => ({
                        id: key,
                        ...productsData[key]
                    }));
                    
                    currentProduct = allProducts.find(p => p.id === productId || p.push === productId);
                    
                    if (currentProduct) {
                        renderProduct(currentProduct);
                        renderRelatedProducts(allProducts, productId);
                        
                        // Update page title
                        document.title = `${currentProduct.title || 'Product'} · REHABACE`;
                        
                        // Save to cache
                        sessionStorage.setItem('rehabace_marketplace', JSON.stringify(allProducts));
                    } else {
                        renderProduct(null);
                    }
                } else {
                    renderProduct(null);
                }
                
                if (loadingOverlay) loadingOverlay.style.display = 'none';
            })
            .catch(error => {
                console.error('Error loading product:', error);
                renderProduct(null);
                if (loadingOverlay) loadingOverlay.style.display = 'none';
                showNotification('Error loading product details', 'error');
            });
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
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease forwards';
            setTimeout(() => {
                if (container.contains(notification)) {
                    container.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Make showNotification globally available
    window.showNotification = showNotification;

    // Add animation styles if not present
    if (!document.getElementById('display-animation-styles')) {
        const style = document.createElement('style');
        style.id = 'display-animation-styles';
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
        `;
        document.head.appendChild(style);
    }

    // Event Listeners for fullscreen modal
    if (fullscreenClose) {
        fullscreenClose.addEventListener('click', window.closeFullscreen);
    }

    if (fullscreenPrev) {
        fullscreenPrev.addEventListener('click', () => window.navigateFullscreen(-1));
    }

    if (fullscreenNext) {
        fullscreenNext.addEventListener('click', () => window.navigateFullscreen(1));
    }

    // Close modal with escape key
    window.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && fullscreenModal && fullscreenModal.style.display === 'block') {
            window.closeFullscreen();
        }
        
        // Arrow key navigation in fullscreen
        if (fullscreenModal && fullscreenModal.style.display === 'block') {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                window.navigateFullscreen(-1);
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                window.navigateFullscreen(1);
            }
        }
    });

    // Close modal when clicking outside image
    if (fullscreenModal) {
        fullscreenModal.addEventListener('click', function(e) {
            if (e.target === fullscreenModal) {
                window.closeFullscreen();
            }
        });
    }

    // Listen for cart updates
    document.addEventListener('cart-updated', function() {
        // Refresh the page if needed (optional)
        console.log('Cart updated from display page');
    });

    // Initialize
    const productId = getProductIdFromUrl();
    loadProduct(productId);

    // Log that display.js is loaded
    console.log('Display.js loaded and ready');
})();