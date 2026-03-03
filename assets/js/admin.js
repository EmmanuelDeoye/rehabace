// assets/js/admin.js - Complete Admin Panel with Fixed Modals
document.addEventListener('DOMContentLoaded', function() {
    // Check Firebase
    if (typeof firebase === 'undefined' || typeof database === 'undefined') {
        alert('Firebase connection failed. Please check configuration.');
        return;
    }

    // Initialize Storage if available
    let storage;
    try {
        storage = firebase.storage();
    } catch (e) {
        console.warn('Firebase Storage not available');
    }

    // Firebase references
    const designsRef = database.ref('designs');
    const bookingsRef = database.ref('bookings');

    // DOM Elements
    const navItems = document.querySelectorAll('.admin-nav-item');
    const designTab = document.getElementById('designs-tab');
    const bookingTab = document.getElementById('bookings-tab');
    const newDesignBtn = document.getElementById('new-design-btn');
    const designModal = document.getElementById('design-modal');
    const closeDesignModal = document.getElementById('close-design-modal');
    const cancelDesign = document.getElementById('cancel-design');
    const designForm = document.getElementById('design-form');
    const designId = document.getElementById('design-id');
    const designTitle = document.getElementById('design-title');
    const designCategory = document.getElementById('design-category');
    const designDescription = document.getElementById('design-description');
    const designImageUrl = document.getElementById('design-image-url');
    const designModalTitle = document.getElementById('design-modal-title');
    
    // Image upload elements
    const mainImageUpload = document.getElementById('main-image-upload');
    const mainImageFile = document.getElementById('main-image-file');
    const mainImagePlaceholder = document.getElementById('main-image-placeholder');
    const mainImagePreview = document.getElementById('main-image-preview');
    const removeMainImage = document.getElementById('remove-main-image');
    
    const additionalImageUpload = document.getElementById('additional-image-upload');
    const additionalImageFile = document.getElementById('additional-image-file');
    const additionalImagesGrid = document.getElementById('additional-images-grid');
    const designAdditionalUrls = document.getElementById('design-additional-urls');
    
    // Filter elements
    const designSearch = document.getElementById('design-search');
    const categoryFilter = document.getElementById('category-filter');
    const sortFilter = document.getElementById('sort-filter');
    
    // Bookings elements
    const bookingSearch = document.getElementById('booking-search');
    const bookingStatusFilter = document.getElementById('booking-status-filter');
    const bookingSort = document.getElementById('booking-sort');
    const bookingModal = document.getElementById('booking-modal');
    const closeBookingModal = document.getElementById('close-booking-modal');
    
    // Full screen image modal
    const fullscreenModal = document.getElementById('fullscreen-image-modal');
    const fullscreenImage = document.getElementById('fullscreen-image');
    const fullscreenClose = document.querySelector('.fullscreen-close');

    // State
    let allDesigns = [];
    let allBookings = [];
    let currentEditId = null;
    let mainImageFileData = null;
    let additionalImageFiles = [];
    let uploadedMainImageUrl = '';
    let uploadedAdditionalUrls = [];

    // Tab switching
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            const tab = item.dataset.tab;
            if (tab === 'designs') {
                designTab.classList.add('active');
                bookingTab.classList.remove('active');
                loadDesigns();
            } else {
                bookingTab.classList.add('active');
                designTab.classList.remove('active');
                loadBookings();
            }
        });
    });

    // Modal controls
    newDesignBtn.addEventListener('click', () => {
        resetDesignForm();
        designModalTitle.textContent = 'Add New Design';
        designModal.style.display = 'flex';
    });

    function closeDesignModalHandler() {
        designModal.style.display = 'none';
        resetDesignForm();
    }

    if (closeDesignModal) {
        closeDesignModal.addEventListener('click', closeDesignModalHandler);
    }
    
    if (cancelDesign) {
        cancelDesign.addEventListener('click', closeDesignModalHandler);
    }

    window.addEventListener('click', (e) => {
        if (e.target === designModal) {
            closeDesignModalHandler();
        }
        if (e.target === bookingModal) {
            bookingModal.style.display = 'none';
        }
        if (e.target === fullscreenModal) {
            fullscreenModal.classList.remove('active');
        }
    });

    // Full screen image
    if (fullscreenClose) {
        fullscreenClose.addEventListener('click', () => {
            fullscreenModal.classList.remove('active');
        });
    }

    // Make showFullScreenImage globally available
    window.showFullScreenImage = function(url) {
        if (fullscreenImage && fullscreenModal) {
            fullscreenImage.src = url;
            fullscreenModal.classList.add('active');
        }
    };

    // Image Upload Handlers
    if (mainImageUpload) {
        mainImageUpload.addEventListener('click', () => {
            mainImageFile.click();
        });
    }

    if (mainImageFile) {
        mainImageFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                mainImageFileData = file;
                const reader = new FileReader();
                reader.onload = (e) => {
                    if (mainImagePlaceholder) mainImagePlaceholder.style.display = 'none';
                    if (mainImagePreview) {
                        mainImagePreview.src = e.target.result;
                        mainImagePreview.style.display = 'block';
                    }
                    if (removeMainImage) removeMainImage.style.display = 'flex';
                };
                reader.readAsDataURL(file);
            }
        });
    }

    if (removeMainImage) {
        removeMainImage.addEventListener('click', (e) => {
            e.stopPropagation();
            mainImageFileData = null;
            mainImageFile.value = '';
            if (mainImagePreview) mainImagePreview.style.display = 'none';
            if (mainImagePlaceholder) mainImagePlaceholder.style.display = 'flex';
            removeMainImage.style.display = 'none';
            if (designImageUrl) designImageUrl.value = '';
        });
    }

    if (additionalImageUpload) {
        additionalImageUpload.addEventListener('click', () => {
            additionalImageFile.click();
        });
    }

    if (additionalImageFile) {
        additionalImageFile.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            additionalImageFiles.push(...files);
            
            files.forEach(file => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const previewDiv = document.createElement('div');
                    previewDiv.className = 'image-upload-area small';
                    previewDiv.style.position = 'relative';
                    previewDiv.innerHTML = `
                        <img src="${e.target.result}" class="image-preview" style="display:block; width:100%; height:100%; object-fit:cover;">
                        <button type="button" class="btn-icon remove-image" style="display:flex; position:absolute; top:5px; right:5px; background:rgba(220,53,69,0.9); color:white; border:none; border-radius:50%; width:30px; height:30px; align-items:center; justify-content:center; cursor:pointer;">
                            <i class='bx bx-trash'></i>
                        </button>
                    `;
                    
                    const removeBtn = previewDiv.querySelector('.remove-image');
                    removeBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        previewDiv.remove();
                        additionalImageFiles = additionalImageFiles.filter(f => f !== file);
                    });
                    
                    if (additionalImagesGrid) {
                        additionalImagesGrid.insertBefore(previewDiv, additionalImageUpload);
                    }
                };
                reader.readAsDataURL(file);
            });
        });
    }

    // Reset form
    function resetDesignForm() {
        if (designForm) designForm.reset();
        if (designId) designId.value = '';
        currentEditId = null;
        mainImageFileData = null;
        additionalImageFiles = [];
        uploadedMainImageUrl = '';
        uploadedAdditionalUrls = [];
        
        if (mainImageFile) mainImageFile.value = '';
        if (additionalImageFile) additionalImageFile.value = '';
        if (mainImagePreview) mainImagePreview.style.display = 'none';
        if (mainImagePlaceholder) mainImagePlaceholder.style.display = 'flex';
        if (removeMainImage) removeMainImage.style.display = 'none';
        if (designImageUrl) designImageUrl.value = '';
        
        // Clear additional images
        if (additionalImagesGrid) {
            const previews = additionalImagesGrid.querySelectorAll('.image-upload-area.small:not(#additional-image-upload)');
            previews.forEach(preview => preview.remove());
        }
    }

    // Upload image to Firebase Storage
    async function uploadImage(file, path) {
        if (!storage) {
            alert('Firebase Storage not available');
            return null;
        }
        
        const timestamp = Date.now();
        const fileName = `${path}_${timestamp}_${file.name}`;
        const storageRef = storage.ref().child(`designs/${fileName}`);
        
        try {
            const snapshot = await storageRef.put(file);
            const downloadUrl = await snapshot.ref.getDownloadURL();
            return downloadUrl;
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload image: ' + error.message);
            return null;
        }
    }

    // Load designs
    function loadDesigns() {
        const grid = document.getElementById('designs-grid');
        if (grid) {
            grid.innerHTML = '<div class="loading-state">Loading designs...</div>';
        }
        
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
                filterAndRenderDesigns();
            })
            .catch(error => {
                console.error('Error loading designs:', error);
                if (grid) {
                    grid.innerHTML = '<div class="loading-state">Error loading designs</div>';
                }
            });
    }

    // Filter and render designs
    function filterAndRenderDesigns() {
        const searchTerm = designSearch ? designSearch.value.toLowerCase().trim() : '';
        const category = categoryFilter ? categoryFilter.value : 'all';
        const sort = sortFilter ? sortFilter.value : 'newest';

        let filtered = [...allDesigns];

        // Filter by search
        if (searchTerm) {
            filtered = filtered.filter(d => 
                (d.title && d.title.toLowerCase().includes(searchTerm)) ||
                (d.description && d.description.toLowerCase().includes(searchTerm)) ||
                (d.category && d.category.toLowerCase().includes(searchTerm))
            );
        }

        // Filter by category
        if (category !== 'all') {
            filtered = filtered.filter(d => d.category === category);
        }

        // Sort
        filtered.sort((a, b) => {
            switch(sort) {
                case 'newest':
                    return (b.timestamp || 0) - (a.timestamp || 0);
                case 'oldest':
                    return (a.timestamp || 0) - (b.timestamp || 0);
                case 'az':
                    return (a.title || '').localeCompare(b.title || '');
                case 'za':
                    return (b.title || '').localeCompare(a.title || '');
                default:
                    return 0;
            }
        });

        renderDesignsGrid(filtered);
    }

    // Render designs grid
    function renderDesignsGrid(designs) {
        const grid = document.getElementById('designs-grid');
        if (!grid) return;
        
        if (designs.length === 0) {
            grid.innerHTML = '<div class="loading-state">No designs found</div>';
            return;
        }

        grid.innerHTML = designs.map(design => {
            const date = design.timestamp ? new Date(parseInt(design.timestamp)).toLocaleDateString() : 'N/A';
            const imageCount = design.additionalImages ? design.additionalImages.length + 1 : 1;
            
            return `
                <div class="design-card" data-id="${design.id}">
                    <img src="${design.imageUrl || 'https://via.placeholder.com/400x300'}" 
                         alt="${design.title || 'Design'}" 
                         class="design-card-image"
                         onclick="showFullScreenImage('${design.imageUrl || 'https://via.placeholder.com/400x300'}')"
                         onerror="this.src='https://via.placeholder.com/400x300'">
                    <div class="design-card-content">
                        <div class="design-card-header">
                            <h3 class="design-card-title">${design.title || 'Untitled'}</h3>
                            <span class="design-card-category">${formatCategory(design.category)}</span>
                        </div>
                        <p class="design-card-description">${design.description || 'No description'}</p>
                        <div class="design-card-meta">
                            <span><i class='bx bx-calendar'></i> ${date}</span>
                            <span><i class='bx bx-images'></i> ${imageCount} image${imageCount > 1 ? 's' : ''}</span>
                        </div>
                        <div class="design-card-actions">
                            <button class="btn btn-outline btn-sm" onclick="editDesign('${design.id}')">
                                <i class='bx bx-edit'></i> Edit
                            </button>
                            <button class="btn btn-outline btn-sm" onclick="deleteDesign('${design.id}')">
                                <i class='bx bx-trash'></i> Delete
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Make editDesign globally available
    window.editDesign = function(id) {
        const design = allDesigns.find(d => d.id === id);
        if (!design) return;

        currentEditId = id;
        if (designId) designId.value = id;
        if (designTitle) designTitle.value = design.title || '';
        if (designCategory) designCategory.value = design.category || '';
        if (designDescription) designDescription.value = design.description || '';
        
        if (design.imageUrl && designImageUrl) {
            designImageUrl.value = design.imageUrl;
            if (mainImagePreview) {
                mainImagePreview.src = design.imageUrl;
                mainImagePreview.style.display = 'block';
            }
            if (mainImagePlaceholder) mainImagePlaceholder.style.display = 'none';
            if (removeMainImage) removeMainImage.style.display = 'flex';
        }

        // Clear existing additional previews
        if (additionalImagesGrid) {
            const previews = additionalImagesGrid.querySelectorAll('.image-upload-area.small:not(#additional-image-upload)');
            previews.forEach(preview => preview.remove());
        }

        // Load additional images
        if (design.additionalImages && Array.isArray(design.additionalImages) && additionalImagesGrid) {
            design.additionalImages.forEach((url, index) => {
                const previewDiv = document.createElement('div');
                previewDiv.className = 'image-upload-area small';
                previewDiv.style.position = 'relative';
                previewDiv.innerHTML = `
                    <img src="${url}" class="image-preview" style="display:block; width:100%; height:100%; object-fit:cover;">
                    <button type="button" class="btn-icon remove-image" style="display:flex; position:absolute; top:5px; right:5px; background:rgba(220,53,69,0.9); color:white; border:none; border-radius:50%; width:30px; height:30px; align-items:center; justify-content:center; cursor:pointer;">
                        <i class='bx bx-trash'></i>
                    </button>
                `;
                
                const removeBtn = previewDiv.querySelector('.remove-image');
                removeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    previewDiv.remove();
                });
                
                additionalImagesGrid.insertBefore(previewDiv, additionalImageUpload);
            });
        }

        if (designModalTitle) designModalTitle.textContent = 'Edit Design';
        if (designModal) designModal.style.display = 'flex';
    };

    // Make deleteDesign globally available
    window.deleteDesign = function(id) {
        if (confirm('Are you sure you want to delete this design?')) {
            designsRef.child(id).remove()
                .then(() => {
                    alert('Design deleted successfully');
                    loadDesigns();
                })
                .catch(error => {
                    console.error('Delete error:', error);
                    alert('Failed to delete design: ' + error.message);
                });
        }
    };

    // Save design
    if (designForm) {
        designForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const spinner = document.getElementById('upload-spinner');
            const saveBtn = document.getElementById('save-design');
            
            if (spinner) spinner.style.display = 'inline-block';
            if (saveBtn) saveBtn.disabled = true;

            try {
                // Upload main image if new file selected
                if (mainImageFileData) {
                    const url = await uploadImage(mainImageFileData, 'main');
                    if (url) uploadedMainImageUrl = url;
                } else if (designImageUrl && designImageUrl.value) {
                    uploadedMainImageUrl = designImageUrl.value;
                }

                // Upload additional images
                uploadedAdditionalUrls = [];
                for (const file of additionalImageFiles) {
                    const url = await uploadImage(file, 'additional');
                    if (url) uploadedAdditionalUrls.push(url);
                }

                // Get existing additional images that weren't removed
                if (additionalImagesGrid) {
                    const existingPreviews = additionalImagesGrid.querySelectorAll('.image-upload-area.small:not(#additional-image-upload) img');
                    existingPreviews.forEach(img => {
                        if (img.src && !img.src.includes('blob:')) {
                            uploadedAdditionalUrls.push(img.src);
                        }
                    });
                }

                if (!uploadedMainImageUrl) {
                    alert('Please upload a main image');
                    if (spinner) spinner.style.display = 'none';
                    if (saveBtn) saveBtn.disabled = false;
                    return;
                }

                const designData = {
                    title: designTitle ? designTitle.value : '',
                    category: designCategory ? designCategory.value : '',
                    description: designDescription ? designDescription.value : '',
                    imageUrl: uploadedMainImageUrl,
                    additionalImages: uploadedAdditionalUrls,
                    timestamp: currentEditId ? 
                        (allDesigns.find(d => d.id === currentEditId)?.timestamp || Date.now()) : 
                        Date.now()
                };

                if (currentEditId) {
                    await designsRef.child(currentEditId).update(designData);
                    alert('Design updated successfully');
                } else {
                    await designsRef.push(designData);
                    alert('Design created successfully');
                }

                closeDesignModalHandler();
                loadDesigns();
            } catch (error) {
                console.error('Save error:', error);
                alert('Failed to save design: ' + error.message);
            } finally {
                if (spinner) spinner.style.display = 'none';
                if (saveBtn) saveBtn.disabled = false;
            }
        });
    }

    // Load bookings
    function loadBookings() {
        const grid = document.getElementById('bookings-grid');
        if (grid) {
            grid.innerHTML = '<div class="loading-state">Loading bookings...</div>';
        }
        
        bookingsRef.once('value')
            .then(snapshot => {
                const bookings = [];
                snapshot.forEach(child => {
                    bookings.push({
                        id: child.key,
                        ...child.val()
                    });
                });
                
                allBookings = bookings.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                filterAndRenderBookings();
            })
            .catch(error => {
                console.error('Error loading bookings:', error);
                if (grid) {
                    grid.innerHTML = '<div class="loading-state">Error loading bookings</div>';
                }
            });
    }

    // Filter and render bookings
    function filterAndRenderBookings() {
        const searchTerm = bookingSearch ? bookingSearch.value.toLowerCase().trim() : '';
        const status = bookingStatusFilter ? bookingStatusFilter.value : 'all';
        const sort = bookingSort ? bookingSort.value : 'newest';

        let filtered = [...allBookings];

        // Filter by search
        if (searchTerm) {
            filtered = filtered.filter(b => 
                (b.designTitle && b.designTitle.toLowerCase().includes(searchTerm)) ||
                (b.phoneNumber && b.phoneNumber.includes(searchTerm)) ||
                (b.email && b.email.toLowerCase().includes(searchTerm)) ||
                (b.siteAddress && b.siteAddress.toLowerCase().includes(searchTerm))
            );
        }

        // Filter by status
        if (status !== 'all') {
            filtered = filtered.filter(b => b.status === status);
        }

        // Sort
        filtered.sort((a, b) => {
            if (sort === 'newest') {
                return (b.timestamp || 0) - (a.timestamp || 0);
            } else {
                return (a.timestamp || 0) - (b.timestamp || 0);
            }
        });

        renderBookingsGrid(filtered);
    }

    // Render bookings grid
    function renderBookingsGrid(bookings) {
        const grid = document.getElementById('bookings-grid');
        if (!grid) return;
        
        if (bookings.length === 0) {
            grid.innerHTML = '<div class="loading-state">No bookings found</div>';
            return;
        }

        grid.innerHTML = bookings.map(booking => {
            const statusClass = `status-${booking.status || 'pending'}`;
            const statusText = booking.status ? booking.status.charAt(0).toUpperCase() + booking.status.slice(1) : 'Pending';
            
            return `
                <div class="booking-card" data-id="${booking.id}">
                    <div class="booking-card-header">
                        <span class="booking-design-title">${booking.designTitle || 'Unknown Design'}</span>
                        <span class="booking-status ${statusClass}">${statusText}</span>
                    </div>
                    <div class="booking-details">
                        <div class="booking-detail-item">
                            <span class="booking-detail-label">Phone</span>
                            <span class="booking-detail-value">${booking.phoneNumber || 'N/A'}</span>
                        </div>
                        <div class="booking-detail-item">
                            <span class="booking-detail-label">Date</span>
                            <span class="booking-detail-value">${booking.inspectionDate || 'N/A'}</span>
                        </div>
                        <div class="booking-detail-item">
                            <span class="booking-detail-label">Rooms</span>
                            <span class="booking-detail-value">${booking.roomsCount || 1}</span>
                        </div>
                        <div class="booking-detail-item">
                            <span class="booking-detail-label">Budget</span>
                            <span class="booking-detail-value">${booking.budgetType ? booking.budgetType.charAt(0).toUpperCase() + booking.budgetType.slice(1) : 'N/A'}</span>
                        </div>
                    </div>
                    <div class="booking-actions">
                        <button class="btn btn-outline btn-sm" onclick="viewBooking('${booking.id}')">
                            <i class='bx bx-show'></i> View
                        </button>
                        <button class="btn btn-outline btn-sm" onclick="deleteBooking('${booking.id}')">
                            <i class='bx bx-trash'></i> Delete
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Make viewBooking globally available
    window.viewBooking = function(id) {
        const booking = allBookings.find(b => b.id === id);
        if (!booking) return;

        const content = document.getElementById('booking-details-content');
        if (!content) return;
        
        let roomSizesHtml = '';
        if (booking.roomSizes && Array.isArray(booking.roomSizes)) {
            roomSizesHtml = '<ul class="room-sizes-list">';
            booking.roomSizes.forEach((size, index) => {
                const sizeMap = {
                    'small': 'Small (10-15 sqm)',
                    'medium': 'Medium (16-30 sqm)',
                    'large': 'Large (31-50 sqm)',
                    'xlarge': 'Extra Large (50+ sqm)'
                };
                roomSizesHtml += `<li>Room ${index + 1}: ${sizeMap[size] || size}</li>`;
            });
            roomSizesHtml += '</ul>';
        }

        content.innerHTML = `
            <div class="detail-row">
                <div class="detail-label">Design</div>
                <div class="detail-value">${booking.designTitle || 'N/A'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Client Contact</div>
                <div class="detail-value">📞 ${booking.phoneNumber || 'N/A'}</div>
                <div class="detail-value">✉️ ${booking.email || 'Not provided'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Location</div>
                <div class="detail-value">${booking.siteAddress || 'N/A'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Room Details</div>
                <div class="detail-value">${booking.roomsCount || 1} rooms</div>
                ${roomSizesHtml}
            </div>
            <div class="detail-row">
                <div class="detail-label">Budget & Date</div>
                <div class="detail-value">💰 ${booking.budgetType ? booking.budgetType.charAt(0).toUpperCase() + booking.budgetType.slice(1) : 'N/A'}</div>
                <div class="detail-value">📅 ${booking.inspectionDate || 'N/A'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Images Uploaded</div>
                <div class="detail-value">${booking.hasImages ? `Yes (${booking.hasImages} photos)` : 'No'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Booked On</div>
                <div class="detail-value">${booking.timestamp ? new Date(parseInt(booking.timestamp)).toLocaleString() : 'N/A'}</div>
            </div>
            <div class="status-update">
                <label for="update-status">Update Status:</label>
                <select id="update-status" onchange="updateBookingStatus('${booking.id}', this.value)">
                    <option value="pending" ${booking.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="confirmed" ${booking.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                    <option value="completed" ${booking.status === 'completed' ? 'selected' : ''}>Completed</option>
                    <option value="cancelled" ${booking.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
            </div>
        `;

        if (bookingModal) bookingModal.style.display = 'flex';
    };

    // Make updateBookingStatus globally available
    window.updateBookingStatus = function(id, status) {
        bookingsRef.child(id).update({ status: status })
            .then(() => {
                alert('Booking status updated successfully');
                loadBookings();
                if (bookingModal) bookingModal.style.display = 'none';
            })
            .catch(error => {
                console.error('Error updating status:', error);
                alert('Failed to update status: ' + error.message);
            });
    };

    // Make deleteBooking globally available
    window.deleteBooking = function(id) {
        if (confirm('Are you sure you want to delete this booking?')) {
            bookingsRef.child(id).remove()
                .then(() => {
                    alert('Booking deleted successfully');
                    loadBookings();
                    if (bookingModal) bookingModal.style.display = 'none';
                })
                .catch(error => {
                    console.error('Error deleting booking:', error);
                    alert('Failed to delete booking: ' + error.message);
                });
        }
    };

    // Close booking modal
    if (closeBookingModal) {
        closeBookingModal.addEventListener('click', () => {
            if (bookingModal) bookingModal.style.display = 'none';
        });
    }

    // Event listeners for filters
    if (designSearch) designSearch.addEventListener('input', filterAndRenderDesigns);
    if (categoryFilter) categoryFilter.addEventListener('change', filterAndRenderDesigns);
    if (sortFilter) sortFilter.addEventListener('change', filterAndRenderDesigns);

    if (bookingSearch) bookingSearch.addEventListener('input', filterAndRenderBookings);
    if (bookingStatusFilter) bookingStatusFilter.addEventListener('change', filterAndRenderBookings);
    if (bookingSort) bookingSort.addEventListener('change', filterAndRenderBookings);

    // Helper function
    function formatCategory(category) {
        const categoryMap = {
            'sensory': 'Sensory Room',
            'creche': 'Creche Room',
            'rehab centers': 'Rehab Center',
            'treatment spaces': 'Treatment Space',
            'playground': 'Playground'
        };
        return categoryMap[category] || category;
    }

    // Load initial data
    loadDesigns();

    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to logout?')) {
                window.location.href = 'index.html';
            }
        });
    }
});