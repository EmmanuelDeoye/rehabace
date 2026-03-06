// assets/js/design-details.js - Updated with adaptive consultation forms
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
    const designId = urlParams.get('push') || urlParams.get('id');
    
    // Store current design data
    let currentDesign = null;
    let allDesigns = []; // Store all designs for related section
    
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
        
        designsRef.once('value')
            .then(snapshot => {
                const designs = [];
                snapshot.forEach(child => {
                    designs.push({
                        id: child.key,
                        ...child.val()
                    });
                });
                
                allDesigns = designs;
                
                const designData = designs.find(d => d.id === designId);
                
                if (designData) {
                    currentDesign = {
                        id: designId,
                        ...designData
                    };
                    renderDesignDetails(currentDesign);
                    
                    // Load related designs after main content
                    renderRelatedDesigns(currentDesign);
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
        
        // Format description with paragraphs
        const formattedDescription = formatDescription(design.description || 'No description available.');
        
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
                        <div class="design-description-full">${formattedDescription}</div>
                        
                        <div class="design-meta-details">
                            ${design.category ? `
                                <div class="meta-item">
                                    <span class="meta-label">Category</span>
                                    <span class="meta-value">${formatCategory(design.category)}</span>
                                </div>
                            ` : ''}
                            ${design.area ? `
                                <div class="meta-item">
                                    <span class="meta-label">Area</span>
                                    <span class="meta-value">${design.area} m²</span>
                                </div>
                            ` : ''}
                            ${design.features && design.features.length ? `
                                <div class="meta-item features-item">
                                    <span class="meta-label">Features</span>
                                    <div class="feature-tags">
                                        ${design.features.map(f => `<span class="feature-tag">${f}</span>`).join('')}
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    
                    <button class="consult-button" id="consult-now-btn">
                        
                        I want this ${getItemType(design.category)} template
                    </button>
                </div>
            </div>
            
            <!-- Related Designs Section -->
            <div class="related-designs-section" id="related-designs-section">
                <h2 class="section-title">Related Designs</h2>
                <div class="related-designs-scroll" id="related-designs-scroll">
                    <div class="loading-placeholder">Loading related designs...</div>
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
    
    // Get item type for button text
    function getItemType(category) {
        const typeMap = {
            'sensory': 'Sensory Room',
            'creche': 'Creche Room',
            'rehab centers': 'Rehab Center',
            'treatment spaces': 'Treatment Space',
            'educational spaces': 'Educational Space',
            'playground': 'Playground',
            'gym': 'Gym Space',
            'rehab equipment': 'Equipment'
        };
        return typeMap[category] || 'Design';
    }
    
    // Format description with proper paragraphs
    function formatDescription(description) {
        if (!description) return '<p>No description available.</p>';
        
        // Check if description already contains HTML paragraphs
        if (description.includes('<p>')) {
            return description;
        }
        
        // Split by double line breaks or single line breaks and wrap in <p> tags
        const paragraphs = description.split(/\n\s*\n/);
        
        if (paragraphs.length > 1) {
            // Multiple paragraphs separated by blank lines
            return paragraphs.map(p => p.trim()).filter(p => p.length > 0)
                .map(p => `<p>${p}</p>`).join('');
        } else {
            // Single paragraph - split by single line breaks for multiple lines
            const lines = description.split('\n').filter(line => line.trim().length > 0);
            
            if (lines.length > 1) {
                return lines.map(line => `<p>${line}</p>`).join('');
            } else {
                return `<p>${description}</p>`;
            }
        }
    }
    
    // Render related designs as horizontal scroll
    function renderRelatedDesigns(currentDesign) {
        const relatedSection = document.getElementById('related-designs-section');
        const relatedScroll = document.getElementById('related-designs-scroll');
        
        if (!relatedScroll || !currentDesign) return;
        
        // Get designs from same category, excluding current design
        let related = allDesigns.filter(design => 
            design.id !== currentDesign.id && 
            design.category === currentDesign.category
        );
        
        // If not enough in same category, add other designs
        if (related.length < 4) {
            const others = allDesigns.filter(design => 
                design.id !== currentDesign.id && 
                design.category !== currentDesign.category
            );
            related = [...related, ...others].slice(0, 4);
        }
        
        // Limit to 4 designs
        related = related.slice(0, 4);
        
        if (related.length === 0) {
            // Hide section if no related designs
            if (relatedSection) relatedSection.style.display = 'none';
            return;
        }
        
        let html = '';
        related.forEach(design => {
            const imageUrl = design.imageUrl || 'https://via.placeholder.com/300x200?text=Design';
            html += `
                <a href="design-details.html?id=${design.id}" class="related-design-card">
                    <div class="related-design-image">
                        <img src="${imageUrl}" alt="${design.title || 'Design'}" loading="lazy">
                    </div>
                    <div class="related-design-info">
                        <h3 class="related-design-title">${design.title || 'Untitled Design'}</h3>
                        <span class="related-design-category">${formatCategory(design.category)}</span>
                    </div>
                </a>
            `;
        });
        
        relatedScroll.innerHTML = html;
        
        // Add drag-to-scroll functionality
        let isDown = false;
        let startX;
        let scrollLeft;
        
        relatedScroll.addEventListener('mousedown', (e) => {
            isDown = true;
            relatedScroll.classList.add('active');
            startX = e.pageX - relatedScroll.offsetLeft;
            scrollLeft = relatedScroll.scrollLeft;
        });
        
        relatedScroll.addEventListener('mouseleave', () => {
            isDown = false;
            relatedScroll.classList.remove('active');
        });
        
        relatedScroll.addEventListener('mouseup', () => {
            isDown = false;
            relatedScroll.classList.remove('active');
        });
        
        relatedScroll.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - relatedScroll.offsetLeft;
            const walk = (x - startX) * 2;
            relatedScroll.scrollLeft = scrollLeft - walk;
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
    
    // Generate category-specific form fields
    function generateCategoryForm(category) {
        let html = '';
        
        switch(category) {
            case 'sensory':
            case 'rehab centers':
            case 'treatment spaces':
                // Keep existing room-based form for these categories
                html = `
                    <div class="consult-form-group">
                        <label for="rooms-count">Number of Rooms/Spaces *</label>
                        <input type="number" id="rooms-count" min="1" value="1" required>
                    </div>
                    
                    <div id="room-sizes-container">
                        <!-- Room size inputs will be dynamically added here -->
                    </div>
                    
                    <div class="consult-form-group">
                        <label for="budget-type">Budget Type *</label>
                        <select id="budget-type" required>
                            <option value="">Select budget level</option>
                            <option value="budget">Budget Friendly</option>
                            <option value="moderate">Moderate</option>
                            <option value="exclusive">Exclusive</option>
                        </select>
                    </div>
                `;
                break;
                
            case 'creche':
            case 'educational spaces':
                html = `
                    <div class="consult-form-group">
                        <label for="children-count">Number of Children *</label>
                        <input type="number" id="children-count" min="1" value="15" required>
                    </div>
                    
                    <div class="consult-form-group">
                        <label for="age-group">Age Group *</label>
                        <select id="age-group" required>
                            <option value="">Select age group</option>
                            <option value="infants">Infants (0-2 years)</option>
                            <option value="toddlers">Toddlers (2-4 years)</option>
                            <option value="preschool">Preschool (4-6 years)</option>
                            <option value="school">School Age (6-12 years)</option>
                            <option value="mixed">Mixed Ages</option>
                        </select>
                    </div>
                    
                    <div class="consult-form-group">
                        <label for="space-size">Space Size (sqm) *</label>
                        <input type="number" id="space-size" min="10" value="50" required>
                    </div>
                    
                    <div class="consult-form-group">
                        <label for="budget-type">Budget Type *</label>
                        <select id="budget-type" required>
                            <option value="">Select budget level</option>
                            <option value="budget">Budget Friendly</option>
                            <option value="moderate">Moderate</option>
                            <option value="exclusive">Exclusive</option>
                        </select>
                    </div>
                `;
                break;
                
            case 'playground':
                html = `
                    <div class="consult-form-group">
                        <label for="area-size">Area Size (sqm) *</label>
                        <input type="number" id="area-size" min="20" value="100" required>
                    </div>
                    
                    <div class="consult-form-group">
                        <label for="playground-type">Playground Type *</label>
                        <select id="playground-type" required>
                            <option value="">Select type</option>
                            <option value="indoor">Indoor Playground</option>
                            <option value="outdoor">Outdoor Playground</option>
                            <option value="rooftop">Rooftop Play Area</option>
                        </select>
                    </div>
                    
                    <div class="consult-form-group">
                        <label for="age-range">Target Age Range *</label>
                        <select id="age-range" required>
                            <option value="">Select age range</option>
                            <option value="toddler">Toddlers (1-4 years)</option>
                            <option value="children">Children (4-12 years)</option>
                            <option value="all">All Ages</option>
                        </select>
                    </div>
                    
                    <div class="consult-form-group">
                        <label for="budget-type">Budget Type *</label>
                        <select id="budget-type" required>
                            <option value="">Select budget level</option>
                            <option value="budget">Budget Friendly</option>
                            <option value="moderate">Moderate</option>
                            <option value="exclusive">Exclusive</option>
                        </select>
                    </div>
                `;
                break;
                
            case 'gym':
                html = `
                    <div class="consult-form-group">
                        <label for="gym-size">Gym Size (sqm) *</label>
                        <input type="number" id="gym-size" min="30" value="100" required>
                    </div>
                    
                    <div class="consult-form-group">
                        <label for="gym-type">Gym Type *</label>
                        <select id="gym-type" required>
                            <option value="">Select type</option>
                            <option value="commercial">Commercial Gym</option>
                            <option value="home">Home Gym</option>
                            <option value="rehab">Rehabilitation Gym</option>
                            <option value="hotel">Hotel/Resort Gym</option>
                        </select>
                    </div>
                    
                    <div class="consult-form-group">
                        <label for="equipment-level">Equipment Level *</label>
                        <select id="equipment-level" required>
                            <option value="">Select level</option>
                            <option value="basic">Basic (Cardio + Free Weights)</option>
                            <option value="moderate">Moderate (Full Circuit)</option>
                            <option value="premium">Premium (Full Commercial)</option>
                        </select>
                    </div>
                    
                    <div class="consult-form-group">
                        <label for="budget-type">Budget Type *</label>
                        <select id="budget-type" required>
                            <option value="">Select budget level</option>
                            <option value="budget">Budget Friendly</option>
                            <option value="moderate">Moderate</option>
                            <option value="exclusive">Exclusive</option>
                        </select>
                    </div>
                `;
                break;
                
            case 'rehab equipment':
                html = `
                    <div class="consult-form-group">
                        <label for="equipment-quantity">Quantity Needed *</label>
                        <input type="number" id="equipment-quantity" min="1" value="1" required>
                    </div>
                    
                    <div class="consult-form-group">
                        <label for="equipment-type">Equipment Type *</label>
                        <select id="equipment-type" required>
                            <option value="">Select type</option>
                            <option value="therapy">Therapy Equipment</option>
                            <option value="sensory">Sensory Equipment</option>
                            <option value="mobility">Mobility Aids</option>
                            <option value="exercise">Exercise Equipment</option>
                            <option value="assessment">Assessment Tools</option>
                        </select>
                    </div>
                    
                    <div class="consult-form-group">
                        <label for="delivery-location">Delivery Location *</label>
                        <input type="text" id="delivery-location" placeholder="City/State" required>
                    </div>
                    
                    <div class="consult-form-group">
                        <label for="installation-needed">Installation Needed? *</label>
                        <select id="installation-needed" required>
                            <option value="yes">Yes, need installation</option>
                            <option value="no">No, self-installation</option>
                        </select>
                    </div>
                `;
                break;
                
            default:
                // Generic form for any other categories
                html = `
                    <div class="consult-form-group">
                        <label for="project-details">Project Details *</label>
                        <textarea id="project-details" rows="3" placeholder="Please describe what you need..." required></textarea>
                    </div>
                    
                    <div class="consult-form-group">
                        <label for="budget-type">Budget Type *</label>
                        <select id="budget-type" required>
                            <option value="">Select budget level</option>
                            <option value="budget">Budget Friendly</option>
                            <option value="moderate">Moderate</option>
                            <option value="exclusive">Exclusive</option>
                        </select>
                    </div>
                `;
        }
        
        return html;
    }
    
    // Open consultation modal
    function openConsultModal(design) {
        if (!consultModal) return;
        
        consultDesignTitle.textContent = `${design.title || 'Design'} - ${formatCategory(design.category)}`;
        
        // Set min date to today
        const today = new Date().toISOString().split('T')[0];
        
        // Clear existing form content except header
        const formHeader = consultForm.querySelector('h2');
        const formChildren = consultForm.children;
        
        // Keep only the title and first paragraph, remove everything else
        while (consultForm.children.length > 2) {
            consultForm.removeChild(consultForm.lastChild);
        }
        
        // Get current page URL to include in submission
        const currentPageUrl = window.location.href;
        
        // Generate category-specific form fields
        const categoryFormFields = generateCategoryForm(design.category);
        
        // Add the new form fields
        consultForm.insertAdjacentHTML('beforeend', categoryFormFields);
        
        // Add common fields for all categories
        consultForm.insertAdjacentHTML('beforeend', `
            <div class="consult-form-group">
                <label for="inspection-date">Preferred Consultation/Inspection Date *</label>
                <input type="date" id="inspection-date" min="${today}" required>
            </div>
            
            <div class="consult-form-group">
                <label for="site-address">Location/Address *</label>
                <textarea id="site-address" rows="2" placeholder="Full address" required></textarea>
            </div>
            
            <div class="consult-form-group">
                <label for="phone-number">Phone Number *</label>
                <input type="tel" id="phone-number" placeholder="e.g. 2348123456789" required>
            </div>
            
            <div class="consult-form-group">
                <label for="email-optional">Email (Optional)</label>
                <input type="email" id="email-optional" placeholder="your@email.com">
            </div>
            
            <div class="consult-form-group">
                <label for="additional-notes">Additional Notes (Optional)</label>
                <textarea id="additional-notes" rows="2" placeholder="Any specific requirements?"></textarea>
            </div>
            
            <!-- Hidden field to store page URL -->
            <input type="hidden" id="page-url" value="${currentPageUrl}">
            
            <div class="consult-form-group">
                <label for="room-images">Upload Photos/Reference Images (Optional)</label>
                <input type="file" id="room-images" accept="image/*" multiple>
                <small class="form-text">You can upload multiple photos to help us understand your needs</small>
                <div id="image-preview-container" class="image-preview-grid"></div>
            </div>
            
            <div class="consult-form-actions">
                <button type="submit" class="btn btn-primary" id="submit-consult">
                    <i class='bx bx-check'></i> Confirm Booking
                </button>
            </div>
            <div id="consult-spinner" class="spinner" style="display: none;"></div>
        `);
        
        // If category is sensory/rehab, initialize room size inputs
        if (design.category === 'sensory' || design.category === 'rehab centers' || design.category === 'treatment spaces') {
            const newRoomsCount = document.getElementById('rooms-count');
            const newRoomSizesContainer = document.getElementById('room-sizes-container');
            
            if (newRoomsCount && newRoomSizesContainer) {
                // Re-attach event listeners
                newRoomsCount.addEventListener('change', generateRoomSizeInputs);
                newRoomsCount.addEventListener('input', generateRoomSizeInputs);
                
                // Generate initial room size inputs
                generateRoomSizeInputs();
            }
        }
        
        // Add image preview functionality
        setupImageUploadPreview();
        
        consultModal.style.display = 'flex';
    }
    
    // Setup image upload preview
    function setupImageUploadPreview() {
        const fileInput = document.getElementById('room-images');
        const previewContainer = document.getElementById('image-preview-container');
        
        if (fileInput && previewContainer) {
            // Remove existing listener to avoid duplicates
            fileInput.removeEventListener('change', handleImagePreview);
            fileInput.addEventListener('change', handleImagePreview);
        }
    }
    
    function handleImagePreview() {
        const previewContainer = document.getElementById('image-preview-container');
        if (!previewContainer) return;
        
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
        
        if (!currentDesign) {
            alert('Design data not loaded');
            return;
        }
        
        // Collect common form data
        const formData = {
            designId: designId,
            designTitle: currentDesign.title || 'Untitled',
            designCategory: currentDesign.category || 'general',
            pageUrl: document.getElementById('page-url')?.value || window.location.href,
            inspectionDate: document.getElementById('inspection-date')?.value || '',
            siteAddress: document.getElementById('site-address')?.value || '',
            phoneNumber: document.getElementById('phone-number')?.value || '',
            email: document.getElementById('email-optional')?.value || '',
            additionalNotes: document.getElementById('additional-notes')?.value || '',
            timestamp: Date.now(),
            status: 'pending'
        };
        
        // Validate common required fields
        if (!formData.inspectionDate || !formData.siteAddress || !formData.phoneNumber) {
            alert('Please fill all required fields');
            return;
        }
        
        // Collect category-specific data
        const category = currentDesign.category;
        let categoryData = {};
        let messageDetails = '';
        
        switch(category) {
            case 'sensory':
            case 'rehab centers':
            case 'treatment spaces':
                // Get room count and sizes
                const roomsCount = document.getElementById('rooms-count')?.value;
                const roomSizeSelects = document.querySelectorAll('.room-size-select');
                const roomSizes = [];
                roomSizeSelects.forEach(select => {
                    roomSizes.push(select.value);
                });
                
                if (roomSizes.includes('')) {
                    alert('Please select size for all rooms');
                    return;
                }
                
                categoryData = {
                    roomsCount: roomsCount,
                    roomSizes: roomSizes,
                    budgetType: document.getElementById('budget-type')?.value || ''
                };
                
                if (!categoryData.budgetType) {
                    alert('Please select budget type');
                    return;
                }
                
                const sizeMap = {
                    'small': 'Small (10-15 sqm)',
                    'medium': 'Medium (16-30 sqm)',
                    'large': 'Large (31-50 sqm)',
                    'xlarge': 'Extra Large (50+ sqm)'
                };
                
                messageDetails = `
Rooms: ${categoryData.roomsCount}
Room Sizes: ${categoryData.roomSizes.map(s => sizeMap[s] || s).join(', ')}
Budget: ${categoryData.budgetType}`;
                break;
                
            case 'creche':
            case 'educational spaces':
                categoryData = {
                    childrenCount: document.getElementById('children-count')?.value,
                    ageGroup: document.getElementById('age-group')?.value,
                    spaceSize: document.getElementById('space-size')?.value,
                    budgetType: document.getElementById('budget-type')?.value
                };
                
                if (!categoryData.childrenCount || !categoryData.ageGroup || !categoryData.spaceSize || !categoryData.budgetType) {
                    alert('Please fill all required fields');
                    return;
                }
                
                messageDetails = `
Children Count: ${categoryData.childrenCount}
Age Group: ${categoryData.ageGroup}
Space Size: ${categoryData.spaceSize} sqm
Budget: ${categoryData.budgetType}`;
                break;
                
            case 'playground':
                categoryData = {
                    areaSize: document.getElementById('area-size')?.value,
                    playgroundType: document.getElementById('playground-type')?.value,
                    ageRange: document.getElementById('age-range')?.value,
                    budgetType: document.getElementById('budget-type')?.value
                };
                
                if (!categoryData.areaSize || !categoryData.playgroundType || !categoryData.ageRange || !categoryData.budgetType) {
                    alert('Please fill all required fields');
                    return;
                }
                
                messageDetails = `
Area Size: ${categoryData.areaSize} sqm
Playground Type: ${categoryData.playgroundType}
Age Range: ${categoryData.ageRange}
Budget: ${categoryData.budgetType}`;
                break;
                
            case 'gym':
                categoryData = {
                    gymSize: document.getElementById('gym-size')?.value,
                    gymType: document.getElementById('gym-type')?.value,
                    equipmentLevel: document.getElementById('equipment-level')?.value,
                    budgetType: document.getElementById('budget-type')?.value
                };
                
                if (!categoryData.gymSize || !categoryData.gymType || !categoryData.equipmentLevel || !categoryData.budgetType) {
                    alert('Please fill all required fields');
                    return;
                }
                
                messageDetails = `
Gym Size: ${categoryData.gymSize} sqm
Gym Type: ${categoryData.gymType}
Equipment Level: ${categoryData.equipmentLevel}
Budget: ${categoryData.budgetType}`;
                break;
                
            case 'rehab equipment':
                categoryData = {
                    quantity: document.getElementById('equipment-quantity')?.value,
                    equipmentType: document.getElementById('equipment-type')?.value,
                    deliveryLocation: document.getElementById('delivery-location')?.value,
                    installationNeeded: document.getElementById('installation-needed')?.value
                };
                
                if (!categoryData.quantity || !categoryData.equipmentType || !categoryData.deliveryLocation || !categoryData.installationNeeded) {
                    alert('Please fill all required fields');
                    return;
                }
                
                messageDetails = `
Quantity: ${categoryData.quantity}
Equipment Type: ${categoryData.equipmentType}
Delivery Location: ${categoryData.deliveryLocation}
Installation Needed: ${categoryData.installationNeeded === 'yes' ? 'Yes' : 'No'}`;
                break;
                
            default:
                categoryData = {
                    projectDetails: document.getElementById('project-details')?.value,
                    budgetType: document.getElementById('budget-type')?.value
                };
                
                if (!categoryData.projectDetails || !categoryData.budgetType) {
                    alert('Please fill all required fields');
                    return;
                }
                
                messageDetails = `
Project Details: ${categoryData.projectDetails}
Budget: ${categoryData.budgetType}`;
        }
        
        // Combine all data
        const bookingData = {
            ...formData,
            ...categoryData
        };
        
        // Get file input
        const fileInput = document.getElementById('room-images');
        const hasImages = fileInput && fileInput.files.length > 0;
        bookingData.hasImages = hasImages ? fileInput.files.length : 0;
        
        // Show loading
        spinner.style.display = 'inline-block';
        submitBtn.disabled = true;
        
        // Save to Firebase
        bookingsRef.push(bookingData)
            .then(() => {
                // Prepare WhatsApp message
                let message = `Hello REHABACE! I'm interested in "${bookingData.designTitle}" (${formatCategory(bookingData.designCategory)}).
                
View this page: ${bookingData.pageUrl}

${messageDetails}

Preferred Date: ${bookingData.inspectionDate}
Location: ${bookingData.siteAddress}
Phone: ${bookingData.phoneNumber}
Email: ${bookingData.email || 'Not provided'}`;
                
                if (bookingData.additionalNotes) {
                    message += `\n\nAdditional Notes: ${bookingData.additionalNotes}`;
                }
                
                if (hasImages) {
                    message += `\n\nI've uploaded ${fileInput.files.length} photo(s) of my space/requirements. Please check the booking dashboard.`;
                }
                
                const whatsappUrl = `https://wa.me/2348132912880?text=${encodeURIComponent(message)}`;
                window.open(whatsappUrl, '_blank');
                
                // Close modal
                closeModal();
                
                // Show success message
                alert('Consultation request submitted! You will be redirected to WhatsApp.');
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
            'rehab centers': 'Rehab Center',
            'treatment spaces': 'Treatment Space',
            'educational spaces': 'Educational Space',
            'playground': 'Playground',
            'gym': 'Gym & Fitness Space',
            'rehab equipment': 'Rehab Equipment'
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