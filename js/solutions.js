// ===== SOLUTION SCENE ANIMATIONS =====

(function () {
  // Chat demo animation
  const chatMsgs = document.querySelectorAll('#chatDemoMessages .chat-msg');
  if (chatMsgs.length) {
    const chatObserver = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) {
        chatMsgs.forEach(function (msg) {
          const delay = parseInt(msg.dataset.delay) || 0;
          setTimeout(function () { msg.classList.add('visible'); }, delay);
        });
        chatObserver.unobserve(entries[0].target);
      }
    }, { threshold: 0.3 });
    chatObserver.observe(document.getElementById('chatDemo'));
  }

  // Workflow demo animation
  const workflowNodes = document.querySelectorAll('#workflowDemo .workflow-node');
  const workflowConnectors = document.querySelectorAll('#workflowDemo .workflow-connector');
  if (workflowNodes.length) {
    const wfObserver = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) {
        workflowNodes.forEach(function (node, i) {
          const delay = parseInt(node.dataset.delay) || 0;
          setTimeout(function () {
            node.classList.add('visible');
            node.classList.add('active');
            if (workflowConnectors[i]) {
              setTimeout(function () {
                workflowConnectors[i].classList.add('active');
              }, 200);
            }
          }, delay);
        });
        wfObserver.unobserve(entries[0].target);
      }
    }, { threshold: 0.3 });
    wfObserver.observe(document.getElementById('workflowDemo'));
  }

  // SEO gauges animation
  const seoDemo = document.getElementById('seoDemo');
  if (seoDemo) {
    const gauges = seoDemo.querySelectorAll('.mini-gauge');
    const seoObserver = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) {
        gauges.forEach(function (gauge) {
          const score = parseInt(gauge.dataset.score);
          const circumference = 2 * Math.PI * 42;
          const offset = circumference - (score / 100) * circumference;
          const fill = gauge.querySelector('.fill');
          fill.style.strokeDasharray = circumference;
          fill.style.strokeDashoffset = circumference;
          setTimeout(function () {
            fill.style.strokeDashoffset = offset;
          }, 100);
        });
        seoObserver.unobserve(entries[0].target);
      }
    }, { threshold: 0.3 });
    seoObserver.observe(seoDemo);
  }

  // Design mockup slideshow
  const designDemo = document.getElementById('designDemo');
  if (designDemo) {
    const slides = designDemo.querySelectorAll('.design-slide');
    let currentSlide = 0;
    setInterval(function () {
      slides[currentSlide].classList.remove('active');
      currentSlide = (currentSlide + 1) % slides.length;
      slides[currentSlide].classList.add('active');
    }, 3000);
  }
})();
