// assets/js/home.js - complete updated file with fixes
(function() {
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
    
    // Static testimonial data - 10 real testimonials
    const staticTestimonials = [
      {
        name: 'Dr. Sarah Johnson',
        role: 'Pediatric Occupational Therapist',
        rating: 5,
        message: 'REHABACE transformed our therapy center completely. The sensory room they designed has become our most valuable asset. Children who were previously struggling to engage now look forward to their sessions.'
      },
      {
        name: 'Michael Adebayo',
        role: 'Clinic Director, Healing Hands Rehab',
        rating: 5,
        message: 'Working with REHABACE was seamless from concept to completion. Their understanding of therapeutic needs combined with aesthetic excellence sets them apart. Our patients and staff absolutely love the new space.'
      },
      {
        name: 'Priya Sharma',
        role: 'Special Education Teacher',
        rating: 5,
        message: 'The calm-down corner REHABACE created for our classroom has reduced behavioral incidents by 60%. The children now have a safe space to regulate their emotions. Thank you for this gift.'
      },
      {
        name: 'Dr. James Okafor',
        role: 'Rehabilitation Specialist',
        rating: 5,
        message: 'I\'ve consulted on therapy center designs for 15 years, and REHABACE is simply the best. Their attention to sensory details, lighting, and accessibility is unmatched in the industry.'
      },
      {
        name: 'Elizabeth Ndlovu',
        role: 'Parent of child with autism',
        rating: 5,
        message: 'The home sensory room REHABACE designed for my son has been life-changing. He\'s more regulated, sleeps better, and his meltdowns have decreased dramatically. Worth every penny.'
      },
      {
        name: 'Dr. Amara Eze',
        role: 'Clinical Psychologist',
        rating: 5,
        message: 'REHABACE doesn\'t just design spaces; they understand the neuroscience behind healing environments. The biophilic elements they incorporated have noticeably improved patient outcomes.'
      },
      {
        name: 'Thomas Wright',
        role: 'Hospital Administrator',
        rating: 5,
        message: 'Our rehabilitation wing renovation by REHABACE came in under budget and ahead of schedule. The feedback from both patients and staff has been overwhelmingly positive.'
      },
      {
        name: 'Linda Mensah',
        role: 'Early Intervention Specialist',
        rating: 5,
        message: 'The sensory integration room at our early childhood center is magical. Babies and toddlers are more alert, engaged, and calm. Parents keep asking what we\'ve changed!'
      },
      {
        name: 'Dr. Robert Chen',
        role: 'Neurorehabilitation Director',
        rating: 5,
        message: 'REHABACE understood exactly what we needed for stroke patients. The accessibility features blend seamlessly with the aesthetic. Our therapy outcomes have improved since the redesign.'
      },
      {
        name: 'Grace Akinyi',
        role: 'School Principal',
        rating: 5,
        message: 'We hired REHABACE to create a multi-sensory room for our special needs unit. The result exceeded all expectations. Every school should have a space like this.'
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

  // ------ FIXED: CACHED DATA FOR DESIGNS AND PRODUCTS ------
  // Check if we have cached data in sessionStorage (with error handling for quota)
  const designContainer = document.getElementById('designScroll');
  const productGrid = document.getElementById('productGrid');
  
  // Try to load from cache first
  loadCachedData();
  
  // Then fetch fresh data in the background
  if (typeof firebase !== 'undefined') {
    setTimeout(() => {
      fetchFreshData();
    }, 100);
  } else {
    // If Firebase not available, show sample data after a delay
    setTimeout(showSampleData, 500);
  }

  function loadCachedData() {
    try {
      // Check sessionStorage for cached designs
      const cachedDesigns = sessionStorage.getItem('rehabace_designs_light'); // Changed key name
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
      const cachedProducts = sessionStorage.getItem('rehabace_products_light'); // Changed key name
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
          sessionStorage.removeItem('rehabace_designs');
          sessionStorage.removeItem('rehabace_products');
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

  function fetchFreshData() {
    if (typeof firebase === 'undefined') {
      console.log('Firebase not available');
      showSampleData();
      return;
    }

    const database = firebase.database();

    // ----- DESIGNS: fetch and cache -----
    if (designContainer) {
      database.ref('designs').once('value', (snapshot) => {
        const designs = [];
        snapshot.forEach(child => {
          designs.push({ 
            id: child.key, 
            ...child.val() 
          });
        });
        
        if (designs.length > 0) {
          // sort by timestamp descending (newest first), take up to 10
          const latest = designs
            .sort((a, b) => {
              const timeA = parseInt(a.timestamp) || 0;
              const timeB = parseInt(b.timestamp) || 0;
              return timeB - timeA;
            })
            .slice(0, 10);
          
          // Save to sessionStorage with error handling
          safeSetCache('rehabace_designs_light', latest);
          
          // Update UI
          renderDesigns(latest);
          console.log('Designs updated from Firebase');
        } else {
          showSampleData();
        }
      }).catch(err => {
        console.log('Error fetching designs:', err);
        showSampleData();
      });
    }

    // ----- PRODUCTS: fetch and cache -----
    if (productGrid) {
      database.ref('products').once('value', (snapshot) => {
        const products = [];
        snapshot.forEach(child => {
          products.push({ 
            id: child.key, 
            ...child.val() 
          });
        });
        
        if (products.length > 0) {
          // sort by time descending (newest first), take up to 4
          const latest = products
            .sort((a, b) => {
              const timeA = parseInt(a.time) || 0;
              const timeB = parseInt(b.time) || 0;
              return timeB - timeA;
            })
            .slice(0, 4);
          
          // Save to sessionStorage with error handling
          safeSetCache('rehabace_products_light', latest);
          
          // Update UI
          renderProducts(latest);
          console.log('Products updated from Firebase');
        } else {
          showSampleData();
        }
      }).catch(err => {
        console.log('Error fetching products:', err);
        showSampleData();
      });
    }
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
      { q: 'What is a sensory room?', a: 'A sensory room is a controlled space designed to stimulate or calm the senses, often used for therapy, relaxation, and development. Our rooms include lighting, textures, and equipment tailored to individual needs.' },
      { q: 'How long does installation take?', a: 'Typical installation takes 2-4 weeks depending on room size and customization level. We work efficiently to minimize disruption to your facility.' },
      { q: 'Do you customize designs?', a: 'Absolutely. We tailor every element to the client\'s specific requirements, space constraints, and therapeutic goals. No two projects are exactly alike.' },
      { q: 'Do you supply equipment nationwide?', a: 'Yes, we ship and install across the country with our logistics partners. We also offer virtual consultations for remote clients.' },
      { q: 'What certifications do you have?', a: 'Our team includes certified occupational therapists, interior designers, and construction experts. All equipment meets international safety standards.' }
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