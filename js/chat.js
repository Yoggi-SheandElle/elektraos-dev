// ===== ELEKTRA CHAT - AI-Powered with ElektraOS Backend =====
// Tries live API first, falls back to smart local FAQ.
// Shows under-the-hood stats panel for technical visitors.

(function () {
  var toggle = document.getElementById('chatToggle');
  var panel = document.getElementById('chatPanel');
  var closeBtn = document.getElementById('chatClose');
  var input = document.getElementById('chatInput');
  var sendBtn = document.getElementById('chatSend');
  var messagesEl = document.getElementById('chatMessages');

  if (!toggle) return;

  // ── Config ──
  var API_URL = 'http://localhost:8000/public/chat';
  var SESSION_ID = localStorage.getItem('elektra_session') || ('s_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6));
  localStorage.setItem('elektra_session', SESSION_ID);
  var isApiOnline = false;
  var messageCount = 0;

  // ── Detect current page for context ──
  function getCurrentPage() {
    var path = window.location.pathname;
    if (path.includes('pricing')) return 'pricing';
    if (path.includes('chatbot')) return 'chatbot';
    if (path.includes('automation')) return 'automation';
    if (path.includes('seo')) return 'seo';
    if (path.includes('design')) return 'design';
    if (path.includes('cases')) return 'cases';
    if (path.includes('about')) return 'about';
    if (path.includes('blog')) return 'blog';
    if (path.includes('log')) return 'log';
    return 'home';
  }

  // ── Check API availability on load ──
  function checkApi() {
    fetch(API_URL.replace('/chat', '/health'), { method: 'GET', signal: AbortSignal.timeout(3000) })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        isApiOnline = d.status === 'online';
        updateStatus();
      })
      .catch(function () { isApiOnline = false; updateStatus(); });
  }

  function updateStatus() {
    var statusEl = panel ? panel.querySelector('.header-status') : null;
    if (statusEl) {
      statusEl.textContent = isApiOnline ? 'AI Assistant - Online' : 'AI Assistant';
      statusEl.style.color = isApiOnline ? '#00ff9d' : '#aaa';
    }
  }

  checkApi();
  setInterval(checkApi, 30000);

  // ── Local FAQ fallback ──
  var FAQ = {
    greetings: { p: ['hello','hi','hey','hej','salut','bonjour'], r: ['Hey! I\'m Elektra. What are you working on?', 'Hi there! Looking for AI solutions, automation, or something custom?'] },
    about: { p: ['who are you','about you','yourself','elektra','how many agent','your system','behind','how does it work'], r: ['I\'m Elektra - the assistant behind this site. I\'m backed by a multi-agent system with AI capabilities, built by Yossra, a full-stack engineer in Copenhagen. What would you like to know?'] },
    services: { p: ['service','what do you','what can you','offer','help','build','do you do'], r: ['Five core solutions: AI chatbots, workflow automation, SEO optimization, web design, and AI media pipelines. Each one is engineered from scratch - no templates. What do you need?'] },
    pricing: { p: ['price','cost','how much','budget','rate','afford'], r: ['AI chatbots from $200, automation from $150, SEO from $150, web design from $250. Everything is scoped to what you actually need. Want a custom quote?'] },
    chatbot: { p: ['chatbot','assistant','bot','ai chat','rag','llm'], r: ['I build intelligent chatbots trained on your data. Multi-language, 24/7, with lead capture built in. What\'s your use case?'] },
    automation: { p: ['automat','workflow','integrate','connect','sync'], r: ['I connect your tools and automate repetitive work - invoice parsing, email routing, CRM updates, lead scoring. What processes are eating your time?'] },
    seo: { p: ['seo','search','google','traffic','ranking','speed'], r: ['Full technical SEO: audits, Core Web Vitals, schema markup, and content optimization. What\'s your current situation?'] },
    design: { p: ['design','website','landing','figma','ui','ux'], r: ['I design and build responsive websites from scratch. Everything ships mobile-first and SEO-ready. What do you have in mind?'] },
    contact: { p: ['contact','email','reach','talk','call','meeting','book'], r: ['Email yossra.benzad@gmail.com or start a project on Upwork (link in the nav). I respond within 24 hours.'] },
    portfolio: { p: ['portfolio','projects','case study','examples','work','built','previous'], r: ['Check the Case Studies page for detailed breakdowns. I\'ve shipped production systems, e-commerce platforms, AI pipelines, and this website itself. Each one is real, deployed code.'] },
    location: { p: ['where','location','copenhagen','denmark','remote'], r: ['Based in Copenhagen, Denmark. Available worldwide for remote work. Timezone flexibility is not a problem.'] },
    timeline: { p: ['how long','timeline','deadline','when','delivery'], r: ['A chatbot or automation ships in 1-2 weeks. Full web platforms take 3-6 weeks. Tell me what you need for an honest timeline.'] },
    hire: { p: ['hire','freelance','contract','available','collaborate','partnership','agent'], r: ['Open for projects, co-builds, and partnerships. I work through Upwork for contracts. What are you building?'] }
  };

  function localMatch(text) {
    var lower = text.toLowerCase();
    for (var key in FAQ) {
      for (var i = 0; i < FAQ[key].p.length; i++) {
        if (lower.includes(FAQ[key].p[i])) {
          var replies = FAQ[key].r;
          return replies[Math.floor(Math.random() * replies.length)];
        }
      }
    }
    return null;
  }

  // ── Toggle panel ──
  toggle.addEventListener('click', function () {
    panel.classList.toggle('open');
    if (panel.classList.contains('open')) input.focus();
  });

  if (closeBtn) closeBtn.addEventListener('click', function () { panel.classList.remove('open'); });

  // ── Add message to chat ──
  function addMessage(text, type, meta) {
    var bubble = document.createElement('div');
    bubble.className = 'chat-bubble ' + type;
    bubble.textContent = text;
    messagesEl.appendChild(bubble);

    // Stats badge for bot messages (under the hood)
    if (type === 'bot' && meta && meta.model !== 'faq') {
      var stats = document.createElement('div');
      stats.className = 'chat-stats';
      stats.innerHTML = '<span title="Model">' + (meta.model || '?') + '</span>'
        + '<span title="Latency">' + (meta.latency_ms || 0) + 'ms</span>'
        + '<span title="Tokens">' + (meta.tokens || 0) + ' tok</span>'
        + '<span title="Source">' + (meta.source || '?') + '</span>';
      messagesEl.appendChild(stats);
    } else if (type === 'bot' && meta && meta.model === 'faq') {
      var stats = document.createElement('div');
      stats.className = 'chat-stats';
      stats.innerHTML = '<span>faq</span><span>&lt;1ms</span><span>local</span>';
      messagesEl.appendChild(stats);
    }

    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  // ── Send message ──
  function sendMessage() {
    var text = input.value.trim();
    if (!text) return;

    addMessage(text, 'user');
    input.value = '';
    messageCount++;

    // Show typing
    var typing = document.createElement('div');
    typing.className = 'chat-typing';
    typing.innerHTML = '<span></span><span></span><span></span>';
    messagesEl.appendChild(typing);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    // Lead capture: after 3 messages, subtly ask for contact if not given
    var leadPrompt = '';
    if (messageCount === 4) {
      leadPrompt = '\n\nBy the way - if you want me to follow up with details, drop your email and I\'ll send a proper breakdown.';
    }

    // Try API first, fallback to local
    if (isApiOnline) {
      fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, session_id: SESSION_ID, page: getCurrentPage() }),
        signal: AbortSignal.timeout(10000)
      })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        typing.remove();
        addMessage((data.reply || 'Something went wrong.') + leadPrompt, 'bot', data);
      })
      .catch(function () {
        typing.remove();
        isApiOnline = false;
        updateStatus();
        var local = localMatch(text) || 'Good question. Email yossra.benzad@gmail.com for a detailed answer - I respond within 24 hours.';
        addMessage(local + leadPrompt, 'bot', { model: 'faq' });
      });
    } else {
      setTimeout(function () {
        typing.remove();
        var local = localMatch(text) || 'Good question. Email yossra.benzad@gmail.com for a detailed answer - I respond within 24 hours.';
        addMessage(local + leadPrompt, 'bot', { model: 'faq' });
      }, 400 + Math.random() * 600);
    }
  }

  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter') sendMessage(); });
})();
