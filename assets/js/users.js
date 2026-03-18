// assets/js/users.js – RehabAce version
// Handles user profile display for regular users and suppliers

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const profileId = urlParams.get('id');
    let currentUser = null;
    let currentProfileType = 'regular'; // 'regular' or 'supplier'
    let currentProfileData = null;
    let newProfileImageUrl = '';

    const auth = firebase.auth();
    const database = firebase.database();
    const storage = firebase.storage();

    // ----- DOM Elements -----
    const profileImage = document.getElementById('profile-image');
    const editIcon = document.getElementById('edit-icon');
    const onlineStatus = document.querySelector('.online-status');
    const userName = document.querySelector('.user-name');
    const userTitle = document.querySelector('.user-title');
    
    // Contact Info
    const emailValue = document.getElementById('email-value');
    const phoneValue = document.getElementById('phone-value');
    const locationValue = document.getElementById('location-value');
    
    // Supplier Info
    const supplierDetails = document.getElementById('supplier-details');
    const supplierOrg = document.getElementById('supplier-org');
    const supplierProducts = document.getElementById('supplier-products');
    const supplierCertifications = document.getElementById('supplier-certifications');
    
    // Rating Section (for suppliers)
    const ratingSection = document.getElementById('rating-section');
    const stars = document.querySelectorAll('.bx-star');
    const ratingComment = document.getElementById('rating-comment');
    const submitButton = document.getElementById('submit-rating');
    
    // Profile Footer
    const profileFooter = document.getElementById('profile-footer');
    const viewCountElement = document.getElementById('view-count');
    
    // Settings Section
    const settingsSection = document.querySelector('.settings-section');

    // ----- Helper Functions -----
    function formatDate(timestamp) {
        if (!timestamp) return 'Unknown';
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    function showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = message ? 'block' : 'none';
        }
    }

    // ----- Load Profile Data -----
    async function loadProfileData(profileId) {
        // Hide all type-specific sections initially
        supplierDetails.style.display = 'none';
        ratingSection.style.display = 'none';
        profileFooter.style.display = 'none';
        if (settingsSection) settingsSection.style.display = 'none';

        try {
            // Load user data from 'userdata' node
            const userRef = database.ref(`userdata/${profileId}`);
            const userSnapshot = await userRef.once('value');
            const userData = userSnapshot.val();

            if (!userData) {
                console.error('User not found');
                userName.textContent = 'User Not Found';
                return;
            }

            // Set basic user info from userdata
            userName.textContent = userData.name || 'No Name Provided';
            userTitle.textContent = userData.role || 'No Title Provided';
            emailValue.textContent = userData.email || 'Not available';
            phoneValue.textContent = userData.phone || 'Not provided';
            
            // Location might be in userdata or could be added later
            locationValue.textContent = userData.location || 'Not provided';
            
            // Set profile image
            if (userData.img) {
                profileImage.src = userData.img;
            }

            // Remove any existing profile type classes
            document.body.classList.remove('supplier-profile');

            // Check if this user is also a supplier (exists in 'merchants' node)
            const supplierSnap = await database.ref('merchants')
                .orderByChild('userId')
                .equalTo(profileId)
                .once('value');

            const isSupplier = supplierSnap.exists();

            if (isSupplier) {
                currentProfileType = 'supplier';
                document.body.classList.add('supplier-profile');
                supplierDetails.style.display = 'block';

                // Get the supplier record
                const supplierRecords = supplierSnap.val();
                const supplierKey = Object.keys(supplierRecords)[0];
                const supplierData = supplierRecords[supplierKey];
                currentProfileData = supplierData;

                // Override with supplier-specific display data
                userName.textContent = supplierData.orgName || userData.name || 'No Name Provided';
                userTitle.textContent = 'Supplier';
                emailValue.textContent = supplierData.email || userData.email || 'Not available';
                phoneValue.textContent = supplierData.phone || userData.phone || 'Not provided';
                locationValue.textContent = supplierData.location || userData.location || 'Not provided';

                if (supplierData.img) {
                    profileImage.src = supplierData.img;
                } else if (userData.img) {
                    profileImage.src = userData.img;
                }

                // Fill supplier-specific fields
                supplierOrg.textContent = supplierData.orgName || 'Not specified';
                supplierProducts.textContent = supplierData.productsOffered || supplierData.products || 'Not specified';
                if (supplierCertifications) {
                    supplierCertifications.textContent = supplierData.certifications || 'None listed';
                }
            } else {
                // Regular user
                currentProfileType = 'regular';
                currentProfileData = userData;
            }

            // Update contact links
            const whatsappLink = document.querySelector('.contact-icon.whatsapp');
            const emailLink = document.querySelector('.contact-icon.email');
            const phoneLink = document.querySelector('.contact-icon.phone');

            if (phoneValue.textContent !== 'Not provided') {
                const formattedPhone = phoneValue.textContent.replace(/[^\d+]/g, '');
                if (whatsappLink) whatsappLink.href = `https://wa.me/${formattedPhone}`;
                if (phoneLink) phoneLink.href = `tel:${formattedPhone}`;
            } else {
                if (whatsappLink) whatsappLink.removeAttribute('href');
                if (phoneLink) phoneLink.removeAttribute('href');
            }

            if (emailValue.textContent !== 'Not available' && emailLink) {
                emailLink.href = `mailto:${emailValue.textContent}`;
            } else if (emailLink) {
                emailLink.removeAttribute('href');
            }

            // Rating section – show only for suppliers and if viewer is not the owner
            const user = auth.currentUser;
            if (isSupplier && user && user.uid !== profileId) {
                ratingSection.style.display = 'block';
            } else {
                ratingSection.style.display = 'none';
            }

            // Owner-only sections (footer, settings)
            if (user && user.uid === profileId) {
                profileFooter.style.display = 'none';
                if (settingsSection) settingsSection.style.display = 'block';

                // Load profile views count
                const viewsRef = database.ref(`profileViews/${profileId}`);
                viewsRef.once('value').then(snapshot => {
                    const views = snapshot.val() || 0;
                    viewCountElement.textContent = views;
                });
            } else {
                profileFooter.style.display = 'none';
                if (settingsSection) settingsSection.style.display = 'none';

                // Increment view count (only for non-owners and logged-in users)
                if (user) {
                    const viewsRef = database.ref(`profileViews/${profileId}`);
                    viewsRef.transaction(currentViews => (currentViews || 0) + 1);
                }
            }

        } catch (error) {
            console.error('Error loading profile:', error);
            userName.textContent = 'Error Loading Profile';
        }
    }

    // ----- Presence / Online Status -----
    function setupPresence(uid) {
        const userStatusRef = database.ref('status/' + uid);
        
        const isOffline = {
            state: 'offline',
            last_changed: firebase.database.ServerValue.TIMESTAMP
        };
        
        const isOnline = {
            state: 'online',
            last_changed: firebase.database.ServerValue.TIMESTAMP
        };
        
        database.ref('.info/connected').on('value', (snapshot) => {
            if (snapshot.val() === false) return;
            
            userStatusRef.onDisconnect().set(isOffline).then(() => {
                userStatusRef.set(isOnline);
            });
        });
        
        userStatusRef.on('value', (snapshot) => {
            const status = snapshot.val();
            if (onlineStatus) {
                onlineStatus.style.backgroundColor = (status && status.state === 'online') ? '#2ECC71' : '#95a5a6';
            }
        });
    }

    // ----- Edit Profile Modal -----
    function showEditModal() {
        const modal = document.getElementById('edit-profile-modal');
        modal.style.display = 'block';

        // Hide all specialised field sections initially
        document.getElementById('supplier-fields').style.display = 'none';
        document.getElementById('image-upload-progress').style.display = 'none';
        document.getElementById('edit-success').style.display = 'none';
        document.getElementById('edit-error').textContent = '';

        // Setup image preview
        setupImagePreview();

        // Populate common fields from currentProfileData
        document.getElementById('edit-name').value = userName.textContent;
        document.getElementById('edit-phone').value = phoneValue.textContent;

        // If user is a supplier, show supplier fields and fill them
        if (currentProfileType === 'supplier' && currentProfileData) {
            document.getElementById('supplier-fields').style.display = 'block';
            document.getElementById('edit-org').value = supplierOrg.textContent;
            document.getElementById('edit-products').value = currentProfileData.productsOffered || currentProfileData.products || '';
            if (document.getElementById('edit-certifications')) {
                document.getElementById('edit-certifications').value = currentProfileData.certifications || '';
            }
        }
    }

    function hideEditModal() {
        document.getElementById('edit-profile-modal').style.display = 'none';
    }

    function setupImagePreview() {
        const imageInput = document.getElementById('edit-profile-image');
        const previewContainer = document.querySelector('.image-preview-container');
        if (!previewContainer) return;

        const previewImg = previewContainer.querySelector('.image-preview');
        const changeBtn = document.getElementById('change-image-btn');

        if (changeBtn) {
            changeBtn.addEventListener('click', () => imageInput.click());
        }

        imageInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    if (previewImg) previewImg.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    async function uploadProfileImage(file, userId) {
        const progressContainer = document.getElementById('image-upload-progress');
        if (!progressContainer) return null;

        const progressBar = progressContainer.querySelector('.progress-bar');
        const progressText = progressContainer.querySelector('.progress-text');

        progressContainer.style.display = 'block';

        try {
            if (file.size > 2 * 1024 * 1024) throw new Error('Image file size exceeds 2MB limit.');
            const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
            if (!allowedTypes.includes(file.type)) throw new Error('Only JPG, PNG, GIF images are allowed.');

            const storageRef = storage.ref(`profile-images/${userId}/${Date.now()}_${file.name}`);
            const uploadTask = storageRef.put(file);

            return new Promise((resolve, reject) => {
                uploadTask.on('state_changed',
                    (snapshot) => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        progressBar.style.width = `${progress}%`;
                        progressText.textContent = `Uploading: ${Math.round(progress)}%`;
                    },
                    (error) => {
                        progressContainer.style.display = 'none';
                        reject(error);
                    },
                    async () => {
                        const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
                        progressText.textContent = 'Upload complete!';
                        setTimeout(() => {
                            progressContainer.style.display = 'none';
                        }, 2000);
                        resolve(downloadURL);
                    }
                );
            });
        } catch (error) {
            showError('edit-error', error.message);
            progressContainer.style.display = 'none';
            return null;
        }
    }

    async function saveProfileChanges() {
        const userId = currentUser.uid;
        const name = document.getElementById('edit-name').value;
        const phone = document.getElementById('edit-phone').value;
        const fileInput = document.getElementById('edit-profile-image');
        const file = fileInput.files[0];

        try {
            if (!name.trim()) throw new Error('Name is required');
            if (!phone.trim()) throw new Error('Phone is required');

            // Upload new image if selected
            if (file) {
                const imageUrl = await uploadProfileImage(file, userId);
                if (imageUrl) newProfileImageUrl = imageUrl;
            }

            // Update userdata
            const userUpdate = {
                name: name,
                phone: phone,
                updatedAt: firebase.database.ServerValue.TIMESTAMP
            };
            if (newProfileImageUrl) userUpdate.img = newProfileImageUrl;
            
            await database.ref(`userdata/${userId}`).update(userUpdate);

            // If supplier, update merchant record
            if (currentProfileType === 'supplier') {
                const supplierSnap = await database.ref('merchants')
                    .orderByChild('userId')
                    .equalTo(userId)
                    .once('value');

                if (supplierSnap.exists()) {
                    const supplierKey = Object.keys(supplierSnap.val())[0];
                    const supplierUpdate = {
                        orgName: document.getElementById('edit-org').value,
                        phone: phone,
                        productsOffered: document.getElementById('edit-products').value,
                        updatedAt: firebase.database.ServerValue.TIMESTAMP
                    };
                    if (newProfileImageUrl) supplierUpdate.img = newProfileImageUrl;
                    if (document.getElementById('edit-certifications')) {
                        supplierUpdate.certifications = document.getElementById('edit-certifications').value;
                    }

                    await database.ref(`merchants/${supplierKey}`).update(supplierUpdate);
                }
            }

            // Update displayed profile immediately
            userName.textContent = name;
            phoneValue.textContent = phone;
            if (newProfileImageUrl) profileImage.src = newProfileImageUrl;
            if (currentProfileType === 'supplier') {
                supplierOrg.textContent = document.getElementById('edit-org').value;
                supplierProducts.textContent = document.getElementById('edit-products').value;
            }

            // Show success
            document.getElementById('edit-success').style.display = 'block';
            document.getElementById('edit-error').textContent = '';

            setTimeout(hideEditModal, 2000);
        } catch (error) {
            showError('edit-error', error.message);
        }
    }

    function setupEditModal() {
        const modal = document.getElementById('edit-profile-modal');
        if (!modal) return;

        // Close button
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', hideEditModal);
        }

        // Click outside to close
        window.addEventListener('click', (e) => {
            if (e.target === modal) hideEditModal();
        });

        // Save button
        const saveBtn = document.getElementById('save-profile-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', saveProfileChanges);
        }
    }

    // ----- Full Image View Modal -----
    function showFullProfileImage() {
        const modal = document.createElement('div');
        modal.className = 'image-modal';
        modal.innerHTML = `
            <div class="image-modal-content">
                <span class="image-modal-close">&times;</span>
                <img src="${profileImage.src}" alt="Profile Picture" class="full-profile-image">
                <p class="image-caption">${userName.textContent}</p>
            </div>
        `;
        document.body.appendChild(modal);

        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.classList.contains('image-modal-close')) {
                document.body.removeChild(modal);
            }
        });

        // Add styles if not already present
        if (!document.getElementById('image-modal-styles')) {
            const style = document.createElement('style');
            style.id = 'image-modal-styles';
            style.textContent = `
                .image-modal {
                    display: flex;
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0,0,0,0.9);
                    z-index: 10000;
                    align-items: center;
                    justify-content: center;
                }
                .image-modal-content {
                    position: relative;
                    max-width: 90%;
                    max-height: 90%;
                }
                .full-profile-image {
                    max-width: 100%;
                    max-height: 80vh;
                    border-radius: 10px;
                    object-fit: contain;
                }
                .image-modal-close {
                    position: absolute;
                    top: -40px;
                    right: 0;
                    color: white;
                    font-size: 40px;
                    cursor: pointer;
                }
                .image-caption {
                    color: white;
                    text-align: center;
                    margin-top: 10px;
                    font-size: 1.2rem;
                }
            `;
            document.head.appendChild(style);
        }
    }

    // ----- Initialisation -----
    function initializeProfile() {
        if (!profileId) {
            // No profile ID provided, redirect to home or show error
            window.location.href = 'index.html';
            return;
        }

        setupPresence(profileId);
        loadProfileData(profileId);

        // Owner-only actions
        auth.onAuthStateChanged(user => {
            currentUser = user;
            if (user && user.uid === profileId) {
                if (editIcon) {
                    editIcon.style.display = 'flex';
                    editIcon.addEventListener('click', () => {
  window.location.href = 'settings.html';
});
                }
            }
        });

        // Settings button (if present)
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                window.location.href = 'settings.html';
            });
        }

        // Click profile image for full view
        if (profileImage) {
            profileImage.addEventListener('click', showFullProfileImage);
        }

        // Initialise view count if needed
        const viewsRef = database.ref(`profileViews/${profileId}`);
        viewsRef.once('value').then(snapshot => {
            if (!snapshot.exists()) viewsRef.set(0);
        });

        setupEditModal();
    }

    // Go!
    initializeProfile();
});
