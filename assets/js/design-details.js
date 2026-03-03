// assets/js/design-details.js - Full updated version with fixed full-image modal
document.addEventListener('DOMContentLoaded', function() {
    // Check Firebase
    if (typeof firebase === 'undefined' || typeof database === 'undefined') {
        console.error('Firebase not loaded');
        showErrorMessage('Firebase connection failed');
        return;
    }
    
    // Firebase references
    const designsRef = database.ref('designs');
    const bookingsRef = database.ref('bookings');
    
    // DOM elements
    const designDetails = document.getElementById('design-details');
    const loadingOverlay = document.getElementById('loading-overlay');
    const errorState = document.getElementById('error-state');
    
    // Modal elements
    const consultModal = document.getElementById('consult-modal');
    const consultForm = document.getElementById('consult-form');
    const consultDesignTitle = document.getElementById('consult-design-title');
    const roomsCount = document.getElementById('rooms-count');
    const roomSizesContainer = document.getElementById('room-sizes-container');
    const cancelBtn = document.getElementById('cancel-consult');
    const closeBtn = document.querySelector('.consult-modal-close');
    
    // Get design ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const designId = urlParams.get('id');
    
    // Store current design data
    let currentDesign = null;
    
    // Initialize
    function init() {
        if (designId) {
            loadDesignDetails(designId);
            setupModalListeners();
            setupRoomsCountListener();
        } else {
            showError();
        }
    }
    
    // Load design details
    function loadDesignDetails(designId) {
        showLoading();
        
        designsRef.child(designId).once('value')
            .then(snapshot => {
                const designData = snapshot.val();
                
                if (designData) {
                    currentDesign = {
                        id: designId,
                        ...designData
                    };
                    renderDesignDetails(currentDesign);
                } else {
                    showError();
                }
                
                hideLoading();
            })
            .catch(error => {
                console.error("Error loading design details:", error);
                hideLoading();
                showError();
            });
    }
    
    // Render design with slideshow
    function renderDesignDetails(design) {
        // Collect all images (main + additional)
        const allImages = [];
        if (design.imageUrl) allImages.push(design.imageUrl);
        if (design.additionalImages && Array.isArray(design.additionalImages)) {
            allImages.push(...design.additionalImages);
        }
        
        // If no additional images, duplicate main for thumbnail variety
        if (allImages.length === 1) {
            allImages.push(design.imageUrl);
        }
        
        designDetails.innerHTML = `
            <div class="design-details-loaded">
                <div class="slideshow-container" id="slideshow-container">
                    <div class="main-image-container">
                        <img src="${allImages[0]}" alt="${design.title || 'Design'}" class="main-slide-image" id="main-slide-image">
                        <button class="slide-btn prev" id="slide-prev"><i class='bx bx-chevron-left'></i></button>
                        <button class="slide-btn next" id="slide-next"><i class='bx bx-chevron-right'></i></button>
                    </div>
                    <div class="thumbnail-container" id="thumbnail-container">
                        ${allImages.map((img, index) => `
                            <img src="${img}" alt="Thumbnail ${index+1}" class="thumbnail ${index === 0 ? 'active' : ''}" data-index="${index}">
                        `).join('')}
                    </div>
                </div>
                
                <div class="design-info">
                    <div>
                        <h1 class="design-title-large">${design.title || 'Design Idea'}</h1>
                        <p class="design-description-full">${design.description || 'No description available.'}</p>
                        
                        <div class="design-meta-details">
                            ${design.category ? `
                                <div class="meta-item">
                                    <span class="meta-label">Category</span>
                                    <span class="meta-value">${formatCategory(design.category)}</span>
                                </div>
                            ` : ''}
                            <!-- Time removed, only category displayed -->
                        </div>
                    </div>
                    
                    <button class="consult-button" id="consult-now-btn">
                        <i class='bx bxl-whatsapp'></i>
                        Consult About This Design
                    </button>
                </div>
            </div>
        `;
        
        // Initialize slideshow
        initSlideshow(allImages);
        
        // Add click handler for full-size image view
        setupFullImageClick(allImages);
        
        // Attach consult button listener
        document.getElementById('consult-now-btn').addEventListener('click', () => {
            openConsultModal(design);
        });
    }
    
    // Slideshow functionality
    function initSlideshow(images) {
        let currentIndex = 0;
        const mainImage = document.getElementById('main-slide-image');
        const prevBtn = document.getElementById('slide-prev');
        const nextBtn = document.getElementById('slide-next');
        const thumbnails = document.querySelectorAll('.thumbnail');
        
        function updateSlide(index) {
            if (index < 0) index = images.length - 1;
            if (index >= images.length) index = 0;
            
            mainImage.src = images[index];
            currentIndex = index;
            
            // Update active thumbnail
            thumbnails.forEach((thumb, i) => {
                if (i === currentIndex) {
                    thumb.classList.add('active');
                } else {
                    thumb.classList.remove('active');
                }
            });
        }
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                updateSlide(currentIndex - 1);
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                updateSlide(currentIndex + 1);
            });
        }
        
        thumbnails.forEach(thumb => {
            thumb.addEventListener('click', () => {
                const index = parseInt(thumb.dataset.index);
                updateSlide(index);
            });
        });
    }
    
    // Setup full-size image display with improved modal
    function setupFullImageClick(images) {
        const mainImage = document.getElementById('main-slide-image');
        const thumbnails = document.querySelectorAll('.thumbnail');
        
        // Remove existing modal if any
        const existingModal = document.querySelector('.full-image-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Create modal for full image view
        const fullImageModal = document.createElement('div');
        fullImageModal.className = 'full-image-modal';
        fullImageModal.innerHTML = `
            <div class="full-image-content">
                <span class="full-image-close">&times;</span>
                <img src="" alt="Full size" class="full-image-display">
                <button class="full-image-prev"><i class='bx bx-chevron-left'></i></button>
                <button class="full-image-next"><i class='bx bx-chevron-right'></i></button>
            </div>
        `;
        document.body.appendChild(fullImageModal);
        
        let currentFullIndex = 0;
        const fullImageDisplay = fullImageModal.querySelector('.full-image-display');
        const closeBtn = fullImageModal.querySelector('.full-image-close');
        const prevBtn = fullImageModal.querySelector('.full-image-prev');
        const nextBtn = fullImageModal.querySelector('.full-image-next');
        
        function showFullImage(index) {
            if (index < 0) index = images.length - 1;
            if (index >= images.length) index = 0;
            currentFullIndex = index;
            fullImageDisplay.src = images[index];
            fullImageModal.style.display = 'flex';
            // Prevent body scrolling when modal is open
            document.body.style.overflow = 'hidden';
        }
        
        function hideFullImage() {
            fullImageModal.style.display = 'none';
            document.body.style.overflow = ''; // Restore scrolling
        }
        
        // Click on main image
        if (mainImage) {
            mainImage.addEventListener('click', (e) => {
                e.stopPropagation();
                const activeThumb = document.querySelector('.thumbnail.active');
                const startIndex = activeThumb ? parseInt(activeThumb.dataset.index) : 0;
                showFullImage(startIndex);
            });
        }
        
        // Click on thumbnails
        thumbnails.forEach(thumb => {
            thumb.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(thumb.dataset.index);
                showFullImage(index);
            });
        });
        
        // Navigation
        if (prevBtn) {
            prevBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                showFullImage(currentFullIndex - 1);
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                showFullImage(currentFullIndex + 1);
            });
        }
        
        // Close modal
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                hideFullImage();
            });
        }
        
        // Close on background click
        fullImageModal.addEventListener('click', (e) => {
            if (e.target === fullImageModal) {
                hideFullImage();
            }
        });
        
        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && fullImageModal.style.display === 'flex') {
                hideFullImage();
            }
        });
        
        // Left/right arrow keys for navigation
        document.addEventListener('keydown', (e) => {
            if (fullImageModal.style.display !== 'flex') return;
            
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                showFullImage(currentFullIndex - 1);
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                showFullImage(currentFullIndex + 1);
            }
        });
    }
    
    // Setup modal listeners
    function setupModalListeners() {
        if (cancelBtn) {
            cancelBtn.addEventListener('click', closeModal);
        }
        
        if (closeBtn) {
            closeBtn.addEventListener('click', closeModal);
        }
        
        window.addEventListener('click', (e) => {
            if (e.target === consultModal) {
                closeModal();
            }
        });
        
        if (consultForm) {
            consultForm.addEventListener('submit', handleFormSubmit);
        }
    }
    
    // Setup rooms count listener
    function setupRoomsCountListener() {
        if (roomsCount) {
            roomsCount.addEventListener('change', generateRoomSizeInputs);
            roomsCount.addEventListener('input', generateRoomSizeInputs);
        }
    }
    
    // Generate room size inputs based on count
    function generateRoomSizeInputs() {
        const count = parseInt(roomsCount.value) || 1;
        let html = '';
        
        for (let i = 1; i <= count; i++) {
            html += `
                <div class="room-size-input">
                    <label>Room ${i} Size:</label>
                    <select class="room-size-select" data-room="${i}" required>
                        <option value="">Select size</option>
                        <option value="small">Small (10-15 sqm)</option>
                        <option value="medium" selected>Medium (16-30 sqm)</option>
                        <option value="large">Large (31-50 sqm)</option>
                        <option value="xlarge">Extra Large (50+ sqm)</option>
                    </select>
                </div>
            `;
        }
        
        roomSizesContainer.innerHTML = html;
    }
    
    // Open consultation modal
    function openConsultModal(design) {
        if (!consultModal) return;
        
        consultDesignTitle.textContent = `Design: ${design.title || 'Unnamed'}`;
        
        // Set min date to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('inspection-date').min = today;
        
        // Reset form
        consultForm.reset();
        roomsCount.value = 1;
        generateRoomSizeInputs();
        
        // Add image upload field if not exists
        if (!document.getElementById('room-images')) {
            const imageUploadHtml = `
                <div class="consult-form-group">
                    <label for="room-images">Upload Room Photos (Optional)</label>
                    <input type="file" id="room-images" accept="image/*" multiple>
                    <small class="form-text">You can upload multiple photos of your space</small>
                    <div id="image-preview-container" class="image-preview-grid"></div>
                </div>
            `;
            
            // Insert before the last form group or at the end
            const formGroups = consultForm.querySelectorAll('.consult-form-group');
            if (formGroups.length > 0) {
                formGroups[formGroups.length - 1].insertAdjacentHTML('beforebegin', imageUploadHtml);
            } else {
                consultForm.insertAdjacentHTML('beforeend', imageUploadHtml);
            }
            
            // Add image preview functionality
            setupImageUploadPreview();
        }
        
        consultModal.style.display = 'flex';
    }
    
    // Setup image upload preview
    function setupImageUploadPreview() {
        const fileInput = document.getElementById('room-images');
        const previewContainer = document.getElementById('image-preview-container');
        
        if (fileInput && previewContainer) {
            fileInput.addEventListener('change', function() {
                previewContainer.innerHTML = '';
                
                if (this.files) {
                    Array.from(this.files).forEach(file => {
                        if (file.type.startsWith('image/')) {
                            const reader = new FileReader();
                            reader.onload = function(e) {
                                const preview = document.createElement('div');
                                preview.className = 'image-preview-item';
                                preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
                                previewContainer.appendChild(preview);
                            };
                            reader.readAsDataURL(file);
                        }
                    });
                }
            });
        }
    }
    
    // Close modal
    function closeModal() {
        if (consultModal) {
            consultModal.style.display = 'none';
        }
    }
    
    // Handle form submission
    function handleFormSubmit(e) {
        e.preventDefault();
        
        const spinner = document.getElementById('consult-spinner');
        const submitBtn = document.getElementById('submit-consult');
        
        // Collect room sizes
        const roomSizeSelects = document.querySelectorAll('.room-size-select');
        const roomSizes = [];
        roomSizeSelects.forEach(select => {
            roomSizes.push(select.value);
        });
        
        // Validate room sizes
        if (roomSizes.includes('')) {
            alert('Please select size for all rooms');
            return;
        }
        
        // Get file input
        const fileInput = document.getElementById('room-images');
        const hasImages = fileInput && fileInput.files.length > 0;
        
        // Collect form data
        const bookingData = {
            designId: designId,
            designTitle: currentDesign ? currentDesign.title : '',
            roomsCount: roomsCount.value,
            roomSizes: roomSizes,
            budgetType: document.getElementById('budget-type').value,
            inspectionDate: document.getElementById('inspection-date').value,
            siteAddress: document.getElementById('site-address').value,
            phoneNumber: document.getElementById('phone-number').value,
            email: document.getElementById('email-optional').value || '',
            hasImages: hasImages ? fileInput.files.length : 0,
            timestamp: Date.now(),
            status: 'pending'
        };
        
        // Validate required fields
        if (!bookingData.budgetType || !bookingData.inspectionDate || !bookingData.siteAddress || !bookingData.phoneNumber) {
            alert('Please fill all required fields');
            return;
        }
        
        // Show loading
        spinner.style.display = 'inline-block';
        submitBtn.disabled = true;
        
        // Save to Firebase
        bookingsRef.push(bookingData)
            .then(() => {
                // Prepare WhatsApp message with image note
                let message = `Hello REHABACE! I just booked a consultation for "${bookingData.designTitle}". 
                
Rooms: ${bookingData.roomsCount}
Room Sizes: ${roomSizes.map(s => {
    const sizeMap = {
        'small': 'Small (10-15 sqm)',
        'medium': 'Medium (16-30 sqm)',
        'large': 'Large (31-50 sqm)',
        'xlarge': 'Extra Large (50+ sqm)'
    };
    return sizeMap[s] || s;
}).join(', ')}
Budget: ${bookingData.budgetType.charAt(0).toUpperCase() + bookingData.budgetType.slice(1)}
Preferred Date: ${bookingData.inspectionDate}
Location: ${bookingData.siteAddress}
Phone: ${bookingData.phoneNumber}
Email: ${bookingData.email || 'Not provided'}`;
                
                if (hasImages) {
                    message += `\n\nI've uploaded ${fileInput.files.length} photo(s) of my space. Please check the booking dashboard.`;
                }
                
                const whatsappUrl = `https://wa.me/2348132912880?text=${encodeURIComponent(message)}`;
                window.open(whatsappUrl, '_blank');
                
                // Close modal
                closeModal();
                
                // Show success message
                alert('Booking confirmed! You will be redirected to WhatsApp.');
            })
            .catch(error => {
                console.error('Error saving booking:', error);
                alert('Failed to save booking. Please try again.');
            })
            .finally(() => {
                spinner.style.display = 'none';
                submitBtn.disabled = false;
            });
    }
    
    // Helper functions
    function formatCategory(category) {
        const categoryMap = {
            'sensory': 'Sensory Room',
            'creche': 'Creche Room',
            'rehab': 'Rehab Center',
            'therapy': 'Therapy Space',
            'treatment spaces': 'Treatment Space',
            'playground': 'Playground'
        };
        return categoryMap[category] || category;
    }
    
    function formatDate(timestamp) {
        const date = new Date(parseInt(timestamp));
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
    
    // UI state functions
    function showLoading() {
        if (loadingOverlay) loadingOverlay.style.display = 'flex';
        if (errorState) errorState.style.display = 'none';
    }
    
    function hideLoading() {
        if (loadingOverlay) loadingOverlay.style.display = 'none';
    }
    
    function showError() {
        if (loadingOverlay) loadingOverlay.style.display = 'none';
        if (errorState) errorState.style.display = 'block';
    }
    
    function showErrorMessage(msg) {
        if (!designDetails) return;
        designDetails.innerHTML = `
            <div class="error-state">
                <i class='bx bx-wifi-off'></i>
                <h3>Connection Error</h3>
                <p>${msg}</p>
                <button onclick="location.reload()" class="btn btn-primary">Refresh</button>
            </div>
        `;
    }
    
    // Start
    init();
});