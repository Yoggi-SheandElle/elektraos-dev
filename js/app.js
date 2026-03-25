// ===== MAIN APP ORCHESTRATOR =====

(function () {
  // ===== NAV SCROLL EFFECT =====
  const nav = document.getElementById('nav');
  const hamburger = document.getElementById('navHamburger');
  const navLinks = document.getElementById('navLinks');

  window.addEventListener('scroll', throttle(function () {
    if (window.scrollY > 60) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }, 100));

  // Hamburger toggle
  if (hamburger) {
    hamburger.addEventListener('click', function () {
      var isOpen = navLinks.classList.toggle('open');
      hamburger.classList.toggle('active', isOpen);
      // Prevent body scroll when menu is open
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close on link click (but not dropdown triggers)
    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function (e) {
        // If this is a dropdown trigger on mobile, toggle the dropdown
        if (link.classList.contains('nav-dropdown-trigger') && window.innerWidth <= 768) {
          e.preventDefault();
          link.classList.toggle('dd-open');
          var dropdown = link.parentElement.querySelector('.nav-dropdown');
          if (dropdown) dropdown.classList.toggle('mobile-open');
          return;
        }
        navLinks.classList.remove('open');
        hamburger.classList.remove('active');
        document.body.style.overflow = '';
      });
    });

    // Close menu on outside click
    document.addEventListener('click', function (e) {
      if (navLinks.classList.contains('open') && !nav.contains(e.target)) {
        navLinks.classList.remove('open');
        hamburger.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }

  // ===== ACTIVE NAV LINK =====
  const sections = document.querySelectorAll('section[id]');
  const navLinksAll = document.querySelectorAll('.nav-links a');

  const navObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinksAll.forEach(function (link) {
          link.classList.remove('active');
          if (link.getAttribute('href') === '#' + id) {
            link.classList.add('active');
          }
        });
      }
    });
  }, { threshold: 0.3, rootMargin: '-80px 0px 0px 0px' });

  sections.forEach(function (section) { navObserver.observe(section); });

  // ===== SCROLL REVEAL =====
  const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');

  const revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  revealElements.forEach(function (el) { revealObserver.observe(el); });

  // ===== SMOOTH SCROLL =====
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ===== PIPELINE ANIMATION =====
  const pipeline = document.getElementById('pipeline');
  if (pipeline) {
    const pipelineObserver = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) {
        const icons = pipeline.querySelectorAll('.pipeline-icon');
        const arrows = pipeline.querySelectorAll('.pipeline-arrow');
        icons.forEach(function (icon, i) {
          setTimeout(function () {
            icon.classList.add('active');
            if (arrows[i]) {
              setTimeout(function () { arrows[i].classList.add('active'); }, 300);
            }
          }, i * 600);
        });
        pipelineObserver.unobserve(pipeline);
      }
    }, { threshold: 0.4 });
    pipelineObserver.observe(pipeline);
  }

  // ===== HERO SCROLL FADE =====
  const heroScroll = document.querySelector('.hero-scroll');
  if (heroScroll) {
    window.addEventListener('scroll', throttle(function () {
      heroScroll.style.opacity = Math.max(0, 1 - window.scrollY / 300);
    }, 50));
  }
})();
