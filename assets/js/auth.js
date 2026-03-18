// assets/js/auth.js
// Advanced Firebase Authentication handler for REHABACE
// Handles user state, UI updates, sign-up, sign-in, sign-out

(function() {
  // ---------- CONFIGURATION ----------
  const DEFAULT_PROFILE_IMAGE = 'assets/img/profile.png';
  const ACCOUNT_PAGE_URL = 'users.html?id=';  // Will append uid dynamically
  
  // Toast notification container (create if not exists)
  let notificationContainer = document.getElementById('notification-container');
  if (!notificationContainer) {
    notificationContainer = document.createElement('div');
    notificationContainer.id = 'notification-container';
    document.body.appendChild(notificationContainer);
  }

  // ---------- UTILITIES ----------
  function showNotification(message, type = 'info', duration = 4000) {
    const toast = document.createElement('div');
    toast.className = `notification-toast ${type}`;
    toast.textContent = message;
    
    // Basic styling (can be enhanced via CSS)
    toast.style.cssText = `
      background: ${type === 'error' ? '#f44336' : type === 'success' ? '#4caf50' : '#2196f3'};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      margin-bottom: 10px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      animation: slideIn 0.3s ease;
      font-weight: 500;
    `;
    
    notificationContainer.appendChild(toast);
    
    // Remove after duration
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  // ---------- UI UPDATE FUNCTION ----------
  function updateUIForUser(user) {
    // Elements that may or may not exist on current page
    const profileImageNav = document.getElementById('profileImageNav');
    const signupNavItem = document.getElementById('signup-nav-item');
    const myProfileNavItem = document.getElementById('my-profile-nav-item');
    const profileImg = profileImageNav?.querySelector('img');
    
    if (user) {
      // User is signed in
      console.log('User logged in:', user.uid);
      
      // Show profile image, set src
      if (profileImageNav) {
        profileImageNav.style.display = 'flex';
        if (profileImg) {
          profileImg.src = user.photoURL || DEFAULT_PROFILE_IMAGE;
          profileImg.alt = user.displayName || 'Profile';
        }
      }
      
      // Navigation items
      if (myProfileNavItem) {
        const accountLink = myProfileNavItem.querySelector('a');
        if (accountLink) {
          accountLink.href = `users.html?id=${user.uid}`;
        }
        myProfileNavItem.style.display = 'none';
      }
      
      if (signupNavItem) signupNavItem.style.display = 'none';
      
      // Store user info in session
      sessionStorage.setItem('rehabace_user', JSON.stringify({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
      }));

      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('authStateChanged', { 
        detail: { user, isLoggedIn: true } 
      }));
    } else {
      // User is signed out
      console.log('User logged out');
      
      if (profileImageNav) profileImageNav.style.display = 'none';
      if (signupNavItem) signupNavItem.style.display = 'block';
      if (myProfileNavItem) {
        myProfileNavItem.style.display = 'none';
      }
      
      sessionStorage.removeItem('rehabace_user');

      window.dispatchEvent(new CustomEvent('authStateChanged', { 
        detail: { user: null, isLoggedIn: false } 
      }));
    }
  }

  // ---------- AUTH MODAL FUNCTIONS ----------
  function openAuthModal(activeTab = 'login') {
    const modal = document.getElementById('auth-modal');
    if (!modal) return;
    
    // Set active tab
    const tabs = modal.querySelectorAll('.auth-tab');
    const forms = modal.querySelectorAll('.auth-form');
    
    tabs.forEach(tab => {
      const tabForm = tab.dataset.form;
      if (tabForm === activeTab) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
    
    forms.forEach(form => {
      if (form.id === `${activeTab}-form`) {
        form.classList.add('active');
      } else {
        form.classList.remove('active');
      }
    });
    
    // Clear any previous error messages
    const errorMessages = modal.querySelectorAll('.error-message');
    errorMessages.forEach(el => el.textContent = '');
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Prevent scrolling
  }

  function closeAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = ''; // Restore scrolling
    }
  }

  // ---------- AUTH FORM HANDLING ----------
  function setupAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (!modal) return;
    
    // Close button
    const closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeAuthModal);
    }
    
    // Click outside to close
    window.addEventListener('click', (e) => {
      if (e.target === modal) closeAuthModal();
    });
    
    // Tab switching
    const tabs = modal.querySelectorAll('.auth-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const formType = tab.dataset.form;
        
        // Update tabs
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Update forms
        const forms = modal.querySelectorAll('.auth-form');
        forms.forEach(form => {
          form.classList.remove('active');
        });
        document.getElementById(`${formType}-form`).classList.add('active');
        
        // Clear errors
        const errorMessages = modal.querySelectorAll('.error-message');
        errorMessages.forEach(el => el.textContent = '');
      });
    });
    
    // Switch links
    const showRegister = document.getElementById('show-register');
    const showLogin = document.getElementById('show-login');
    
    if (showRegister) {
      showRegister.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Update tabs
        tabs.forEach(t => t.classList.remove('active'));
        document.querySelector('.auth-tab[data-form="register"]').classList.add('active');
        
        // Update forms
        document.getElementById('login-form').classList.remove('active');
        document.getElementById('register-form').classList.add('active');
      });
    }
    
    if (showLogin) {
      showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Update tabs
        tabs.forEach(t => t.classList.remove('active'));
        document.querySelector('.auth-tab[data-form="login"]').classList.add('active');
        
        // Update forms
        document.getElementById('register-form').classList.remove('active');
        document.getElementById('login-form').classList.add('active');
      });
    }
    
    // Password visibility toggles
    setupPasswordToggles();
    
    // Form submissions
    setupLoginForm();
    setupRegisterForm();
  }

  function setupPasswordToggles() {
    // Login password toggle
    const loginToggle = document.getElementById('login-password-toggle');
    if (loginToggle) {
      loginToggle.addEventListener('click', function() {
        const passwordInput = document.getElementById('login-password');
        const icon = this.querySelector('i');
        
        if (passwordInput.type === 'password') {
          passwordInput.type = 'text';
          icon.classList.remove('bx-hide');
          icon.classList.add('bx-show');
        } else {
          passwordInput.type = 'password';
          icon.classList.remove('bx-show');
          icon.classList.add('bx-hide');
        }
      });
    }
    
    // Register password toggle
    const registerToggle = document.getElementById('register-password-toggle');
    if (registerToggle) {
      registerToggle.addEventListener('click', function() {
        const passwordInput = document.getElementById('register-password');
        const icon = this.querySelector('i');
        
        if (passwordInput.type === 'password') {
          passwordInput.type = 'text';
          icon.classList.remove('bx-hide');
          icon.classList.add('bx-show');
        } else {
          passwordInput.type = 'password';
          icon.classList.remove('bx-show');
          icon.classList.add('bx-hide');
        }
      });
    }
  }

  function setupLoginForm() {
    const loginForm = document.getElementById('login-form');
    if (!loginForm) return;
    
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      const termsCheckbox = document.getElementById('login-terms');
      
      // Validate terms agreement
      if (!termsCheckbox.checked) {
        document.getElementById('login-error').textContent = 'You must agree to the Terms and Privacy policy';
        return;
      }
      
      // Show loading state
      const submitBtn = loginForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Logging in...';
      submitBtn.disabled = true;
      
      try {
        await window.RehabAuth.signIn(email, password);
        closeAuthModal();
        // Reset form
        loginForm.reset();
      } catch (error) {
        document.getElementById('login-error').textContent = error.message;
      } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    });
  }

  function setupRegisterForm() {
    const registerForm = document.getElementById('register-form');
    if (!registerForm) return;
    
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const name = document.getElementById('register-name').value;
      const email = document.getElementById('register-email').value;
      const password = document.getElementById('register-password').value;
      const termsCheckbox = document.getElementById('register-terms');
      
      // Validate terms agreement
      if (!termsCheckbox.checked) {
        document.getElementById('register-error').textContent = 'You must agree to the Terms and Privacy policy';
        return;
      }
      
      // Show loading state
      const submitBtn = registerForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Creating account...';
      submitBtn.disabled = true;
      
      try {
        await window.RehabAuth.signUp(email, password, name);
        closeAuthModal();
        // Reset form
        registerForm.reset();
        
        // Optional: Show success message
        showNotification('Account created successfully! Please complete your profile.', 'success');
      } catch (error) {
        document.getElementById('register-error').textContent = error.message;
      } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    });
  }

  // ---------- FIREBASE AUTH STATE OBSERVER ----------
  function initAuth() {
    if (typeof firebase === 'undefined' || !firebase.auth) {
      console.error('Firebase Auth not available');
      showNotification('Authentication service unavailable', 'error');
      return;
    }
    
    const auth = firebase.auth();
    
    // Set persistence to LOCAL to stay logged in across sessions
    auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
      .catch(err => console.warn('Persistence error:', err));
    
    // Listen for auth state changes
    auth.onAuthStateChanged(user => {
      updateUIForUser(user);
    }, error => {
      console.error('Auth state error:', error);
      showNotification('Authentication error', 'error');
    });
  }

  // ---------- AUTHENTICATION FUNCTIONS (exposed globally) ----------
  window.RehabAuth = {
    // Sign up with email & password
    signUp: async (email, password, displayName = '') => {
      try {
        const auth = firebase.auth();
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Update profile with display name
        if (displayName && user) {
          await user.updateProfile({ displayName });
        }
        
        showNotification('Account created successfully!', 'success');
        
        // Return user for further handling
        return user;
      } catch (error) {
        console.error('Sign up error:', error);
        let message = 'Sign up failed';
        switch (error.code) {
          case 'auth/email-already-in-use':
            message = 'Email already in use';
            break;
          case 'auth/invalid-email':
            message = 'Invalid email address';
            break;
          case 'auth/weak-password':
            message = 'Password should be at least 6 characters';
            break;
          default:
            message = error.message;
        }
        showNotification(message, 'error');
        throw new Error(message);
      }
    },
    
    // Sign in with email & password
    signIn: async (email, password) => {
      try {
        const auth = firebase.auth();
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        showNotification('Login successful!', 'success');
        return userCredential.user;
      } catch (error) {
        console.error('Sign in error:', error);
        let message = 'Login failed';
        switch (error.code) {
          case 'auth/user-not-found':
            message = 'No account found with this email';
            break;
          case 'auth/wrong-password':
            message = 'Incorrect password';
            break;
          case 'auth/invalid-email':
            message = 'Invalid email address';
            break;
          case 'auth/too-many-requests':
            message = 'Too many failed attempts. Please try again later.';
            break;
          default:
            message = error.message;
        }
        showNotification(message, 'error');
        throw new Error(message);
      }
    },
    
    // Sign out
    signOut: async () => {
      try {
        await firebase.auth().signOut();
        showNotification('Logged out successfully', 'success');
        window.location.href = 'index.html';
      } catch (error) {
        console.error('Sign out error:', error);
        showNotification('Error signing out', 'error');
        throw error;
      }
    },
    
    // Google Sign-In
    signInWithGoogle: async () => {
      try {
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await firebase.auth().signInWithPopup(provider);
        showNotification('Google login successful!', 'success');
        return result.user;
      } catch (error) {
        console.error('Google sign-in error:', error);
        showNotification('Google sign-in failed', 'error');
        throw error;
      }
    },
    
    // Get current user
    getCurrentUser: () => {
      return firebase.auth().currentUser;
    },
    
    // Check if user is logged in
    isLoggedIn: () => {
      return !!firebase.auth().currentUser;
    },
    
    // Get user token
    getUserToken: async (forceRefresh = false) => {
      try {
        const user = firebase.auth().currentUser;
        if (user) {
          return await user.getIdToken(forceRefresh);
        }
        return null;
      } catch (error) {
        console.error('Error getting user token:', error);
        return null;
      }
    },
    
    // Send password reset email
    sendPasswordResetEmail: async (email) => {
      try {
        await firebase.auth().sendPasswordResetEmail(email);
        showNotification('Password reset email sent! Check your inbox.', 'success');
        return true;
      } catch (error) {
        console.error('Password reset error:', error);
        let message = 'Failed to send reset email';
        switch (error.code) {
          case 'auth/user-not-found':
            message = 'No account found with this email';
            break;
          case 'auth/invalid-email':
            message = 'Invalid email address';
            break;
          default:
            message = error.message;
        }
        showNotification(message, 'error');
        throw error;
      }
    },
    
    // Update user profile
    updateUserProfile: async (profileData) => {
      try {
        const user = firebase.auth().currentUser;
        if (!user) throw new Error('No user logged in');
        
        await user.updateProfile(profileData);
        showNotification('Profile updated successfully!', 'success');
        return user;
      } catch (error) {
        console.error('Profile update error:', error);
        showNotification('Failed to update profile', 'error');
        throw error;
      }
    },
    
    // Update user email
    updateUserEmail: async (newEmail) => {
      try {
        const user = firebase.auth().currentUser;
        if (!user) throw new Error('No user logged in');
        
        await user.updateEmail(newEmail);
        showNotification('Email updated successfully!', 'success');
        return user;
      } catch (error) {
        console.error('Email update error:', error);
        let message = 'Failed to update email';
        if (error.code === 'auth/requires-recent-login') {
          message = 'Please log out and log in again before changing your email';
        }
        showNotification(message, 'error');
        throw error;
      }
    },
    
    // Re-authenticate user
    reauthenticate: async (password) => {
      try {
        const user = firebase.auth().currentUser;
        if (!user || !user.email) throw new Error('No user logged in');
        
        const credential = firebase.auth.EmailAuthProvider.credential(
          user.email, 
          password
        );
        
        await user.reauthenticateWithCredential(credential);
        showNotification('Re-authentication successful', 'success');
        return true;
      } catch (error) {
        console.error('Re-authentication error:', error);
        showNotification('Re-authentication failed', 'error');
        throw error;
      }
    },
    
    // Delete user account
    deleteAccount: async () => {
      try {
        const user = firebase.auth().currentUser;
        if (!user) throw new Error('No user logged in');
        
        await user.delete();
        showNotification('Account deleted successfully', 'success');
        window.location.href = 'index.html';
        return true;
      } catch (error) {
        console.error('Account deletion error:', error);
        let message = 'Failed to delete account';
        if (error.code === 'auth/requires-recent-login') {
          message = 'Please re-authenticate before deleting your account';
        }
        showNotification(message, 'error');
        throw error;
      }
    },
    
    // Open auth modal
    openAuthModal: (activeTab = 'login') => {
      openAuthModal(activeTab);
    },
    
    // Close auth modal
    closeAuthModal: () => {
      closeAuthModal();
    }
  };

  // ---------- EVENT LISTENERS FOR UI ELEMENTS ----------
  function setupEventListeners() {
    // Profile image click -> go to account page with uid
    const profileImageNav = document.getElementById('profileImageNav');
    if (profileImageNav) {
      profileImageNav.addEventListener('click', () => {
        const user = firebase.auth().currentUser;
        if (user) {
          window.location.href = `users.html?id=${user.uid}`;
        } else {
          openAuthModal('login');
        }
      });
    }
    
    // Sign Up nav item - open auth modal instead of navigating to account.html
    const signupNavItem = document.getElementById('signup-nav-item');
    if (signupNavItem) {
      const signupLink = signupNavItem.querySelector('a');
      if (signupLink) {
        signupLink.addEventListener('click', (e) => {
          e.preventDefault();
          openAuthModal('login');
        });
      }
    }
    
    // Optional: sign-out button (if exists on page)
    const signOutBtn = document.getElementById('signOutBtn');
    if (signOutBtn) {
      signOutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        await window.RehabAuth.signOut();
      });
    }

    // Listen for custom auth events
    window.addEventListener('authStateChanged', (e) => {
      console.log('Auth state changed:', e.detail);
    });
  }

  // ---------- INITIALISE WHEN DOM READY ----------
  document.addEventListener('DOMContentLoaded', () => {
    // Inject minimal CSS for notifications if not already present
    if (!document.querySelector('#auth-toast-styles')) {
      const style = document.createElement('style');
      style.id = 'auth-toast-styles';
      style.textContent = `
        #notification-container {
          position: fixed;
          top: 80px;
          right: 20px;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          pointer-events: none;
        }
        .notification-toast {
          pointer-events: auto;
          min-width: 250px;
          max-width: 350px;
          box-shadow: 0 6px 16px rgba(0,0,0,0.2);
          font-family: 'Poppins', sans-serif;
          z-index: 10000;
        }
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
    
    initAuth();
    setupAuthModal();  // Set up the auth modal
    setupEventListeners();
  });
})();
