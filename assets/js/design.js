// assets/js/design.js - blended with REHABACE (functionality preserved)
// Design Gallery JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Check if Firebase is available
    if (typeof firebase === 'undefined' || typeof database === 'undefined') {
        console.error('Firebase not loaded. Make sure configuration.js is correct.');
        showErrorMessage('Firebase connection failed. Please refresh the page.');
        return;
    }
    
    // Firebase references
    const designsRef = database.ref('designs');
    
    // DOM elements
    const designsContainer = document.getElementById('designs-container');
    const loadingOverlay = document.getElementById('loading-overlay');
    const noResults = document.getElementById('no-results');
    const categoryFilter = document.getElementById('category-filter');
    const sortFilter = document.getElementById('sort-filter');
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    
    // State variables
    let allDesigns = [];
    let filteredDesigns = [];
    let searchTimeout = null;
    let isLoading = false;
    let isInitialLoad = true;
    
    // Session storage keys
    const STORAGE_KEYS = {
        CATEGORY: 'rehabace_designs_category',
        SORT: 'rehabace_designs_sort',
        SEARCH: 'rehabace_designs_search',
        DESIGNS: 'rehabace_designs_data',
        TIMESTAMP: 'rehabace_designs_timestamp'
    };
    
    // Cache expiration time (5 minutes)
    const CACHE_EXPIRATION = 5 * 60 * 1000;
    
    // Initialize the page
    function init() {
        // Restore filter states from session storage
        restoreFilterStates();
        
        // Try to load cached designs first
        const cachedData = loadCachedDesigns();
        
        if (cachedData) {
            // Use cached data immediately
            allDesigns = cachedData;
            console.log(`Loaded ${allDesigns.length} designs from cache`);
            
            // Apply filters with restored states
            applyFilters();
            hideLoading();
            
            // Fetch fresh data in background
            fetchFreshDesigns();
        } else {
            // No cache, load from Firebase
            loadDesigns();
        }
        
        setupEventListeners();
        createConsultationButton();
        setupBeforeUnload(); // Save state before leaving
    }
    
    // Restore filter states from session storage
    function restoreFilterStates() {
        const savedCategory = sessionStorage.getItem(STORAGE_KEYS.CATEGORY);
        const savedSort = sessionStorage.getItem(STORAGE_KEYS.SORT);
        const savedSearch = sessionStorage.getItem(STORAGE_KEYS.SEARCH);
        
        if (savedCategory && categoryFilter) {
            categoryFilter.value = savedCategory;
        }
        
        if (savedSort && sortFilter) {
            sortFilter.value = savedSort;
        }
        
        if (savedSearch && searchInput) {
            searchInput.value = savedSearch;
        }
    }
    
    // Save current filter states to session storage
    function saveFilterStates() {
        if (categoryFilter) {
            sessionStorage.setItem(STORAGE_KEYS.CATEGORY, categoryFilter.value);
        }
        if (sortFilter) {
            sessionStorage.setItem(STORAGE_KEYS.SORT, sortFilter.value);
        }
        if (searchInput) {
            sessionStorage.setItem(STORAGE_KEYS.SEARCH, searchInput.value);
        }
    }
    
    // Load cached designs from session storage
    function loadCachedDesigns() {
        try {
            const cachedData = sessionStorage.getItem(STORAGE_KEYS.DESIGNS);
            const timestamp = sessionStorage.getItem(STORAGE_KEYS.TIMESTAMP);
            
            if (cachedData && timestamp) {
                const cacheAge = Date.now() - parseInt(timestamp);
                
                // Use cache if it's not expired
                if (cacheAge < CACHE_EXPIRATION) {
                    return JSON.parse(cachedData);
                }
            }
        } catch (e) {
            console.warn('Failed to load cached designs:', e);
        }
        return null;
    }
    
    // Save designs to session storage cache
    function cacheDesigns(designs) {
        try {
            sessionStorage.setItem(STORAGE_KEYS.DESIGNS, JSON.stringify(designs));
            sessionStorage.setItem(STORAGE_KEYS.TIMESTAMP, Date.now().toString());
        } catch (e) {
            console.warn('Failed to cache designs:', e);
        }
    }
    
    // Save current state before page unload
    function setupBeforeUnload() {
        window.addEventListener('beforeunload', function() {
            saveFilterStates();
        });
    }
    
    // Fetch fresh designs in background
    function fetchFreshDesigns() {
        designsRef.once('value')
            .then(snapshot => {
                const designsData = snapshot.val();
                
                if (designsData) {
                    const freshDesigns = Object.keys(designsData).map(key => {
                        return {
                            id: key,
                            ...designsData[key],
                            timestamp: designsData[key].timestamp || 0
                        };
                    });
                    
                    // Update cache
                    cacheDesigns(freshDesigns);
                    
                    // Check if data has changed (simple length check - you might want better diff)
                    if (freshDesigns.length !== allDesigns.length) {
                        console.log('New designs available, updating...');
                        allDesigns = freshDesigns;
                        applyFilters();
                    }
                }
            })
            .catch(error => {
                console.warn('Background refresh failed:', error);
            });
    }
    
    // Load designs from Firebase
    function loadDesigns() {
        showLoading();
        isLoading = true;
        
        designsRef.once('value')
            .then(snapshot => {
                const designsData = snapshot.val();
                
                if (designsData) {
                    // Convert object to array and add id
                    allDesigns = Object.keys(designsData).map(key => {
                        return {
                            id: key,
                            ...designsData[key],
                            timestamp: designsData[key].timestamp || 0
                        };
                    });
                    
                    console.log(`Loaded ${allDesigns.length} designs from Firebase`);
                    
                    // Cache the designs
                    cacheDesigns(allDesigns);
                    
                    // Apply filters and render
                    applyFilters();
                } else {
                    showNoResults();
                }
                
                hideLoading();
                isLoading = false;
            })
            .catch(error => {
                console.error("Error loading designs:", error);
                hideLoading();
                isLoading = false;
                showError();
            });
    }
    
    // Set up event listeners for filters and search
    function setupEventListeners() {
        // Filter changes - save state immediately
        categoryFilter.addEventListener('change', function() {
            saveFilterStates();
            applyFilters();
        });
        
        sortFilter.addEventListener('change', function() {
            saveFilterStates();
            applyFilters();
        });
        
        // Search button click
        searchBtn.addEventListener('click', function() {
            saveFilterStates();
            applyFilters();
        });
        
        // Search input with debouncing for better performance
        searchInput.addEventListener('input', function(event) {
            // Clear previous timeout
            if (searchTimeout) {
                clearTimeout(searchTimeout);
            }
            
            // Set new timeout to apply filters after user stops typing
            searchTimeout = setTimeout(function() {
                saveFilterStates();
                applyFilters();
            }, 300); // 300ms debounce
        });
        
        // Search on Enter key
        searchInput.addEventListener('keyup', function(event) {
            if (event.key === 'Enter') {
                // Clear any pending timeout
                if (searchTimeout) {
                    clearTimeout(searchTimeout);
                    searchTimeout = null;
                }
                saveFilterStates();
                applyFilters();
            }
        });
        
        // Clear search button (optional - can be added to UI later)
        setupClearSearchButton();
        
        // Use session storage instead of localStorage for better performance
        // and automatic cleanup when tab is closed
    }
    
    // Setup clear search button functionality
    function setupClearSearchButton() {
        // Create clear button if it doesn't exist
        if (!document.getElementById('clear-search')) {
            const clearBtn = document.createElement('span');
            clearBtn.id = 'clear-search';
            clearBtn.innerHTML = '&times;';
            clearBtn.style.cssText = `
                position: absolute;
                right: 50px;
                top: 50%;
                transform: translateY(-50%);
                cursor: pointer;
                font-size: 1.5rem;
                font-weight: bold;
                color: var(--text-muted);
                display: none;
                z-index: 2;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                background-color: var(--border-color);
            `;
            
            // Wrap search controls in relative position if not already
            const searchControls = document.querySelector('.search-controls');
            if (searchControls) {
                searchControls.style.position = 'relative';
                searchControls.appendChild(clearBtn);
                
                // Show/hide clear button based on input
                searchInput.addEventListener('input', function() {
                    if (this.value.length > 0) {
                        clearBtn.style.display = 'flex';
                    } else {
                        clearBtn.style.display = 'none';
                    }
                });
                
                // Check initial state
                if (searchInput.value.length > 0) {
                    clearBtn.style.display = 'flex';
                }
                
                // Clear search on click
                clearBtn.addEventListener('click', function() {
                    searchInput.value = '';
                    this.style.display = 'none';
                    saveFilterStates();
                    applyFilters();
                    searchInput.focus();
                });
            }
        }
    }
    
    // Create floating consultation button (only if not exists)
    function createConsultationButton() {
        if (document.querySelector('.floating-help-button')) return;
        
        const consultButton = document.createElement('a');
        consultButton.href = 'https://wa.me/2348132912880?text=Hello! I want to consult about the best design for my space.';
        consultButton.target = '_blank';
        consultButton.className = 'floating-help-button';
        consultButton.innerHTML = `
            <i class='bx bx-compass'></i>
            Get Expert Recommendations
        `;
        
        document.body.appendChild(consultButton);
    }
    
    // Apply all filters and render results
    function applyFilters() {
        // Don't show loading for filter changes if we already have data
        if (allDesigns.length > 0 && !isLoading && !isInitialLoad) {
            // Use requestAnimationFrame for smoother UI updates
            requestAnimationFrame(() => {
                performFiltering();
            });
        } else {
            performFiltering();
        }
        
        isInitialLoad = false;
    }
    
    // Perform the actual filtering logic
    function performFiltering() {
        const category = categoryFilter.value;
        const sortBy = sortFilter.value;
        const searchTerm = searchInput.value.toLowerCase().trim();
        
        console.log(`Applying filters - Category: ${category}, Sort: ${sortBy}, Search: "${searchTerm}"`);
        
        // Start with all designs
        filteredDesigns = [...allDesigns];
        
        // Filter by category (case insensitive)
        if (category !== 'all') {
            filteredDesigns = filteredDesigns.filter(design => {
                // Handle different possible category field names
                const designCategory = (design.category || design.roomType || '').toLowerCase().trim();
                const filterCategory = category.toLowerCase().trim();
                
                // Check for exact match or if design category contains the filter
                return designCategory === filterCategory || 
                       designCategory.includes(filterCategory) ||
                       filterCategory.includes(designCategory);
            });
        }
        
        // Filter by search term
        if (searchTerm) {
            filteredDesigns = filteredDesigns.filter(design => {
                const title = (design.title || '').toLowerCase();
                const description = (design.description || '').toLowerCase();
                
                return title.includes(searchTerm) || description.includes(searchTerm);
            });
        }
        
        // Sort results
        sortDesigns(sortBy);
        
        console.log(`Filtered ${filteredDesigns.length} designs`);
        
        // Render results
        renderDesigns();
    }
    
    // Sort designs based on selected option
    function sortDesigns(sortBy) {
        if (sortBy === 'newest') {
            filteredDesigns.sort((a, b) => {
                const timeA = parseInt(a.timestamp) || 0;
                const timeB = parseInt(b.timestamp) || 0;
                return timeB - timeA;
            });
        } else if (sortBy === 'oldest') {
            filteredDesigns.sort((a, b) => {
                const timeA = parseInt(a.timestamp) || 0;
                const timeB = parseInt(b.timestamp) || 0;
                return timeA - timeB;
            });
        }
    }
    
    // Render designs to the page
    function renderDesigns() {
        if (!designsContainer) return;
        
        if (filteredDesigns.length === 0) {
            showNoResults();
            return;
        }
        
        noResults.style.display = 'none';
        designsContainer.style.display = 'grid';
        
        // Use document fragment for better performance
        const fragment = document.createDocumentFragment();
        
        filteredDesigns.forEach(design => {
            const designCard = createDesignCard(design);
            fragment.appendChild(designCard);
        });
        
        // Clear and append in one operation
        designsContainer.innerHTML = '';
        designsContainer.appendChild(fragment);
    }
    
    // Create a design card element
    function createDesignCard(design) {
        const card = document.createElement('div');
        card.className = 'design-card';
        
        // Handle missing image
        const imageUrl = design.imageUrl || 'https://via.placeholder.com/400x300?text=No+Image';
        const title = design.title || 'Design Idea';
        const category = design.category || 'Uncategorized';
        
        // Truncate title if too long
        const truncatedTitle = title.length > 50 ? title.substring(0, 50) + '...' : title;
        
        card.innerHTML = `
            <img src="${imageUrl}" alt="${title}" class="design-image" loading="lazy" onerror="this.src='https://via.placeholder.com/400x300?text=Image+Error'">
            <div class="design-content">
                <h3 class="design-title">${truncatedTitle}</h3>
                <div class="design-meta">
                    <span class="design-category">${category}</span>
                </div>
            </div>
        `;
        
        // Add click event to redirect to details page
        card.addEventListener('click', () => {
            // Save current state before navigating away
            saveFilterStates();
            window.location.href = `design-details.html?id=${design.id}`;
        });
        
        return card;
    }
    
    // Show loading state
    function showLoading() {
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
        }
        if (designsContainer) {
            designsContainer.style.display = 'none';
        }
        if (noResults) {
            noResults.style.display = 'none';
        }
    }
    
    // Hide loading state
    function hideLoading() {
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    }
    
    // Show no results message
    function showNoResults() {
        if (designsContainer) {
            designsContainer.innerHTML = '';
            designsContainer.style.display = 'none';
        }
        if (noResults) {
            noResults.style.display = 'block';
            
            // Update message based on filters
            const category = categoryFilter.value;
            const searchTerm = searchInput.value.trim();
            
            let message = 'Try adjusting your filters or search terms';
            if (category !== 'all' && searchTerm) {
                message = `No designs found in "${category}" category matching "${searchTerm}"`;
            } else if (category !== 'all') {
                message = `No designs found in "${category}" category`;
            } else if (searchTerm) {
                message = `No designs found matching "${searchTerm}"`;
            }
            
            const messageEl = noResults.querySelector('p');
            if (messageEl) {
                messageEl.textContent = message;
            }
        }
    }
    
    // Show error message
    function showError() {
        if (!designsContainer) return;
        designsContainer.innerHTML = `
            <div class="error-state">
                <i class='bx bx-error'></i>
                <h3>Error Loading Designs</h3>
                <p>Please try again later</p>
                <button onclick="location.reload()" style="
                    margin-top: 1rem;
                    padding: 0.5rem 1.5rem;
                    background-color: var(--primary-color);
                    color: white;
                    border: none;
                    border-radius: 30px;
                    cursor: pointer;
                ">Retry</button>
            </div>
        `;
        designsContainer.style.display = 'grid';
        if (loadingOverlay) loadingOverlay.style.display = 'none';
    }
    
    // Helper for connection errors
    function showErrorMessage(msg) {
        if (!designsContainer) return;
        designsContainer.innerHTML = `
            <div class="error-state">
                <i class='bx bx-wifi-off'></i>
                <h3>Connection Error</h3>
                <p>${msg}</p>
                <button onclick="location.reload()" style="
                    margin-top: 1rem;
                    padding: 0.5rem 1.5rem;
                    background-color: var(--primary-color);
                    color: white;
                    border: none;
                    border-radius: 30px;
                    cursor: pointer;
                ">Refresh</button>
            </div>
        `;
        if (loadingOverlay) loadingOverlay.style.display = 'none';
    }
    
    // Initialize the page
    init();
});

// Preserve original auth modal functionality if needed
// (Add any additional auth-related code that might be expected)