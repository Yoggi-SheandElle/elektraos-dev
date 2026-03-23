// ===== HERO PARTICLE GRID =====

(function () {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let mouse = { x: -1000, y: -1000 };
  let dots = [];
  let animId;
  let isVisible = true;
  const SPACING = 35;
  const BASE_OPACITY = 0.12;
  const HOVER_RADIUS = 160;
  const DOT_SIZE = 1.5;

  function resize() {
    canvas.width = canvas.offsetWidth * (window.devicePixelRatio || 1);
    canvas.height = canvas.offsetHeight * (window.devicePixelRatio || 1);
    ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    createDots();
  }

  function createDots() {
    dots = [];
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    for (let x = SPACING; x < w; x += SPACING) {
      for (let y = SPACING; y < h; y += SPACING) {
        dots.push({ x, y });
      }
    }
  }

  function draw() {
    if (!isVisible) { animId = requestAnimationFrame(draw); return; }
    ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

    for (const dot of dots) {
      const dx = mouse.x - dot.x;
      const dy = mouse.y - dot.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const proximity = Math.max(0, 1 - dist / HOVER_RADIUS);

      const opacity = BASE_OPACITY + proximity * 0.7;
      const size = DOT_SIZE + proximity * 2;

      if (proximity > 0.1) {
        // Blend from purple to cyan on proximity
        const r = 124 + (0 - 124) * proximity * 0.5;
        const g = 58 + (212 - 58) * proximity * 0.5;
        const b = 237 + (255 - 237) * proximity * 0.5;
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
      } else {
        ctx.fillStyle = `rgba(0, 212, 255, ${opacity * 0.6})`;
      }

      ctx.beginPath();
      ctx.arc(dot.x, dot.y, size, 0, Math.PI * 2);
      ctx.fill();

      // Draw connection lines between nearby hovered dots
      if (proximity > 0.3) {
        for (const other of dots) {
          const odx = dot.x - other.x;
          const ody = dot.y - other.y;
          const odist = Math.sqrt(odx * odx + ody * ody);
          if (odist > 0 && odist < SPACING * 1.5) {
            const omx = mouse.x - other.x;
            const omy = mouse.y - other.y;
            const omdist = Math.sqrt(omx * omx + omy * omy);
            const oprox = Math.max(0, 1 - omdist / HOVER_RADIUS);
            if (oprox > 0.3) {
              ctx.strokeStyle = `rgba(0, 212, 255, ${proximity * oprox * 0.25})`;
              ctx.lineWidth = 0.5;
              ctx.beginPath();
              ctx.moveTo(dot.x, dot.y);
              ctx.lineTo(other.x, other.y);
              ctx.stroke();
            }
          }
        }
      }
    }

    animId = requestAnimationFrame(draw);
  }

  canvas.addEventListener('mousemove', throttle(function (e) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  }, 16));

  canvas.addEventListener('mouseleave', function () {
    mouse.x = -1000;
    mouse.y = -1000;
  });

  // Pause when not visible
  const observer = new IntersectionObserver(function (entries) {
    isVisible = entries[0].isIntersecting;
  }, { threshold: 0.1 });
  observer.observe(canvas);

  window.addEventListener('resize', debounce(resize, 200));
  resize();
  draw();
})();
