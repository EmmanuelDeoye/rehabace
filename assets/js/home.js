// assets/js/home.js – Optimised for speed
(function() {
  // ------ ACTIVE NAVIGATION INDICATION ------
  function setActiveNavLink() {
    const navLinks = document.querySelectorAll('.main-nav ul li a');
    const currentPath = window.location.pathname;
    const currentHash = window.location.hash;
    
    // Remove active class from all links
    navLinks.forEach(link => {
      link.classList.remove('active');
      
      const href = link.getAttribute('href');
      
      // Check if this is the home page and link is to home or root
      if ((currentPath.endsWith('index.html') || currentPath === '/' || currentPath.endsWith('/')) && 
          (href === '#hero' || href === 'index.html' || href === './')) {
        link.classList.add('active');
      }
      // Check for hash links on the same page
      else if (currentHash && href === currentHash) {
        link.classList.add('active');
      }
      // Check for exact page matches
      else if (href && !href.startsWith('#') && currentPath.endsWith(href)) {
        link.classList.add('active');
      }
    });
  }

  // Update active nav when scrolling through sections (for one-page sections)
  function updateActiveNavOnScroll() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.main-nav ul li a');
    
    if (sections.length === 0) return;
    
    let currentSection = '';
    const scrollPosition = window.scrollY + 100; // Offset for header
    
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      const sectionId = section.getAttribute('id');
      
      if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
        currentSection = sectionId;
      }
    });
    
    if (currentSection) {
      navLinks.forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href');
        if (href === `#${currentSection}`) {
          link.classList.add('active');
        }
      });
    }
  }

  // Call setActiveNavLink on page load
  document.addEventListener('DOMContentLoaded', setActiveNavLink);

  // Add scroll event listener for one-page navigation
  window.addEventListener('scroll', () => {
    // Only update on pages with hash links (like index.html)
    if (window.location.pathname.endsWith('index.html') || 
        window.location.pathname === '/' || 
        window.location.pathname.endsWith('/')) {
      updateActiveNavOnScroll();
    }
  });

  // ------ THEME TOGGLE (single icon) ------
  const themeToggle = document.getElementById('themeToggle');
  const html = document.documentElement;
  const savedTheme = localStorage.getItem('rehabace_theme') || 'light';
  html.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  themeToggle.addEventListener('click', () => {
    const current = html.getAttribute('data-theme');
    const newTheme = current === 'light' ? 'dark' : 'light';
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('rehabace_theme', newTheme);
    updateThemeIcon(newTheme);
  });

  function updateThemeIcon(theme) {
    const icon = themeToggle.querySelector('i');
    if (icon) {
      icon.className = theme === 'light' ? 'fas fa-sun' : 'fas fa-moon';
    }
  }

  // ------ PREMIUM MOBILE NAVIGATION ------
  const mobileToggle = document.getElementById('mobileToggle');
  const mainNav = document.getElementById('mainNav');
  const navOverlay = document.getElementById('navOverlay');
  const body = document.body;

  // Touch gesture variables
  let touchStartX = 0;
  let touchCurrentX = 0;
  let isDragging = false;
  const threshold = 0.4; // 40% drag to close

  if (mobileToggle && mainNav && navOverlay) {
    // Helper to set CSS variable for item indices
    const navItems = mainNav.querySelectorAll('ul li');
    navItems.forEach((item, index) => {
      item.style.setProperty('--i', index + 1);
    });

    // Open nav function
    const openNav = () => {
      mainNav.classList.add('active');
      navOverlay.classList.add('active');
      body.classList.add('nav-open');
      mobileToggle.classList.add('active');
      const icon = mobileToggle.querySelector('i');
      if (icon) {
        icon.classList.remove('fa-bars');
        icon.classList.add('fa-xmark');
      }
    };

    // Close nav function
    const closeNav = () => {
      mainNav.classList.remove('active');
      navOverlay.classList.remove('active');
      body.classList.remove('nav-open');
      mobileToggle.classList.remove('active');
      const icon = mobileToggle.querySelector('i');
      if (icon) {
        icon.classList.remove('fa-xmark');
        icon.classList.add('fa-bars');
      }
      // Reset any drag transform
      mainNav.style.transform = '';
      mainNav.style.transition = '';
    };

    // Toggle nav on hamburger click
    mobileToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      if (mainNav.classList.contains('active')) {
        closeNav();
      } else {
        openNav();
      }
    });

    // Close nav when clicking overlay
    navOverlay.addEventListener('click', closeNav);

    // Close nav when clicking a link inside
    mainNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeNav);
    });

    // --- SWIPE / DRAG TO CLOSE (GESTURE SUPPORT) ---
    mainNav.addEventListener('touchstart', (e) => {
      if (!mainNav.classList.contains('active')) return;
      touchStartX = e.touches[0].clientX;
      isDragging = true;
      // Temporarily disable transition for smooth drag
      mainNav.style.transition = 'none';
    }, { passive: true });

    mainNav.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      e.preventDefault(); // Prevent scrolling while dragging
      touchCurrentX = e.touches[0].clientX;
      const deltaX = touchCurrentX - touchStartX; // Positive when swiping right

      // Only allow right swipe (to close)
      if (deltaX > 0) {
        mainNav.style.transform = `translateX(${deltaX}px)`;
      }
    }, { passive: false });

    mainNav.addEventListener('touchend', () => {
      if (!isDragging) return;
      isDragging = false;

      const deltaX = (touchCurrentX || touchStartX) - touchStartX;
      const navWidth = mainNav.offsetWidth;
      const dragPercent = deltaX / navWidth;

      // Re-enable transition
      mainNav.style.transition = 'right 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55)';

      if (dragPercent > threshold) {
        // Close nav if dragged past threshold
        closeNav();
      } else {
        // Snap back to open position
        mainNav.style.transform = '';
      }
    }, { passive: true });

    mainNav.addEventListener('touchcancel', () => {
      if (!isDragging) return;
      isDragging = false;
      mainNav.style.transition = 'right 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55)';
      mainNav.style.transform = '';
    });
  }

  // ------ TYPEWRITER ------
  const typewriterSpan = document.getElementById('typewriter');
  if (typewriterSpan) {
    const phrases = [
      'Sensory Rooms',
      'Therapy Centers',
      'Rehab Spaces',
      'Schools',
      'Creche',
      'Hospitals'
    ];
    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    function typeEffect() {
      const current = phrases[phraseIndex];
      if (isDeleting) {
        typewriterSpan.textContent = current.substring(0, charIndex - 1);
        charIndex--;
      } else {
        typewriterSpan.textContent = current.substring(0, charIndex + 1);
        charIndex++;
      }

      if (!isDeleting && charIndex === current.length) {
        isDeleting = true;
        setTimeout(typeEffect, 2000);
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        setTimeout(typeEffect, 300);
      } else {
        setTimeout(typeEffect, isDeleting ? 60 : 100);
      }
    }
    typeEffect();
  }

  // ------ TESTIMONIALS (horizontal scroll - 10 cards) ------
  const testimonialGrid = document.getElementById('testimonialGrid');
  if (testimonialGrid) {
    // Change from grid to scroll container
    testimonialGrid.className = 'testimonial-scroll';
    
    // Static testimonial data - 4 realistic testimonials
const staticTestimonials = [
  {
    name: 'Dr. Amina Bello',
    role: 'Pediatric Occupational Therapist',
    rating: 5,
    message: 'REHABACE helped us transform a regular therapy room into a functional sensory integration space. The layout, lighting, and equipment placement made a huge difference in how our children engage during sessions.'
  },
  {
    name: 'Mr. Samuel Kehinde',
    role: 'Clinic Manager, TolexarsTherapyServices',
    rating: 4,
    message: 'From consultation to execution, the REHABACE team understood exactly what a therapy environment should feel like. Our staff now work more efficiently and our clients always comment on how calming the space is.'
  },
  {
    name: 'Mrs. Chidinma Okeke',
    role: 'Parent of a Child with Autism',
    rating: 5,
    message: 'The sensory corner designed for our home has helped my son regulate better. He now has a safe space where he can calm down and focus. We are very grateful for the thoughtful design.'
  },
  {
    name: 'Dr. Ibrahim Lawal',
    role: 'Physiotherapist',
    rating: 4,
    message: 'REHABACE combines therapy knowledge with practical design. The therapy room they helped us structure improved patient flow and made sessions more productive for both therapists and clients.'
  }
];
    
    let html = '';
    staticTestimonials.forEach(t => {
      // Generate star rating
      let stars = '';
      for (let i = 0; i < 5; i++) {
        stars += `<i class="fa${i < t.rating ? 's' : 'r'} fa-star"></i>`;
      }
      
      html += `<div class="testimonial-card-scroll">
        <div class="stars">${stars}</div>
        <p class="testimonial-message">“${t.message}”</p>
        <div class="testimonial-name">
          ${t.name}
          <span>${t.role}</span>
        </div>
      </div>`;
    });
    
    testimonialGrid.innerHTML = html;

    // Add drag-to-scroll functionality
    let isDown = false;
    let startX;
    let scrollLeft;

    testimonialGrid.addEventListener('mousedown', (e) => {
      isDown = true;
      testimonialGrid.classList.add('active');
      startX = e.pageX - testimonialGrid.offsetLeft;
      scrollLeft = testimonialGrid.scrollLeft;
    });

    testimonialGrid.addEventListener('mouseleave', () => {
      isDown = false;
      testimonialGrid.classList.remove('active');
    });

    testimonialGrid.addEventListener('mouseup', () => {
      isDown = false;
      testimonialGrid.classList.remove('active');
    });

    testimonialGrid.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - testimonialGrid.offsetLeft;
      const walk = (x - startX) * 2; // Scroll speed multiplier
      testimonialGrid.scrollLeft = scrollLeft - walk;
    });

    // Add scroll indicators
    const indicatorsContainer = document.createElement('div');
    indicatorsContainer.className = 'scroll-indicators';
    
    for (let i = 0; i < Math.min(staticTestimonials.length, 7); i++) {
      const dot = document.createElement('span');
      dot.className = 'scroll-dot';
      dot.addEventListener('click', () => {
        const cardWidth = testimonialGrid.querySelector('.testimonial-card-scroll').offsetWidth + 20; // width + gap
        testimonialGrid.scrollTo({
          left: cardWidth * i,
          behavior: 'smooth'
        });
      });
      indicatorsContainer.appendChild(dot);
    }
    
    // Add indicators after the scroll container
    testimonialGrid.parentNode.appendChild(indicatorsContainer);
    
    // Update active dot on scroll
    testimonialGrid.addEventListener('scroll', () => {
      const scrollPosition = testimonialGrid.scrollLeft;
      const firstCard = testimonialGrid.querySelector('.testimonial-card-scroll');
      if (!firstCard) return;
      
      const cardWidth = firstCard.offsetWidth + 20;
      const activeIndex = Math.round(scrollPosition / cardWidth);
      
      document.querySelectorAll('.scroll-dot').forEach((dot, index) => {
        if (index === activeIndex) {
          dot.classList.add('active');
        } else {
          dot.classList.remove('active');
        }
      });
    });

    // Set first dot active
    setTimeout(() => {
      const firstDot = document.querySelector('.scroll-dot');
      if (firstDot) firstDot.classList.add('active');
    }, 100);
  }

  // Function to fetch Firebase testimonials (optional background update)
  function fetchFirebaseTestimonials() {
    if (typeof firebase === 'undefined') {
      console.log('Firebase not available for testimonials');
      return;
    }

    try {
      const database = firebase.database();
      database.ref('testimony').once('value', (snapshot) => {
        const testimonials = [];
        snapshot.forEach(child => {
          testimonials.push({ 
            id: child.key, 
            ...child.val() 
          });
        });
        
        if (testimonials.length > 0) {
          console.log('Firebase testimonials available:', testimonials.length);
          // Optionally update with Firebase data if you want
          // For now, we'll keep static ones since they're more complete
        }
      }).catch(err => console.log('No Firebase testimonials'));
    } catch (e) {
      console.log('Firebase testimonials fetch skipped');
    }
  }

  // ------ OPTIMISED: CACHED DATA FOR DESIGNS AND PRODUCTS ------
  const designContainer = document.getElementById('designScroll');
  const productGrid = document.getElementById('productGrid');
  
  // Try to load from cache first (instant display)
  loadCachedData();
  
  // Then fetch fresh data in the background using optimised queries
  if (typeof firebase !== 'undefined') {
    setTimeout(() => {
      fetchFreshDataOptimised();
    }, 100);
  } else {
    // If Firebase not available, show sample data after a delay
    setTimeout(showSampleData, 500);
  }

  function loadCachedData() {
    try {
      // Check sessionStorage for cached designs
      const cachedDesigns = sessionStorage.getItem('rehabace_designs_light');
      if (cachedDesigns && designContainer) {
        try {
          const designs = JSON.parse(cachedDesigns);
          if (designs && designs.length > 0) {
            renderDesigns(designs);
            console.log('Loaded designs from cache');
          }
        } catch (e) {
          console.log('Cache parse error for designs');
        }
      }

      // Check sessionStorage for cached products
      const cachedProducts = sessionStorage.getItem('rehabace_products_light');
      if (cachedProducts && productGrid) {
        try {
          const products = JSON.parse(cachedProducts);
          if (products && products.length > 0) {
            renderProducts(products);
            console.log('Loaded products from cache');
          }
        } catch (e) {
          console.log('Cache parse error for products');
        }
      }
    } catch (e) {
      console.log('Cache access error:', e);
    }
  }

  // Helper function to render designs (minimal data)
  function renderDesigns(designs) {
    if (!designContainer) return;
    
    let html = '';
    designs.forEach(d => {
      // Use a placeholder if image is too large or missing
      const imgUrl = d.imageUrl || d.img || 'https://via.placeholder.com/300x200?text=Healing+Space';
      const pushId = d.id || d.push || 'sample';
      
      // Ensure URL is not too long (truncate if needed)
      const safeImgUrl = imgUrl.length > 500 ? 'https://via.placeholder.com/300x200?text=Image' : imgUrl;
      
      html += `<a href="design-details.html?id=${encodeURIComponent(pushId)}" class="design-card-link">
        <div class="design-card">
          <img src="${safeImgUrl}" alt="${d.title || 'Design'}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x200?text=Image+Not+Found'">
        </div>
      </a>`;
    });
    
    designContainer.innerHTML = html;
  }

  // Helper function to render products (minimal data)
  function renderProducts(products) {
    if (!productGrid) return;
    
    let html = '';
    products.forEach(p => {
      const imgUrl = p.img || p.imageUrl || 'https://via.placeholder.com/300?text=' + encodeURIComponent(p.title || 'Product');
      const pushId = p.push || p.id;
      const title = p.title || 'Unnamed Product';
      const price = p.price || 'Price on request';
      
      // Ensure URL is not too long
      const safeImgUrl = imgUrl.length > 500 ? 'https://via.placeholder.com/300?text=Product' : imgUrl;
      
      html += `<a href="display.html?push=${encodeURIComponent(pushId)}" class="product-card">
        <img src="${safeImgUrl}" alt="${title}" loading="lazy" onerror="this.src='https://via.placeholder.com/300?text=No+Image'">
        <div class="product-info">
          <div class="product-title">${title}</div>
          <div class="product-price">${price}</div>
        </div>
      </a>`;
    });
    
    productGrid.innerHTML = html;
  }

  // Safe cache function with error handling and size limits
  function safeSetCache(key, data, maxSize = 200 * 1024) { // 200KB limit per key
    try {
      // Create a lightweight version of the data
      const lightData = data.map(item => {
        // Only keep essential fields, truncate long URLs
        const lightItem = {
          id: item.id || item.push || '',
          title: item.title || '',
          // Use a placeholder if image is too long
          imageUrl: item.imageUrl && item.imageUrl.length < 300 ? item.imageUrl : 
                   (item.img && item.img.length < 300 ? item.img : 'https://via.placeholder.com/300x200')
        };
        
        // Add price for products
        if (item.price) lightItem.price = item.price;
        if (item.push) lightItem.push = item.push;
        
        return lightItem;
      });
      
      const jsonString = JSON.stringify(lightData);
      
      // Check size before storing
      if (jsonString.length > maxSize) {
        console.log(`Data too large for cache (${jsonString.length} bytes), skipping`);
        return false;
      }
      
      sessionStorage.setItem(key, jsonString);
      return true;
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        console.log('Storage quota exceeded, clearing old cache and retrying...');
        // Clear old items and try again
        try {
          sessionStorage.removeItem('rehabace_designs_light');
          sessionStorage.removeItem('rehabace_products_light');
          sessionStorage.removeItem(key);
          // Try one more time with minimal data
          const minimalData = data.slice(0, 4).map(item => ({
            id: item.id || item.push || '',
            title: (item.title || '').substring(0, 30),
            imageUrl: 'https://via.placeholder.com/300x200'
          }));
          sessionStorage.setItem(key, JSON.stringify(minimalData));
        } catch (retryError) {
          console.log('Still unable to cache data');
        }
      }
      return false;
    }
  }

  // OPTIMISED: Fetch only latest 10 designs and 4 products using Firebase queries
  function fetchFreshDataOptimised() {
    if (typeof firebase === 'undefined') {
      console.log('Firebase not available');
      showSampleData();
      return;
    }

    const database = firebase.database();
    const promises = [];

    // ----- DESIGNS: fetch latest 10 using timestamp -----
    if (designContainer) {
      promises.push(
        database.ref('designs')
          .orderByChild('timestamp')  // ensure you have an index on 'timestamp'
          .limitToLast(7)
          .once('value')
          .then(snapshot => {
            const designs = [];
            snapshot.forEach(child => {
              designs.push({ 
                id: child.key, 
                ...child.val() 
              });
            });
            
            if (designs.length > 0) {
              // Firebase returns in ascending order, so reverse to get newest first
              const latest = designs.reverse();
              
              // Save to sessionStorage with error handling
              safeSetCache('rehabace_designs_light', latest);
              
              // Update UI
              renderDesigns(latest);
              console.log('Designs updated from Firebase (optimised)');
            } else {
              // No designs, fallback to samples
              if (designContainer.children.length === 0) showSampleData();
            }
          })
          .catch(err => {
            console.log('Error fetching designs:', err);
            if (designContainer.children.length === 0) showSampleData();
          })
      );
    }

    // ----- PRODUCTS: fetch latest 4 using time -----
    if (productGrid) {
      promises.push(
        database.ref('products')
          .orderByChild('time')  // ensure you have an index on 'time'
          .limitToLast(4)
          .once('value')
          .then(snapshot => {
            const products = [];
            snapshot.forEach(child => {
              products.push({ 
                id: child.key, 
                ...child.val() 
              });
            });
            
            if (products.length > 0) {
              const latest = products.reverse(); // newest first
              
              // Save to sessionStorage with error handling
              safeSetCache('rehabace_products_light', latest);
              
              // Update UI
              renderProducts(latest);
              console.log('Products updated from Firebase (optimised)');
            } else {
              if (productGrid.children.length === 0) showSampleData();
            }
          })
          .catch(err => {
            console.log('Error fetching products:', err);
            if (productGrid.children.length === 0) showSampleData();
          })
      );
    }

    // If both promises fail or take too long, fallback after a timeout
    Promise.all(promises).catch(() => {
      // If after 5 seconds no data has been rendered, show samples
      setTimeout(() => {
        if ((designContainer && designContainer.children.length === 0) ||
            (productGrid && productGrid.children.length === 0)) {
          showSampleData();
        }
      }, 5000);
    });
  }

  function showSampleData() {
    // Show sample designs if no cache and no Firebase
    if (designContainer && designContainer.children.length === 0) {
      const sampleDesigns = [
        { imageUrl: 'https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?w=300&h=200&fit=crop', title: 'Sensory Room 1', id: 'sample1' },
        { imageUrl: 'https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?w=300&h=200&fit=crop&bw=1', title: 'Sensory Room 2', id: 'sample2' },
        { imageUrl: 'https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?w=300&h=200&fit=crop&sat=-100', title: 'Sensory Room 3', id: 'sample3' },
        { imageUrl: 'https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?w=300&h=200&fit=crop&blur=50', title: 'Sensory Room 4', id: 'sample4' }
      ];
      
      renderDesigns(sampleDesigns);
      
      // Cache sample designs with error handling
      safeSetCache('rehabace_designs_light', sampleDesigns);
    }
    
    if (productGrid && productGrid.children.length === 0) {
      const sampleProducts = [
        { title: 'Sensory Brush', price: '18,000 NGN', img: 'https://via.placeholder.com/300?text=Sensory+Brush', id: 'sample1', push: 'sample1' },
        { title: '2kg Sand Bags', price: '21,500 NGN', img: 'https://via.placeholder.com/300?text=Sand+Bags', id: 'sample2', push: 'sample2' },
        { title: 'Weighted Blanket', price: '25,000 NGN', img: 'https://via.placeholder.com/300?text=Weighted+Blanket', id: 'sample3', push: 'sample3' },
        { title: 'Balance Board', price: '12,500 NGN', img: 'https://via.placeholder.com/300?text=Balance+Board', id: 'sample4', push: 'sample4' }
      ];
      
      renderProducts(sampleProducts);
      
      // Cache sample products with error handling
      safeSetCache('rehabace_products_light', sampleProducts);
    }
  }

  // ----- FAQ ACCORDION -----
  const faqList = document.getElementById('faqList');
if (faqList) {
  const faqData = [
    { 
      q: 'What is a sensory room?', 
      a: 'A sensory room is a specially designed environment that helps regulate sensory input. It can stimulate or calm the senses using lighting, textures, movement equipment, and interactive elements. These rooms are commonly used for children with autism, developmental delays, and individuals who benefit from sensory regulation during therapy.' 
    },

    { 
      q: 'Who can benefit from a sensory room?', 
      a: 'Sensory rooms are beneficial for children and adults with autism, ADHD, sensory processing difficulties, developmental delays, neurological conditions, and emotional regulation challenges. They are widely used in therapy clinics, schools, hospitals, and even private homes.' 
    },

    { 
      q: 'Can you design a sensory room in a small space?', 
      a: 'Yes. Many effective sensory spaces are created in compact rooms, classrooms, or even corners. Our team designs layouts that maximize available space while ensuring the environment remains functional, safe, and therapeutic.' 
    },

    { 
      q: 'How long does installation take?', 
      a: 'Most projects take between 2–4 weeks depending on the size of the room and level of customization. We handle everything from design to installation so that your facility can start using the space as soon as possible.' 
    },

    { 
      q: 'Do you customize designs?', 
      a: 'Absolutely. Every project is tailored to the client’s needs. We consider the purpose of the room, the type of users, available space, and therapeutic goals to create a solution that works specifically for you.' 
    },

    { 
      q: 'Do you supply therapy and sensory equipment?', 
      a: 'Yes. In addition to designing therapy spaces, we supply a range of sensory and rehabilitation equipment such as swings, tactile panels, therapy furniture, calming lights, and sensory integration tools.' 
    },

    { 
      q: 'Can you help set up therapy rooms for new clinics?', 
      a: 'Yes. We work with new therapy centers, rehabilitation clinics, and special education schools to design complete therapy environments including sensory rooms, treatment areas, and functional layouts that support therapists and clients.' 
    },

    { 
      q: 'Do you work with schools and special education centers?', 
      a: 'Yes. Many of our projects involve schools that want to create sensory-friendly classrooms, calm-down corners, or multi-sensory rooms that support students with diverse learning and developmental needs.' 
    },

    { 
      q: 'Do you offer consultation before starting a project?', 
      a: 'Yes. We start with a consultation to understand your goals, available space, and budget. This allows us to recommend practical solutions and create a design that delivers real therapeutic value.' 
    },

    { 
      q: 'Do you handle projects outside Lagos?', 
      a: 'Yes, we work with clients across Nigeria. Depending on the project, we provide remote consultation, equipment delivery, or full installation through our logistics and technical partners.' 
    },

    { 
      q: 'How much does it cost to set up a sensory room?', 
      a: 'The cost depends on the size of the space, the equipment required, and the level of customization. We offer flexible options to suit different budgets, and we can recommend a setup that provides the most value for your investment.' 
    },

    { 
      q: 'How do I get started?', 
      a: 'The easiest way is to contact our team for a consultation. We will discuss your goals, review your available space, and guide you through the best options to create a therapy environment that works for your needs.' 
    }
  ];

    
    let html = '';
    faqData.forEach((item) => {
      html += `<div class="faq-item">
        <div class="faq-question">
          ${item.q} <i class="fas fa-chevron-down"></i>
        </div>
        <div class="faq-answer">${item.a}</div>
      </div>`;
    });
    
    faqList.innerHTML = html;

    // Add accordion functionality
    document.querySelectorAll('.faq-question').forEach(question => {
      question.addEventListener('click', function() {
        const item = this.closest('.faq-item');
        item.classList.toggle('open');
      });
    });
  }

  // Try to fetch Firebase testimonials in background (don't wait for it)
  setTimeout(() => {
    fetchFirebaseTestimonials();
  }, 3000);
})();


// Add this anywhere in your home.js file (maybe at the end)
// Optional: Blur-up image loading effect
document.querySelectorAll('img[loading="lazy"]').forEach(img => {
  img.classList.add('lazy-blur');
  img.addEventListener('load', function() {
    this.classList.add('loaded');
  });
});
