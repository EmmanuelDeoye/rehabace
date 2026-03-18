// assets/js/account-settings.js
// RehabAce Account Settings JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize Firebase
    const auth = firebase.auth();
    const database = firebase.database();
    const storage = firebase.storage();
    
    // Global variables
    let currentUser = null;
    let currentUserData = null;
    let currentUserRole = null;
    let newProfileImageUrl = null;
    
    // DOM Elements
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const settingsTabs = document.querySelectorAll('.settings-tab');
    const logoutBtn = document.getElementById('logout-btn');
    const profileImagePreview = document.getElementById('profile-image-preview');
    const profileImageInput = document.getElementById('profile-image-input');
    const changePhotoBtn = document.getElementById('change-photo-btn');
    
    // Form Elements
    const fullNameInput = document.getElementById('full-name');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const locationInput = document.getElementById('location');
    const bioInput = document.getElementById('bio');
    const saveProfileBtn = document.getElementById('save-profile-btn');
    const profileSaveMessage = document.getElementById('profile-save-message');
    
    // Supplier Fields
    const supplierFields = document.getElementById('supplier-fields');
    const orgNameInput = document.getElementById('org-name');
    const orgProductsInput = document.getElementById('org-products');
    const orgCertificationsInput = document.getElementById('org-certifications');
    
    // Practitioner Message
    const practitionerMessage = document.getElementById('practitioner-message');
    const redirectToVerve = document.getElementById('redirect-to-verve');
    
    // Password Elements
    const currentPasswordInput = document.getElementById('current-password');
    const newPasswordInput = document.getElementById('new-password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const changePasswordBtn = document.getElementById('change-password-btn');
    const passwordMessage = document.getElementById('password-message');
    const strengthBar = document.getElementById('strength-bar');
    const strengthText = document.getElementById('strength-text');
    const passwordMatch = document.getElementById('password-match');
    
    // Password toggles
    const currentPasswordToggle = document.getElementById('current-password-toggle');
    const newPasswordToggle = document.getElementById('new-password-toggle');
    const confirmPasswordToggle = document.getElementById('confirm-password-toggle');
    
    // Notification toggles
    const marketingEmails = document.getElementById('marketing-emails');
    const orderUpdates = document.getElementById('order-updates');
    const productInquiries = document.getElementById('product-inquiries');
    const saveNotificationsBtn = document.getElementById('save-notifications-btn');
    const notificationsMessage = document.getElementById('notifications-message');
    
    // RehabVerve Modal
    const rehabverveModal = document.getElementById('rehabverve-modal');
    const modalClose = rehabverveModal?.querySelector('.modal-close');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const rehabverveRedirectLink = document.getElementById('rehabverve-redirect-link');
    
    // Logout all devices
    const logoutAllBtn = document.getElementById('logout-all-btn');
    
    // FAQ items
    const faqItems = document.querySelectorAll('.faq-item');
    
    // ========== AUTH STATE OBSERVER ==========
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            console.log('User logged in:', user.uid);
            
            // Load user data from database
            await loadUserData(user.uid);
            
            // Populate form with user data
            populateUserData();
            
            // Check user role and show appropriate fields
            checkUserRole();
            
            // Update profile image preview
            if (currentUserData?.img) {
                profileImagePreview.src = currentUserData.img;
            } else if (user.photoURL) {
                profileImagePreview.src = user.photoURL;
            }
            
            // Set email (read-only)
            emailInput.value = user.email || '';
        } else {
            // No user logged in, redirect to home
            console.log('No user logged in, redirecting...');
            window.location.href = 'index.html';
        }
    }, (error) => {
        console.error('Auth state error:', error);
        showNotification('Authentication error. Please log in again.', 'error');
        window.location.href = 'index.html';
    });
    
    // ========== LOAD USER DATA ==========
    async function loadUserData(uid) {
        try {
            // Get user data from userdata node
            const userSnapshot = await database.ref(`userdata/${uid}`).once('value');
            currentUserData = userSnapshot.val() || {};
            
            // Get user role
            currentUserRole = currentUserData.role || 'user';
            
            console.log('User data loaded:', currentUserData);
            console.log('User role:', currentUserRole);
            
            // Check if user is also a supplier
            const supplierSnapshot = await database.ref('merchants')
                .orderByChild('userId')
                .equalTo(uid)
                .once('value');
                
            if (supplierSnapshot.exists()) {
                const supplierData = Object.values(supplierSnapshot.val())[0];
                currentUserData.supplierData = supplierData;
                currentUserRole = 'supplier';
                console.log('User is a supplier');
            }
            
        } catch (error) {
            console.error('Error loading user data:', error);
            showNotification('Error loading profile data', 'error');
        }
    }
    
    // ========== POPULATE USER DATA ==========
    function populateUserData() {
        if (!currentUserData) return;
        
        fullNameInput.value = currentUserData.name || '';
        phoneInput.value = currentUserData.phone || '';
        locationInput.value = currentUserData.location || '';
        bioInput.value = currentUserData.bio || '';
        
        // Populate supplier fields if they exist
        if (currentUserData.supplierData) {
            supplierFields.style.display = 'block';
            orgNameInput.value = currentUserData.supplierData.orgName || '';
            orgProductsInput.value = currentUserData.supplierData.productsOffered || currentUserData.supplierData.products || '';
            orgCertificationsInput.value = currentUserData.supplierData.certifications || '';
        }
    }
    
    // ========== CHECK USER ROLE ==========
    function checkUserRole() {
        const practitionerRoles = ['practitioner', 'therapist', 'doctor', 'healthcare', 'center', 'clinic', 'hospital'];
        
        if (currentUserRole && practitionerRoles.includes(currentUserRole.toLowerCase())) {
            console.log('Healthcare professional detected, showing RehabVerve message');
            
            // Hide edit form and show message
            document.querySelector('.profile-form').style.opacity = '0.5';
            document.querySelector('.profile-form').style.pointerEvents = 'none';
            
            // Show practitioner message
            if (practitionerMessage) {
                practitionerMessage.style.display = 'flex';
            }
            
            // Set redirect link
            if (redirectToVerve) {
                redirectToVerve.href = `https://rehabverve.com.ng/users.html?id=${currentUser.uid}`;
            }
        } else {
            // Hide practitioner message
            if (practitionerMessage) {
                practitionerMessage.style.display = 'none';
            }
            
            document.querySelector('.profile-form').style.opacity = '1';
            document.querySelector('.profile-form').style.pointerEvents = 'auto';
        }
    }
    
    // ========== TAB NAVIGATION ==========
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all links and tabs
            sidebarLinks.forEach(l => l.classList.remove('active'));
            settingsTabs.forEach(tab => tab.classList.remove('active'));
            
            // Add active class to clicked link
            this.classList.add('active');
            
            // Show corresponding tab
            const tabId = this.dataset.tab;
            document.getElementById(`${tabId}-tab`).classList.add('active');
            
            // Update URL hash
            window.location.hash = tabId;
        });
    });
    
    // Check URL hash on load
    if (window.location.hash) {
        const hash = window.location.hash.substring(1);
        const activeLink = document.querySelector(`.sidebar-link[data-tab="${hash}"]`);
        if (activeLink) {
            activeLink.click();
        }
    }
    
    // ========== PROFILE IMAGE UPLOAD ==========
    if (changePhotoBtn) {
        changePhotoBtn.addEventListener('click', function() {
            profileImageInput.click();
        });
    }
    
    if (profileImageInput) {
        profileImageInput.addEventListener('change', async function(e) {
            const file = e.target.files[0];
            if (!file) return;
            
            // Validate file
            if (file.size > 2 * 1024 * 1024) {
                showNotification('Image size must be less than 2MB', 'error');
                return;
            }
            
            if (!file.type.startsWith('image/')) {
                showNotification('Please select an image file', 'error');
                return;
            }
            
            // Show preview
            const reader = new FileReader();
            reader.onload = function(e) {
                profileImagePreview.src = e.target.result;
            };
            reader.readAsDataURL(file);
            
            // Upload to Firebase Storage
            try {
                const storageRef = storage.ref(`profile-images/${currentUser.uid}/${Date.now()}_${file.name}`);
                const uploadTask = storageRef.put(file);
                
                // Show upload progress (optional)
                showNotification('Uploading image...', 'info');
                
                await uploadTask;
                newProfileImageUrl = await storageRef.getDownloadURL();
                
                showNotification('Image uploaded successfully!', 'success');
            } catch (error) {
                console.error('Upload error:', error);
                showNotification('Error uploading image', 'error');
            }
        });
    }
    
    // ========== SAVE PROFILE ==========
    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', async function() {
            // Check if user is practitioner (should not be able to save)
            const practitionerRoles = ['practitioner', 'therapist', 'doctor', 'healthcare', 'center', 'clinic', 'hospital'];
            if (currentUserRole && practitionerRoles.includes(currentUserRole.toLowerCase())) {
                // Show RehabVerve modal instead of saving
                if (rehabverveModal && rehabverveRedirectLink) {
                    rehabverveRedirectLink.href = `https://rehabverve.com.ng/users.html?id=${currentUser.uid}`;
                    rehabverveModal.style.display = 'block';
                    document.body.style.overflow = 'hidden';
                }
                return;
            }
            
            // Validate inputs
            if (!fullNameInput.value.trim()) {
                showFormMessage(profileSaveMessage, 'Please enter your full name', 'error');
                return;
            }
            
            if (!phoneInput.value.trim()) {
                showFormMessage(profileSaveMessage, 'Please enter your phone number', 'error');
                return;
            }
            
            // Disable button and show loading
            saveProfileBtn.disabled = true;
            saveProfileBtn.textContent = 'Saving...';
            
            try {
                // Prepare update object
                const updates = {
                    name: fullNameInput.value.trim(),
                    phone: phoneInput.value.trim(),
                    location: locationInput.value.trim() || '',
                    bio: bioInput.value.trim() || '',
                    updatedAt: firebase.database.ServerValue.TIMESTAMP
                };
                
                // Add new image URL if uploaded
                if (newProfileImageUrl) {
                    updates.img = newProfileImageUrl;
                }
                
                // Update userdata
                await database.ref(`userdata/${currentUser.uid}`).update(updates);
                
                // Update supplier data if applicable
                if (currentUserRole === 'supplier' && supplierFields.style.display === 'block') {
                    const supplierSnapshot = await database.ref('merchants')
                        .orderByChild('userId')
                        .equalTo(currentUser.uid)
                        .once('value');
                        
                    if (supplierSnapshot.exists()) {
                        const supplierKey = Object.keys(supplierSnapshot.val())[0];
                        const supplierUpdates = {
                            orgName: orgNameInput.value.trim(),
                            productsOffered: orgProductsInput.value.trim(),
                            certifications: orgCertificationsInput.value.trim() || '',
                            updatedAt: firebase.database.ServerValue.TIMESTAMP
                        };
                        
                        if (newProfileImageUrl) {
                            supplierUpdates.img = newProfileImageUrl;
                        }
                        
                        await database.ref(`merchants/${supplierKey}`).update(supplierUpdates);
                    }
                }
                
                // Show success message
                showFormMessage(profileSaveMessage, 'Profile updated successfully!', 'success');
                
                // Reset new image URL
                newProfileImageUrl = null;
                
                // Reload user data
                await loadUserData(currentUser.uid);
                
            } catch (error) {
                console.error('Save error:', error);
                showFormMessage(profileSaveMessage, 'Error saving profile. Please try again.', 'error');
            } finally {
                // Re-enable button
                saveProfileBtn.disabled = false;
                saveProfileBtn.textContent = 'Save Changes';
            }
        });
    }
    
    // ========== PASSWORD STRENGTH INDICATOR ==========
    if (newPasswordInput) {
        newPasswordInput.addEventListener('input', function() {
            const password = this.value;
            const strength = checkPasswordStrength(password);
            
            // Update strength bar
            if (strengthBar) {
                strengthBar.style.setProperty('--strength-width', strength.percentage + '%');
                strengthBar.style.setProperty('--strength-color', strength.color);
            }
            
            if (strengthText) {
                strengthText.textContent = strength.label;
                strengthText.style.color = strength.color;
            }
            
            // Check password match
            checkPasswordMatch();
        });
    }
    
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', checkPasswordMatch);
    }
    
    function checkPasswordStrength(password) {
        if (!password) {
            return { percentage: 0, color: '#e74c3c', label: 'Too weak' };
        }
        
        let strength = 0;
        
        // Length check
        if (password.length >= 6) strength += 25;
        if (password.length >= 8) strength += 10;
        
        // Character variety checks
        if (/[a-z]/.test(password)) strength += 15;
        if (/[A-Z]/.test(password)) strength += 15;
        if (/[0-9]/.test(password)) strength += 15;
        if (/[^a-zA-Z0-9]/.test(password)) strength += 20;
        
        // Cap at 100
        strength = Math.min(strength, 100);
        
        // Determine label and color
        if (strength < 30) {
            return { percentage: strength, color: '#e74c3c', label: 'Too weak' };
        } else if (strength < 50) {
            return { percentage: strength, color: '#f39c12', label: 'Fair' };
        } else if (strength < 70) {
            return { percentage: strength, color: '#f1c40f', label: 'Good' };
        } else {
            return { percentage: strength, color: '#2ecc71', label: 'Strong' };
        }
    }
    
    function checkPasswordMatch() {
        if (!passwordMatch) return;
        
        const newPass = newPasswordInput.value;
        const confirmPass = confirmPasswordInput.value;
        
        if (!confirmPass) {
            passwordMatch.textContent = '';
            passwordMatch.style.color = '';
            return;
        }
        
        if (newPass === confirmPass) {
            passwordMatch.textContent = '✓ Passwords match';
            passwordMatch.style.color = '#2ecc71';
        } else {
            passwordMatch.textContent = '✗ Passwords do not match';
            passwordMatch.style.color = '#e74c3c';
        }
    }
    
    // ========== PASSWORD TOGGLES ==========
    function setupPasswordToggle(toggle, input) {
        if (!toggle || !input) return;
        
        toggle.addEventListener('click', function() {
            const type = input.type === 'password' ? 'text' : 'password';
            input.type = type;
            
            const icon = this.querySelector('i');
            if (icon) {
                icon.classList.toggle('bx-hide');
                icon.classList.toggle('bx-show');
            }
        });
    }
    
    setupPasswordToggle(currentPasswordToggle, currentPasswordInput);
    setupPasswordToggle(newPasswordToggle, newPasswordInput);
    setupPasswordToggle(confirmPasswordToggle, confirmPasswordInput);
    
    // ========== CHANGE PASSWORD ==========
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', async function() {
            const currentPassword = currentPasswordInput.value;
            const newPassword = newPasswordInput.value;
            const confirmPassword = confirmPasswordInput.value;
            
            // Validate
            if (!currentPassword) {
                showFormMessage(passwordMessage, 'Please enter your current password', 'error');
                return;
            }
            
            if (!newPassword) {
                showFormMessage(passwordMessage, 'Please enter a new password', 'error');
                return;
            }
            
            if (newPassword.length < 6) {
                showFormMessage(passwordMessage, 'Password must be at least 6 characters', 'error');
                return;
            }
            
            if (newPassword !== confirmPassword) {
                showFormMessage(passwordMessage, 'Passwords do not match', 'error');
                return;
            }
            
            // Disable button
            changePasswordBtn.disabled = true;
            changePasswordBtn.textContent = 'Updating...';
            
            try {
                // Re-authenticate user
                const credential = firebase.auth.EmailAuthProvider.credential(
                    currentUser.email,
                    currentPassword
                );
                
                await currentUser.reauthenticateWithCredential(credential);
                
                // Update password
                await currentUser.updatePassword(newPassword);
                
                // Show success
                showFormMessage(passwordMessage, 'Password updated successfully!', 'success');
                
                // Clear inputs
                currentPasswordInput.value = '';
                newPasswordInput.value = '';
                confirmPasswordInput.value = '';
                
            } catch (error) {
                console.error('Password update error:', error);
                
                let message = 'Error updating password';
                if (error.code === 'auth/wrong-password') {
                    message = 'Current password is incorrect';
                } else if (error.code === 'auth/weak-password') {
                    message = 'New password is too weak';
                } else if (error.code === 'auth/requires-recent-login') {
                    message = 'Please log out and log in again';
                }
                
                showFormMessage(passwordMessage, message, 'error');
            } finally {
                changePasswordBtn.disabled = false;
                changePasswordBtn.textContent = 'Update Password';
            }
        });
    }
    
    // ========== LOGOUT ==========
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function() {
            try {
                await auth.signOut();
                window.location.href = 'index.html';
            } catch (error) {
                console.error('Logout error:', error);
                showNotification('Error logging out', 'error');
            }
        });
    }
    
    // ========== LOGOUT ALL DEVICES ==========
    if (logoutAllBtn) {
        logoutAllBtn.addEventListener('click', async function() {
            if (!confirm('This will sign you out from all devices. Continue?')) {
                return;
            }
            
            try {
                // Revoke refresh tokens
                await currentUser.reload();
                
                // This forces all sessions to require re-authentication
                await auth.signOut();
                
                showNotification('Signed out from all devices. Please log in again.', 'success');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
                
            } catch (error) {
                console.error('Logout all error:', error);
                showNotification('Error signing out from all devices', 'error');
            }
        });
    }
    
    // ========== NOTIFICATION PREFERENCES ==========
    if (saveNotificationsBtn) {
        saveNotificationsBtn.addEventListener('click', async function() {
            const preferences = {
                marketing: marketingEmails?.checked || false,
                orders: orderUpdates?.checked || false,
                inquiries: productInquiries?.checked || false,
                updatedAt: firebase.database.ServerValue.TIMESTAMP
            };
            
            saveNotificationsBtn.disabled = true;
            saveNotificationsBtn.textContent = 'Saving...';
            
            try {
                await database.ref(`notifications/${currentUser.uid}`).set(preferences);
                showFormMessage(notificationsMessage, 'Notification preferences saved!', 'success');
            } catch (error) {
                console.error('Error saving notifications:', error);
                showFormMessage(notificationsMessage, 'Error saving preferences', 'error');
            } finally {
                saveNotificationsBtn.disabled = false;
                saveNotificationsBtn.textContent = 'Save Preferences';
            }
        });
        
        // Load notification preferences
        async function loadNotificationPreferences() {
            if (!currentUser) return;
            
            try {
                const snapshot = await database.ref(`notifications/${currentUser.uid}`).once('value');
                const prefs = snapshot.val() || {};
                
                if (marketingEmails) marketingEmails.checked = prefs.marketing !== false;
                if (orderUpdates) orderUpdates.checked = prefs.orders !== false;
                if (productInquiries) productInquiries.checked = prefs.inquiries !== false;
                
            } catch (error) {
                console.error('Error loading notification preferences:', error);
            }
        }
        
        // Load preferences after user data is loaded
        if (currentUser) {
            loadNotificationPreferences();
        }
    }
    
    // ========== FAQ ACCORDION ==========
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', () => {
            // Close other open items
            faqItems.forEach(otherItem => {
                if (otherItem !== item && otherItem.classList.contains('open')) {
                    otherItem.classList.remove('open');
                }
            });
            
            // Toggle current item
            item.classList.toggle('open');
        });
    });
    
    // ========== REHABVERVE MODAL ==========
    if (rehabverveModal) {
        // Close modal when clicking close button
        if (modalClose) {
            modalClose.addEventListener('click', closeRehabVerveModal);
        }
        
        // Close modal when clicking outside
        window.addEventListener('click', function(e) {
            if (e.target === rehabverveModal) {
                closeRehabVerveModal();
            }
        });
        
        // Close modal when clicking close button
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', closeRehabVerveModal);
        }
    }
    
    function closeRehabVerveModal() {
        if (rehabverveModal) {
            rehabverveModal.style.display = 'none';
            document.body.style.overflow = '';
        }
    }
    
    // ========== SHOW FORM MESSAGE ==========
    function showFormMessage(element, message, type) {
        if (!element) return;
        
        element.textContent = message;
        element.className = 'form-message ' + type;
        element.style.display = 'block';
        
        // Hide after 5 seconds for success messages
        if (type === 'success') {
            setTimeout(() => {
                element.style.display = 'none';
            }, 5000);
        }
    }
    
    // ========== SHOW NOTIFICATION ==========
    function showNotification(message, type = 'info') {
        // Check if notification container exists
        let container = document.getElementById('notification-container');
        
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            document.body.appendChild(container);
        }
        
        const notification = document.createElement('div');
        notification.className = `notification-toast ${type}`;
        notification.textContent = message;
        
        // Style
        notification.style.cssText = `
            background: ${type === 'error' ? '#f44336' : type === 'success' ? '#4caf50' : '#2196f3'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            margin-bottom: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideIn 0.3s ease;
            font-weight: 500;
        `;
        
        container.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }
    
    // ========== LOAD ACTIVE SESSIONS ==========
    async function loadSessions() {
        // This would require a backend endpoint to list active sessions
        // For now, we'll just show a placeholder
        const sessionsList = document.getElementById('sessions-list');
        if (!sessionsList) return;
        
        // You would typically fetch this from your backend
        // This is just a placeholder
        sessionsList.innerHTML = `
            <div class="session-item current">
                <div class="session-info">
                    <i class='bx bx-devices'></i>
                    <div>
                        <strong>Current Session</strong>
                        <p>${navigator.platform} · ${navigator.userAgent.split(' ').slice(-1)[0]}</p>
                        <small>Last active: Now</small>
                    </div>
                </div>
                <span class="session-badge">Current</span>
            </div>
        `;
    }
    
    // Load sessions on security tab
    const securityTab = document.getElementById('security-tab');
    if (securityTab) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.target.classList.contains('active')) {
                    loadSessions();
                }
            });
        });
        
        observer.observe(securityTab, { attributes: true, attributeFilter: ['class'] });
    }
});