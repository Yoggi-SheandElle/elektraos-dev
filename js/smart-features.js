/* ===================================================================
   ElektraOS.dev - Smart Features
   1. Live System Pulse
   2. Interactive Solution Configurator
   3. Command Palette
   4. Ambient Time-Based Mode
   5. Case Study Timeline
   6. Live Terminal Stats
   =================================================================== */
'use strict';

// ===== 1. LIVE SYSTEM PULSE =====
(function initPulse() {
  var el = document.getElementById('systemPulse');
  if (!el) return;

  var agents = 41, endpoints = 624, workflows = 31;
  var tasks = ['Content pipeline sync', 'Agent health check', 'Vault index update', 'Thumbnail generation',
    'SEO audit cycle', 'Lead scoring update', 'Email digest compiled', 'Workflow optimization',
    'API cache refresh', 'Model response cached', 'Schedule rebalanced', 'Knowledge graph updated'];

  function update() {
    var mins = Math.floor(Math.random() * 12) + 1;
    var task = tasks[Math.floor(Math.random() * tasks.length)];
    var statusEl = document.getElementById('pulseStatus');
    var taskEl = document.getElementById('pulseTask');
    if (statusEl) statusEl.innerHTML = '<span style="color:var(--green);">' + agents + '</span> agents · <span style="color:var(--cyan);">' + endpoints + '</span> endpoints · <span style="color:var(--purple);">' + workflows + '</span> workflows';
    if (taskEl) {
      taskEl.style.opacity = '0';
      setTimeout(function() {
        taskEl.textContent = task + ' · ' + mins + 'm ago';
        taskEl.style.opacity = '1';
      }, 300);
    }
  }

  update();
  setInterval(update, 8000);

  // Pulse dot animation
  var dot = document.getElementById('pulseDot');
  if (dot) setInterval(function() {
    dot.style.opacity = '1';
    setTimeout(function() { dot.style.opacity = '0.3'; }, 500);
  }, 2000);
})();


// ===== 2. INTERACTIVE SOLUTION CONFIGURATOR =====
(function initConfigurator() {
  var cards = document.querySelectorAll('.solution-card[data-demo]');
  if (!cards.length) return;

  var demoArea = document.getElementById('solutionDemo');
  if (!demoArea) return;

  var demos = {
    chatbot: {
      title: 'AI Chatbot',
      html: '<div class="demo-chat"><div class="demo-msg bot">How can I help you today?</div><div class="demo-msg user">What services do you offer?</div><div class="demo-msg bot"><span class="demo-typing"><span></span><span></span><span></span></span></div></div>'
    },
    automation: {
      title: 'Workflow Orchestration',
      html: '<div class="demo-flow"><div class="demo-node active">Trigger</div><svg class="demo-arrow" viewBox="0 0 40 20"><path d="M0 10 L30 10 M25 5 L30 10 L25 15" stroke="var(--purple)" fill="none" stroke-width="1.5"/></svg><div class="demo-node">Process</div><svg class="demo-arrow" viewBox="0 0 40 20"><path d="M0 10 L30 10 M25 5 L30 10 L25 15" stroke="var(--purple)" fill="none" stroke-width="1.5"/></svg><div class="demo-node">Output</div></div>'
    },
    seo: {
      title: 'Performance Metrics',
      html: '<div class="demo-gauges"><div class="demo-gauge"><svg viewBox="0 0 60 60"><circle cx="30" cy="30" r="26" fill="none" stroke="var(--border)" stroke-width="4"/><circle cx="30" cy="30" r="26" fill="none" stroke="var(--green)" stroke-width="4" stroke-dasharray="147 163" stroke-linecap="round" transform="rotate(-90 30 30)" class="demo-gauge-fill"/></svg><span>92</span><small>Performance</small></div><div class="demo-gauge"><svg viewBox="0 0 60 60"><circle cx="30" cy="30" r="26" fill="none" stroke="var(--border)" stroke-width="4"/><circle cx="30" cy="30" r="26" fill="none" stroke="var(--cyan)" stroke-width="4" stroke-dasharray="138 163" stroke-linecap="round" transform="rotate(-90 30 30)" class="demo-gauge-fill"/></svg><span>85</span><small>SEO</small></div><div class="demo-gauge"><svg viewBox="0 0 60 60"><circle cx="30" cy="30" r="26" fill="none" stroke="var(--border)" stroke-width="4"/><circle cx="30" cy="30" r="26" fill="none" stroke="var(--purple)" stroke-width="4" stroke-dasharray="155 163" stroke-linecap="round" transform="rotate(-90 30 30)" class="demo-gauge-fill"/></svg><span>95</span><small>Access.</small></div></div>'
    },
    design: {
      title: 'Responsive Preview',
      html: '<div class="demo-design"><div class="demo-screen desktop"><div class="demo-bar"></div><div class="demo-content"><div class="demo-block w60"></div><div class="demo-block w40"></div><div class="demo-block w100"></div></div></div><div class="demo-screen mobile"><div class="demo-bar"></div><div class="demo-content"><div class="demo-block w100"></div><div class="demo-block w100"></div></div></div></div>'
    },
    media: {
      title: 'Thumbnail Pipeline',
      html: '<div class="demo-media"><div class="demo-thumb" style="background:linear-gradient(135deg,#1a1a2e,#16213e);"><span style="font-size:9px;font-weight:700;color:#fff;text-transform:uppercase;">AI Agents</span><div style="width:24px;height:24px;border-radius:50%;background:var(--purple);margin-top:4px;"></div></div><div class="demo-thumb" style="background:linear-gradient(135deg,#0f3460,#533483);"><span style="font-size:9px;font-weight:700;color:#fff;text-transform:uppercase;">Automation</span><div style="width:24px;height:24px;border-radius:50%;background:var(--cyan);margin-top:4px;"></div></div><div class="demo-thumb" style="background:linear-gradient(135deg,#2d3436,#636e72);"><span style="font-size:9px;font-weight:700;color:#fff;text-transform:uppercase;">Scale Fast</span><div style="width:24px;height:24px;border-radius:50%;background:var(--green);margin-top:4px;"></div></div></div>'
    }
  };

  cards.forEach(function(card) {
    card.addEventListener('mouseenter', function() {
      var key = this.getAttribute('data-demo');
      var demo = demos[key];
      if (!demo || !demoArea) return;
      demoArea.innerHTML = '<div class="demo-label">' + demo.title + '</div>' + demo.html;
      demoArea.classList.add('active');
    });
  });

  // Activate first demo on scroll into view
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) {
      if (e.isIntersecting && demoArea && !demoArea.classList.contains('active')) {
        var firstKey = cards[0].getAttribute('data-demo');
        var demo = demos[firstKey];
        if (demo) {
          demoArea.innerHTML = '<div class="demo-label">' + demo.title + '</div>' + demo.html;
          demoArea.classList.add('active');
        }
      }
    });
  }, { threshold: 0.3 });
  var section = document.getElementById('solutions');
  if (section) observer.observe(section);
})();


// ===== 3. COMMAND PALETTE =====
(function initCommandPalette() {
  var palette = document.getElementById('cmdPalette');
  var input = document.getElementById('cmdInput');
  var results = document.getElementById('cmdResults');
  if (!palette || !input || !results) return;

  var commands = [
    { cmd: '/solutions', label: 'View Solutions', action: function() { location.hash = '#solutions'; } },
    { cmd: '/chatbot', label: 'AI Chatbot Service', action: function() { location.href = 'chatbot.html'; } },
    { cmd: '/automation', label: 'Automation Service', action: function() { location.href = 'automation.html'; } },
    { cmd: '/seo', label: 'SEO Service', action: function() { location.href = 'seo.html'; } },
    { cmd: '/design', label: 'Web Design Service', action: function() { location.href = 'design.html'; } },
    { cmd: '/media', label: 'AI Media Pipeline', action: function() { location.href = 'case-thumbnail-pipeline.html'; } },
    { cmd: '/pricing', label: 'View Pricing', action: function() { location.href = 'pricing.html'; } },
    { cmd: '/audit', label: 'Free Site Diagnostic', action: function() { location.href = 'audit.html'; } },
    { cmd: '/about', label: 'About & Philosophy', action: function() { location.href = 'about.html'; } },
    { cmd: '/contact', label: 'Start a Project', action: function() { location.hash = '#contact'; } },
    { cmd: '/github', label: 'View on GitHub', action: function() { window.open('https://github.com/yoggi-sheandelle', '_blank'); } },
  ];

  function render(filter) {
    var f = (filter || '').toLowerCase();
    var html = '';
    commands.forEach(function(c, i) {
      if (f && c.cmd.indexOf(f) === -1 && c.label.toLowerCase().indexOf(f) === -1) return;
      html += '<div class="cmd-item" data-idx="' + i + '" tabindex="0"><span class="cmd-key">' + c.cmd + '</span><span class="cmd-label">' + c.label + '</span></div>';
    });
    results.innerHTML = html || '<div class="cmd-empty">No results</div>';

    results.querySelectorAll('.cmd-item').forEach(function(el) {
      el.addEventListener('click', function() {
        var idx = parseInt(this.getAttribute('data-idx'));
        commands[idx].action();
        close();
      });
    });
  }

  function open() {
    palette.classList.add('active');
    input.value = '';
    render('');
    setTimeout(function() { input.focus(); }, 100);
  }

  function close() {
    palette.classList.remove('active');
  }

  input.addEventListener('input', function() { render(this.value); });
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') close();
    if (e.key === 'Enter') {
      var first = results.querySelector('.cmd-item');
      if (first) first.click();
    }
  });

  palette.addEventListener('click', function(e) {
    if (e.target === palette) close();
  });

  // Keyboard shortcut: Cmd/Ctrl + K
  document.addEventListener('keydown', function(e) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      if (palette.classList.contains('active')) close(); else open();
    }
  });

  // Nav trigger
  var trigger = document.getElementById('cmdTrigger');
  if (trigger) trigger.addEventListener('click', function(e) { e.preventDefault(); open(); });
})();


// ===== 4. AMBIENT TIME-BASED MODE =====
(function initAmbient() {
  var hour = new Date().getHours();
  var root = document.documentElement;

  if (hour >= 6 && hour < 12) {
    // Morning: slightly warmer
    root.style.setProperty('--bg-primary', '#0e1218');
    root.style.setProperty('--purple-glow', 'rgba(140, 80, 237, 0.35)');
  } else if (hour >= 12 && hour < 18) {
    // Afternoon: default palette (no changes)
  } else if (hour >= 18 && hour < 22) {
    // Evening: deeper purples
    root.style.setProperty('--bg-primary', '#0b0e15');
    root.style.setProperty('--purple-glow', 'rgba(124, 58, 237, 0.45)');
  } else {
    // Night: deepest blacks, more cyan glow
    root.style.setProperty('--bg-primary', '#080a0f');
    root.style.setProperty('--bg-secondary', '#0e1117');
    root.style.setProperty('--cyan', '#00e5ff');
  }
})();


// ===== 5. CASE STUDY TIMELINE =====
(function initTimeline() {
  var container = document.getElementById('timeline');
  if (!container) return;

  var items = container.querySelectorAll('.tl-item');
  items.forEach(function(item) {
    item.addEventListener('mouseenter', function() {
      var detail = this.querySelector('.tl-detail');
      if (detail) detail.style.maxHeight = detail.scrollHeight + 'px';
    });
    item.addEventListener('mouseleave', function() {
      var detail = this.querySelector('.tl-detail');
      if (detail) detail.style.maxHeight = '0';
    });
  });

  // Horizontal scroll with mouse wheel
  container.addEventListener('wheel', function(e) {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      container.scrollLeft += e.deltaY;
    }
  }, { passive: false });
})();


// ===== 6. LIVE TERMINAL STATS =====
(function initLiveTerminal() {
  var body = document.getElementById('terminalBody');
  if (!body) return;

  var lines = [
    { prompt: true, text: 'status' },
    { text: '' },
    { text: 'I build systems where every piece connects, nothing falls through, and the output is <span class="accent">measurable</span>.' },
    { text: '' },
    { text: '<span class="accent">ElektraOS</span> started as my own operating system for AI agents, workflow automation, and complex project orchestration. Now it powers solutions for businesses across industries.' },
    { text: '' },
    { text: 'I think in <span class="highlight">systems</span>, not tasks. I automate before I repeat. I build once and let it <span class="accent">scale</span>.' },
    { text: '' },
    { prompt: true, text: 'uptime' },
    { text: '<span class="accent">' + Math.floor((Date.now() - new Date('2025-10-01').getTime()) / 86400000) + '</span> days in production' },
    { text: '<span class="accent">41</span> specialized agents active' },
    { text: '<span class="accent">624</span> API endpoints responding' },
    { text: '<span class="accent">31</span> automation workflows running' },
    { text: '' },
    { prompt: true, cursor: true }
  ];

  var html = '';
  lines.forEach(function(l, i) {
    if (l.cursor) {
      html += '<p><span class="prompt">$ </span><span class="cursor" style="animation: blink 0.8s infinite;">_</span></p>';
    } else if (l.prompt) {
      html += '<p><span class="prompt">$ </span>' + l.text + '</p>';
    } else if (l.text === '') {
      html += '<br>';
    } else {
      html += '<p>' + l.text + '</p>';
    }
  });

  body.innerHTML = html;
})();
