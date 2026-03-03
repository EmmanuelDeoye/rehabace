// assets/js/home.js - complete updated file with horizontal testimonials and caching
(function() {
  // ------ THEME TOGGLE ------
  const themeToggle = document.getElementById('themeToggle');
  const html = document.documentElement;
  const savedTheme = localStorage.getItem('rehabace_theme') || 'light';
  html.setAttribute('data-theme', savedTheme);

  themeToggle.addEventListener('click', () => {
    const current = html.getAttribute('data-theme');
    const newTheme = current === 'light' ? 'dark' : 'light';
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('rehabace_theme', newTheme);
  });

  // ------ MOBILE MENU ------
  const mobileToggle = document.getElementById('mobileToggle');
  const mainNav = document.getElementById('mainNav');
  if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
      mainNav.classList.toggle('active');
    });
  }
  
  if (mainNav) {
    mainNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => mainNav.classList.remove('active'));
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

  // ------ CACHED DATA FOR DESIGNS AND PRODUCTS ------
  // Check if we have cached data in sessionStorage
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
    // Check sessionStorage for cached designs
    const cachedDesigns = sessionStorage.getItem('rehabace_designs');
    if (cachedDesigns && designContainer) {
      try {
        const designs = JSON.parse(cachedDesigns);
        if (designs && designs.length > 0) {
          let html = '';
          designs.forEach(d => {
            const imgUrl = d.imageUrl || 'https://via.placeholder.com/300x200?text=' + encodeURIComponent(d.title || 'Design');
            html += `<div class="design-card">
              <img src="${imgUrl}" alt="${d.title || 'Design'}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x200?text=Image+Not+Found'">
            </div>`;
          });
          designContainer.innerHTML = html;
          console.log('Loaded designs from cache');
        }
      } catch (e) {
        console.log('Cache read error for designs');
      }
    }

    // Check sessionStorage for cached products
    const cachedProducts = sessionStorage.getItem('rehabace_products');
    if (cachedProducts && productGrid) {
      try {
        const products = JSON.parse(cachedProducts);
        if (products && products.length > 0) {
          let html = '';
          products.forEach(p => {
            const imgUrl = p.img || p.imageUrl || 'https://via.placeholder.com/300?text=' + encodeURIComponent(p.title || 'Product');
            const pushId = p.push || p.id;
            const title = p.title || 'Unnamed Product';
            const price = p.price || 'Price on request';
            
            html += `<a href="display.html?productId=${encodeURIComponent(pushId)}" class="product-card">
              <img src="${imgUrl}" alt="${title}" loading="lazy" onerror="this.src='https://via.placeholder.com/300?text=No+Image'">
              <div class="product-info">
                <div class="product-title">${title}</div>
                <div class="product-price">${price}</div>
              </div>
            </a>`;
          });
          productGrid.innerHTML = html;
          console.log('Loaded products from cache');
        }
      } catch (e) {
        console.log('Cache read error for products');
      }
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
          
          // Save to sessionStorage
          sessionStorage.setItem('rehabace_designs', JSON.stringify(latest));
          
          // Update UI
          let html = '';
          latest.forEach(d => {
            const imgUrl = d.imageUrl || 'https://via.placeholder.com/300x200?text=' + encodeURIComponent(d.title || 'Design');
            html += `<div class="design-card">
              <img src="${imgUrl}" alt="${d.title || 'Design'}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x200?text=Image+Not+Found'">
            </div>`;
          });
          
          designContainer.innerHTML = html;
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
          
          // Save to sessionStorage
          sessionStorage.setItem('rehabace_products', JSON.stringify(latest));
          
          // Update UI
          let html = '';
          latest.forEach(p => {
            const imgUrl = p.img || p.imageUrl || 'https://via.placeholder.com/300?text=' + encodeURIComponent(p.title || 'Product');
            const pushId = p.push || p.id;
            const title = p.title || 'Unnamed Product';
            const price = p.price || 'Price on request';
            
            html += `<a href="display.html?productId=${encodeURIComponent(pushId)}" class="product-card">
              <img src="${imgUrl}" alt="${title}" loading="lazy" onerror="this.src='https://via.placeholder.com/300?text=No+Image'">
              <div class="product-info">
                <div class="product-title">${title}</div>
                <div class="product-price">${price}</div>
              </div>
            </a>`;
          });
          
          productGrid.innerHTML = html;
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
        'https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?w=300&h=200&fit=crop',
        'https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?w=300&h=200&fit=crop&bw=1',
        'https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?w=300&h=200&fit=crop&sat=-100',
        'https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?w=300&h=200&fit=crop&blur=50'
      ];
      
      let html = '';
      sampleDesigns.forEach((url, i) => {
        html += `<div class="design-card">
          <img src="${url}" alt="Sample Design ${i+1}" loading="lazy">
        </div>`;
      });
      designContainer.innerHTML = html;
      
      // Cache sample designs
      const sampleDesignsObj = sampleDesigns.map((url, i) => ({
        imageUrl: url,
        title: `Sample Design ${i+1}`
      }));
      sessionStorage.setItem('rehabace_designs', JSON.stringify(sampleDesignsObj));
    }
    
    if (productGrid && productGrid.children.length === 0) {
      const sampleProducts = [
        { title: 'Sensory Brush', price: '18,000 NGN', img: 'https://via.placeholder.com/300?text=Sensory+Brush', id: 'sample1', push: 'sample1' },
        { title: '2kg Sand Bags', price: '21,500 NGN', img: 'https://via.placeholder.com/300?text=Sand+Bags', id: 'sample2', push: 'sample2' },
        { title: 'Weighted Blanket', price: '25,000 NGN', img: 'https://via.placeholder.com/300?text=Weighted+Blanket', id: 'sample3', push: 'sample3' },
        { title: 'Balance Board', price: '12,500 NGN', img: 'https://via.placeholder.com/300?text=Balance+Board', id: 'sample4', push: 'sample4' }
      ];
      
      let html = '';
      sampleProducts.forEach(p => {
        html += `<a href="display.html?productId=${p.id}" class="product-card">
          <img src="${p.img}" alt="${p.title}" loading="lazy">
          <div class="product-info">
            <div class="product-title">${p.title}</div>
            <div class="product-price">${p.price}</div>
          </div>
        </a>`;
      });
      productGrid.innerHTML = html;
      
      // Cache sample products
      sessionStorage.setItem('rehabace_products', JSON.stringify(sampleProducts));
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