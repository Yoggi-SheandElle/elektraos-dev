// ===== ELEKTRA CHAT v3 - Live LLM engine + on-page fallback =====
// Production talks to the Citetome/Loomgraph API (provider-agnostic LLM,
// short rolling history, strict rate limits). If the API errors, the
// scored intent matcher over the site knowledge base answers instead.
// Bot HTML comes only from KB constants; API replies render as text.

(function () {
  // -- Self-bootstrap: inject the widget on pages that don't carry the markup --
  var AVATAR_SVG = '<svg width="18" height="18" viewBox="0 0 32 32" fill="none"><polygon points="16,5 25,10.5 25,21.5 16,27 7,21.5 7,10.5" stroke="url(#sigil-g2)" stroke-width="1.2" opacity="0.6"/><path d="M12 11 L20 11 M12 11 L12 21 M12 16 L19 16 M12 21 L20 21" stroke="url(#sigil-g2)" stroke-width="2" stroke-linecap="round"/><circle cx="16" cy="16" r="1.5" fill="#00d4ff" opacity="0.9"/><defs><linearGradient id="sigil-g2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#7c3aed"/><stop offset="100%" stop-color="#00d4ff"/></linearGradient></defs></svg>';

  if (!document.getElementById('chatToggle')) {
    if (!document.querySelector('link[href*="chat.css"]')) {
      var l = document.createElement('link');
      l.rel = 'stylesheet';
      l.href = '/css/chat.css';
      document.head.appendChild(l);
    }
    var w = document.createElement('div');
    w.className = 'chat-widget';
    w.id = 'chatWidget';
    w.innerHTML =
      '<div class="chat-panel" id="chatPanel">'
      + '<div class="chat-panel-header"><div class="header-info">'
      + '<div class="header-avatar">' + AVATAR_SVG + '</div>'
      + '<div><div class="header-name">Elektra</div><div class="header-status">AI Assistant</div></div></div>'
      + '<button class="chat-close-btn" id="chatClose"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>'
      + '<div class="chat-messages" id="chatMessages"></div>'
      + '<div class="chat-input-area">'
      + '<input type="text" class="chat-input" id="chatInput" placeholder="Ask me anything...">'
      + '<button class="chat-send" id="chatSend"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></button></div>'
      + '</div>'
      + '<button id="chatToggle" class="chat-toggle" aria-label="Open chat">' + AVATAR_SVG + '</button>';
    document.body.appendChild(w);
  }

  var toggle = document.getElementById('chatToggle');
  var panel = document.getElementById('chatPanel');
  var closeBtn = document.getElementById('chatClose');
  var input = document.getElementById('chatInput');
  var sendBtn = document.getElementById('chatSend');
  var messagesEl = document.getElementById('chatMessages');

  if (!toggle || !panel || !messagesEl) return;

  // -- Chip + suggestion styles (CSP allows inline styles) --
  var style = document.createElement('style');
  style.textContent =
    '.chat-suggestions{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0 4px;}' +
    '.chat-chip{background:rgba(124,58,237,0.12);border:1px solid rgba(124,58,237,0.45);color:var(--text-primary,#e6edf3);' +
    'border-radius:14px;padding:5px 12px;font-size:12px;font-family:inherit;cursor:pointer;transition:all .15s ease;}' +
    '.chat-chip:hover{background:rgba(124,58,237,0.3);border-color:#7c3aed;}' +
    '.chat-bubble.bot a{color:#00d4ff;text-decoration:underline;text-underline-offset:2px;}' +
    '.chat-bubble.bot a:hover{color:#7c3aed;}';
  document.head.appendChild(style);

  // -- Config --
  var IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  var API_URL = IS_LOCAL ? 'http://localhost:8000/public/chat' : 'https://api.citetome.com/public/chat';
  var HEALTH_URL = IS_LOCAL ? 'http://localhost:8000/health' : 'https://api.citetome.com/health';
  var EMAIL = 'benzad.yossra@gmail.com';
  var SESSION_ID = localStorage.getItem('elektra_session') || ('s_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6));
  localStorage.setItem('elektra_session', SESSION_ID);
  var isApiOnline = !IS_LOCAL; // optimistic in production; health check corrects
  var HIST = [];               // rolling {role, text} pairs for the LLM
  var messageCount = 0;
  var leadCaptured = false;

  // -- Page context --
  function getCurrentPage() {
    var path = window.location.pathname;
    if (path.includes('smb')) return 'smb';
    if (path.includes('pricing')) return 'pricing';
    if (path.includes('chatbot')) return 'chatbot';
    if (path.includes('automation')) return 'automation';
    if (path.includes('seo')) return 'seo';
    if (path.includes('design')) return 'design';
    if (path.includes('case')) return 'cases';
    if (path.includes('about')) return 'about';
    if (path.includes('blog')) return 'blog';
    if (path.includes('log')) return 'log';
    if (path.includes('audit')) return 'audit';
    if (path.includes('society')) return 'society';
    return 'home';
  }

  // -- API health (local dev only) --
  function checkApi() {
    fetch(HEALTH_URL, { method: 'GET', signal: AbortSignal.timeout(4000) })
      .then(function (r) { return r.json(); })
      .then(function (d) { isApiOnline = d.status === 'ok' || d.status === 'online'; updateStatus(); })
      .catch(function () { isApiOnline = false; updateStatus(); });
  }

  function updateStatus() {
    var statusEl = panel ? panel.querySelector('.header-status') : null;
    if (statusEl) {
      statusEl.textContent = isApiOnline ? 'Live AI - Online' : 'AI Assistant';
      statusEl.style.color = isApiOnline ? '#00ff9d' : '#aaa';
    }
  }

  checkApi(); setInterval(checkApi, 60000);

  // -- Knowledge base --
  // k: weighted keywords {term: weight}. ctx: page slugs that boost this intent.
  // r: reply variants (safe HTML from constants). s: follow-up suggestion chips.
  var LINK = {
    pricing: '<a href="/pricing/">pricing configurator</a>',
    cases: '<a href="/cases/">Case Studies</a>',
    smb: '<a href="/smb/">For SMB</a>',
    audit: '<a href="/audit/">free audit tool</a>',
    society: '<a href="/loomgraph-society/">Loomgraph Society</a>',
    email: '<a href="mailto:benzad.yossra@gmail.com?subject=Project%20inquiry%20from%20elektraos.dev">' + 'benzad.yossra@gmail.com</a>'
  };

  var KB = [
    { id: 'greeting',
      k: { hello: 3, hi: 3, hey: 3, hej: 3, salut: 3, bonjour: 3, hola: 3, yo: 2, salam: 3 },
      r: ['Hey! I\'m Elektra, the assistant behind this site. Ask me about services, pricing, case studies, or anything you saw here.',
          'Hi there! Looking for AI solutions, automation, or something custom? Ask away.'],
      s: ['What do you offer?', 'Show me pricing', 'Case studies'] },

    { id: 'thanks',
      k: { thanks: 3, thank: 3, merci: 3, tak: 3, cheers: 2, great: 1, perfect: 1, awesome: 1 },
      r: ['Anytime. If you want to take it further, email ' + LINK.email + ' - replies within 24 hours.'],
      s: ['Contact', 'Pricing', 'Case studies'] },

    { id: 'about_bot',
      k: { 'who are you': 6, elektra: 3, 'about you': 5, yourself: 3, 'how do you work': 5, 'are you ai': 4, 'real person': 4, human: 2 },
      r: ['I\'m Elektra. On this site I run as a lightweight on-page engine - your questions never leave the browser. The full ElektraOS system behind me runs 41 specialized agents. Built by Yossra, full-stack engineer in London.'],
      s: ['What is ElektraOS?', 'Who is Yossra?', 'Services'] },

    { id: 'about_studio',
      k: { yossra: 4, founder: 3, 'who built': 5, 'who made': 5, studio: 2, engineer: 2, team: 2, background: 2, experience: 2 },
      ctx: ['about'],
      r: ['ElektraOS.dev is the studio of Yossra Benzad - a full-stack engineer based in London building custom SaaS, AI systems, and automation. Solo engineering, production-grade output. More on the <a href="/about/">About page</a>.'],
      s: ['Case studies', 'Services', 'Contact'] },

    { id: 'elektraos_system',
      k: { elektraos: 4, 'operating system': 4, 'cognitive': 3, 'multi-agent': 4, 'agent system': 4, terminal: 2, 'your system': 3, backend: 2, infrastructure: 2 },
      r: ['ElektraOS is a cognitive operating system: 184K+ lines of code, 41 agents, 624 endpoints - built to run an entire business from a single terminal. It powers this site, the automations, and the agent workflows. Full story: <a href="/case-elektraos/">ElektraOS case study</a>.'],
      s: ['Other case studies', 'What can you build for me?', 'Pricing'] },

    { id: 'services',
      k: { service: 4, offer: 4, 'what do you do': 6, 'what can you': 4, help: 2, solutions: 3, build: 2, 'work with': 2 },
      r: ['Five core solutions, all engineered from scratch:<br>1. <a href="/chatbot/">AI Chatbots</a> - assistants trained on your data<br>2. <a href="/automation/">Automation</a> - workflow orchestration<br>3. <a href="/seo/">SEO</a> - technical audits + AI visibility<br>4. <a href="/design/">Web Design</a> - performance-first sites<br>5. <a href="/case-thumbnail-pipeline/">AI Media</a> - content pipelines<br>Plus a dedicated ' + LINK.smb + ' track for companies under 50 employees.'],
      s: ['Pricing', 'For SMB', 'Case studies'] },

    { id: 'pricing',
      k: { price: 4, pricing: 4, cost: 4, 'how much': 5, budget: 3, rate: 3, quote: 3, estimate: 3, afford: 3, expensive: 3, cheap: 2 },
      ctx: ['pricing'],
      r: ['Transparent tiers: AI chatbots from $500, automation from $300, SEO from $400, web design from $500 - each scales with scope up to $2,000-$3,000 for full builds. The ' + LINK.pricing + ' shows a live estimate as you configure. SMB clients get market-adjusted rates at <a href="/smb/pricing/">SMB pricing</a>.'],
      s: ['What\'s included?', 'Timeline', 'Contact'] },

    { id: 'chatbot_service',
      k: { chatbot: 4, 'chat bot': 4, assistant: 3, bot: 3, rag: 3, llm: 3, gpt: 2, 'customer support': 3, 'lead capture': 3 },
      ctx: ['chatbot'],
      r: ['I build intelligent chatbots trained on your data - multi-language, 24/7, with lead capture built in. You\'re talking to one right now. Tiers start at $500; details on the <a href="/chatbot/">chatbot page</a>. What\'s your use case?'],
      s: ['Pricing', 'How long does it take?', 'Contact'] },

    { id: 'automation_service',
      k: { automation: 4, automate: 4, workflow: 3, integrate: 3, integration: 3, connect: 2, sync: 2, n8n: 3, zapier: 3, 'manual work': 3, invoice: 2, crm: 2 },
      ctx: ['automation'],
      r: ['End-to-end automation: connecting your tools, eliminating manual processes, deploying intelligent agents. Invoice parsing, email routing, CRM updates, lead scoring. From $300. Details: <a href="/automation/">automation page</a>. What processes are eating your time?'],
      s: ['Pricing', 'Examples', 'Contact'] },

    { id: 'seo_service',
      k: { seo: 4, search: 2, google: 3, ranking: 3, traffic: 3, 'core web vitals': 4, schema: 2, 'ai visibility': 4, citations: 2, perplexity: 3, 'ai overview': 4 },
      ctx: ['seo'],
      r: ['Full technical SEO plus AI-search visibility: audits, Core Web Vitals, schema markup, content optimization - and making sure AI engines like ChatGPT and Perplexity can cite you. From $400. Try the ' + LINK.audit + ' for an instant score, no signup.'],
      s: ['Free audit', 'Pricing', 'Case studies'] },

    { id: 'design_service',
      k: { design: 3, website: 3, 'web design': 5, landing: 3, redesign: 4, figma: 3, ui: 2, ux: 2, responsive: 2, 'new site': 4 },
      ctx: ['design'],
      r: ['From single-page launches to full brand platforms - designed for performance, built for conversion, mobile-first and SEO-ready. From $500. See the <a href="/design/">design page</a> and live examples in ' + LINK.cases + '.'],
      s: ['Pricing', 'Examples', 'Contact'] },

    { id: 'media_service',
      k: { thumbnail: 4, media: 3, 'ai media': 5, image: 2, 'content pipeline': 5, youtube: 3, 'generative ai': 3, video: 2 },
      r: ['The AI Media pipeline produces images and thumbnails at scale - generative AI, n8n orchestration, custom Python workers. Full breakdown: <a href="/case-thumbnail-pipeline/">thumbnail pipeline case study</a>.'],
      s: ['Other case studies', 'Pricing', 'Contact'] },

    { id: 'audit_tool',
      k: { audit: 4, 'free audit': 6, 'check my site': 5, 'site speed': 4, performance: 3, score: 2, lighthouse: 3 },
      ctx: ['audit'],
      r: ['The ' + LINK.audit + ' gives you an instant performance score for any URL - free, no signup. If the score hurts, that\'s usually where we start.'],
      s: ['SEO services', 'Pricing', 'Contact'] },

    { id: 'smb',
      k: { smb: 5, 'small business': 5, 'under 50': 4, startup: 3, 'eu ai act': 6, compliance: 4, governance: 3, 'b corp': 5, bcorp: 5, hubs: 3, 'hub lead': 5, annex: 3 },
      ctx: ['smb'],
      r: ['The ' + LINK.smb + ' track is AI, automation, and data infrastructure for companies under 50 employees - fixed pricing, fast onboarding, production-grade stack. It includes <a href="/smb/compliance/">EU AI Act compliance</a> (Annex IV dossier), <a href="/smb/governance/">governance</a>, <a href="/smb/hubs/">local hubs</a>, and <a href="/smb/bcorp/">B Corp prep</a>.'],
      s: ['SMB pricing', 'Which markets?', 'Contact'] },

    { id: 'markets',
      k: { market: 3, country: 4, countries: 4, uk: 2, ghana: 4, morocco: 4, denmark: 4, germany: 3, netherlands: 3, sweden: 3, france: 3, italy: 3, tunisia: 4, international: 3, language: 3, languages: 3 },
      r: ['Active across 9 markets: UK (London hub), Ghana, Morocco, Denmark, Germany, Netherlands, Sweden, France, and Italy - plus a Tunisia edition. The site itself runs in 9 languages; use the globe icon in the nav to switch. Remote work worldwide is standard.'],
      s: ['For SMB', 'Services', 'Contact'] },

    { id: 'society',
      k: { society: 4, loomgraph: 4, 'cross-link': 4, 'link graph': 4, cohort: 3, 'grow together': 4, network: 2 },
      ctx: ['society'],
      r: [LINK.society + ' is a hub of websites that grow together through legal, regulation-compliant cross-linking - powered by Loomgraph, an agentic platform that audits SEO, generates content briefs, and weaves a live internal-link graph. Founding cohort applications are open.'],
      s: ['Loomgraph case study', 'SEO services', 'Contact'] },

    { id: 'cases_overview',
      k: { 'case stud': 5, portfolio: 4, projects: 3, examples: 3, built: 2, shipped: 3, 'previous work': 5, 'your work': 4, clients: 3, proof: 3 },
      ctx: ['cases'],
      r: ['All real, deployed systems - live status across 13 projects on the ' + LINK.cases + ' page. Highlights: <a href="/case-ayla/">AYLA Luxury</a> (live jewelry e-commerce), <a href="/case-elektraos/">ElektraOS</a> (184K+ lines, 41 agents), <a href="/case-loomgraph/">Loomgraph</a> (agentic SEO platform), <a href="/case-sheandelle/">She&amp;Elle</a> (brand + digital presence), <a href="/case-thumbnail-pipeline/">AI media pipeline</a>, and <a href="/case-40th-brick/">The 40th Brick</a> (interactive puzzle game).'],
      s: ['Tell me about AYLA', 'What is ElektraOS?', 'Pricing'] },

    { id: 'case_ayla',
      k: { ayla: 6, jewelry: 4, jewellery: 4, luxury: 3, ecommerce: 3, 'e-commerce': 3, whatsapp: 3, shop: 2 },
      r: ['<a href="/case-ayla/">AYLA Luxury</a>: a live e-commerce site for a luxury jewelry brand. The June 2026 upgrade added an AI-visibility audit via Citetome, 100/100 AI-readability, WhatsApp ordering, and an owner self-publish portal.'],
      s: ['Other case studies', 'Web design services', 'Pricing'] },

    { id: 'case_loomgraph',
      k: { 'loomgraph platform': 6, 'agentic seo': 5, 'content brief': 4, 'internal link': 4, 'auto-onboard': 4 },
      r: ['<a href="/case-loomgraph/">Loomgraph</a>: an agentic platform that auto-onboards sites, audits SEO, generates content briefs, and weaves a live internal-link graph across a portfolio of websites. Built on ElektraOS + MealShift Commerce OS.'],
      s: ['Loomgraph Society', 'SEO services', 'Other case studies'] },

    { id: 'case_sheandelle',
      k: { sheandelle: 6, 'she&elle': 6, 'she elle': 6, lifestyle: 3, wordpress: 3, 'brand identity': 4, scandinavian: 3 },
      r: ['<a href="/case-sheandelle/">She&amp;Elle of Morocco</a>: brand identity and digital presence for a Moroccan-Scandinavian lifestyle brand - WordPress, content strategy, social automation.'],
      s: ['Other case studies', 'Design services', 'Contact'] },

    { id: 'case_brick',
      k: { brick: 4, '40th': 5, birthday: 3, game: 3, puzzle: 4, phaser: 4, rooms: 2 },
      r: ['<a href="/case-40th-brick/">The 40th Brick</a>: an interactive puzzle built for someone who builds worlds. 40 rooms, each one earned. It shows what custom interactive builds can look like.'],
      s: ['Other case studies', 'What can you build for me?', 'Contact'] },

    { id: 'blog_log',
      k: { blog: 4, log: 3, 'build log': 5, articles: 3, writing: 2, notes: 2, read: 2 },
      ctx: ['blog', 'log'],
      r: ['Two reading tracks: the <a href="/blog/">Blog</a> (engineering notes and systems thinking from a solo engineer) and the <a href="/log/">Build Log</a> (what shipped, when, and the technical decisions behind it - live).'],
      s: ['Case studies', 'About', 'Services'] },

    { id: 'contact',
      k: { contact: 5, email: 4, reach: 3, talk: 3, call: 3, meeting: 3, book: 3, 'get in touch': 6, 'start a project': 6, discuss: 3 },
      r: ['Email ' + LINK.email + ' - replies within 24 hours. Or hit "Let\'s Build" in the nav. If you describe your project in one or two lines, you\'ll get a concrete answer, not a sales pitch.'],
      s: ['Pricing', 'Timeline', 'Services'] },

    { id: 'timeline',
      k: { 'how long': 5, timeline: 4, deadline: 4, when: 2, delivery: 3, fast: 2, urgent: 3, weeks: 2 },
      r: ['A chatbot or automation ships in 1-2 weeks. Full web platforms take 3-6 weeks. Tell me what you need and you\'ll get an honest timeline, not an optimistic one.'],
      s: ['Pricing', 'Contact', 'Services'] },

    { id: 'hire',
      k: { hire: 4, freelance: 4, contract: 3, available: 3, collaborate: 3, partnership: 3, 'work together': 5, availability: 4 },
      r: ['Open for projects, co-builds, and partnerships - via signed Statement of Work and direct invoicing. Email ' + LINK.email + ' with what you\'re building.'],
      s: ['Pricing', 'Case studies', 'Timeline'] },

    { id: 'location',
      k: { where: 3, location: 4, based: 3, london: 4, remote: 3, timezone: 4, copenhagen: 3 },
      r: ['Based in London, United Kingdom - working remotely worldwide across 9 markets. Timezone flexibility is not a problem.'],
      s: ['Which markets?', 'Contact', 'Services'] },

    { id: 'tech',
      k: { stack: 4, tech: 3, technology: 3, python: 3, fastapi: 4, 'three.js': 4, react: 3, nextjs: 3, 'next.js': 3, database: 2, hosting: 2, code: 2 },
      r: ['Core stack: Python + FastAPI on the backend, modern JS on the front (this site\'s 3D sigil is Three.js), n8n for orchestration, and custom agents on ElektraOS. Every project ships as real, deployed, maintainable code - no templates.'],
      s: ['What is ElektraOS?', 'Case studies', 'Contact'] }
  ];

  // -- Scoring matcher --
  function score(text, page) {
    var lower = ' ' + text.toLowerCase().replace(/[^a-z0-9&.\- ]/g, ' ').replace(/\s+/g, ' ') + ' ';
    var best = null, bestScore = 0;
    for (var i = 0; i < KB.length; i++) {
      var e = KB[i], s = 0;
      for (var term in e.k) {
        if (term.indexOf(' ') > -1 ? lower.indexOf(term) > -1 : lower.indexOf(' ' + term) > -1) {
          s += e.k[term];
        }
      }
      if (s > 0 && e.ctx && e.ctx.indexOf(page) > -1) s += 1.5;
      if (s > bestScore) { bestScore = s; best = e; }
    }
    return bestScore >= 3 ? best : null;
  }

  var FALLBACKS = [
    'Good question - that one deserves a real answer rather than a canned one. Email ' + LINK.email + ' and you\'ll hear back within 24 hours. Meanwhile, try asking about services, pricing, or case studies.',
    'I don\'t have a precise answer for that on file. The fastest route is ' + LINK.email + '. Or ask me about what gets built here - chatbots, automation, SEO, design.'
  ];

  // -- UI helpers --
  function addMessage(html, type, meta) {
    var bubble = document.createElement('div');
    bubble.className = 'chat-bubble ' + type;
    if (type === 'bot') { bubble.innerHTML = html; } else { bubble.textContent = html; }
    messagesEl.appendChild(bubble);

    if (type === 'bot' && meta && meta.model && meta.model !== 'faq') {
      var stats = document.createElement('div');
      stats.className = 'chat-stats';
      stats.innerHTML = '<span title="Model">' + (meta.model || '?') + '</span>'
        + '<span title="Latency">' + (meta.latency_ms || 0) + 'ms</span>'
        + '<span title="Tokens">' + (meta.tokens || 0) + ' tok</span>'
        + '<span title="Source">' + (meta.source || '?') + '</span>';
      messagesEl.appendChild(stats);
    } else if (type === 'bot' && meta && meta.model === 'faq') {
      var st = document.createElement('div');
      st.className = 'chat-stats';
      st.innerHTML = '<span>on-page engine</span><span>&lt;1ms</span><span title="Nothing leaves your browser">private</span>';
      messagesEl.appendChild(st);
    }
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function showSuggestions(items) {
    var old = messagesEl.querySelector('.chat-suggestions');
    if (old) old.remove();
    if (!items || !items.length) return;
    var wrap = document.createElement('div');
    wrap.className = 'chat-suggestions';
    items.forEach(function (label) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chat-chip';
      b.textContent = label;
      b.addEventListener('click', function () {
        input.value = label;
        sendMessage();
      });
      wrap.appendChild(b);
    });
    messagesEl.appendChild(wrap);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  // -- Context-aware opener --
  var OPENERS = {
    pricing: { t: 'Configuring a project? I can explain any tier or what affects the estimate.', s: ['What affects price?', 'Timeline', 'Contact'] },
    cases: { t: 'Everything here is real, deployed code. Want the story behind any project?', s: ['Tell me about AYLA', 'What is ElektraOS?', 'Pricing'] },
    smb: { t: 'Under 50 employees? This track was built for you - fixed pricing, fast onboarding.', s: ['SMB pricing', 'EU AI Act help', 'Which markets?'] },
    chatbot: { t: 'You\'re looking at the chatbot service - and talking to a live example of one.', s: ['Pricing', 'How does it work?', 'Timeline'] },
    audit: { t: 'Run any URL through the audit - then ask me what the score means.', s: ['SEO services', 'Pricing', 'Contact'] },
    home: { t: 'Hey! I\'m Elektra. Ask me about services, pricing, case studies - anything on this site.', s: ['What do you offer?', 'Show me pricing', 'Case studies'] }
  };
  var openerShown = false;
  function showOpener() {
    if (openerShown) return;
    openerShown = true;
    var o = OPENERS[getCurrentPage()] || OPENERS.home;
    // Pages that ship a hardcoded greeting bubble get chips only, no double greeting
    if (messagesEl.children.length === 0) addMessage(o.t, 'bot', null);
    showSuggestions(o.s);
  }

  // -- Toggle --
  toggle.addEventListener('click', function () {
    panel.classList.toggle('open');
    if (panel.classList.contains('open')) { showOpener(); input.focus(); }
  });
  if (closeBtn) closeBtn.addEventListener('click', function () { panel.classList.remove('open'); });

  // -- Send --
  function sendMessage() {
    var text = input.value.trim();
    if (!text) return;

    addMessage(text, 'user');
    input.value = '';
    messageCount++;

    var typing = document.createElement('div');
    typing.className = 'chat-typing';
    typing.innerHTML = '<span></span><span></span><span></span>';
    messagesEl.appendChild(typing);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    // Email detection -> acknowledge lead properly (nothing is stored client-side)
    var emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch && !leadCaptured) {
      leadCaptured = true;
      typing.remove();
      addMessage('Noted - but this chat is private and stores nothing, so the reliable route is one click: '
        + '<a href="mailto:' + EMAIL + '?subject=Project%20inquiry%20from%20elektraos.dev&body=' + encodeURIComponent('My email: ' + emailMatch[0] + '\n\nProject: ') + '">send your inquiry</a> and Yossra replies within 24 hours.', 'bot', { model: 'faq' });
      showSuggestions(['Pricing', 'Timeline', 'Case studies']);
      return;
    }

    var leadPrompt = (messageCount === 4 && !leadCaptured)
      ? '<br><br>By the way - if you want a proper breakdown by email, write ' + LINK.email + ' anytime.'
      : '';

    function answerLocally() {
      var hit = score(text, getCurrentPage());
      var reply, sugg;
      if (hit) {
        reply = hit.r[Math.floor(Math.random() * hit.r.length)];
        sugg = hit.s;
      } else {
        reply = FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
        sugg = ['Services', 'Pricing', 'Case studies'];
      }
      addMessage(reply + leadPrompt, 'bot', { model: 'faq' });
      showSuggestions(sugg);
    }

    if (isApiOnline) {
      fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, session_id: SESSION_ID, page: getCurrentPage(), history: HIST.slice(-6) }),
        signal: AbortSignal.timeout(20000)
      })
      .then(function (r) {
        if (!r.ok) { throw new Error('http ' + r.status); }
        return r.json();
      })
      .then(function (data) {
        typing.remove();
        if (!data.reply) { throw new Error('empty'); }
        HIST.push({ role: 'user', text: text.slice(0, 800) });
        HIST.push({ role: 'assistant', text: String(data.reply).slice(0, 800) });
        if (HIST.length > 8) { HIST = HIST.slice(-8); }
        var div = document.createElement('div');
        div.textContent = data.reply;
        addMessage(div.innerHTML.replace(/
/g, '<br>') + leadPrompt, 'bot', data);
        showSuggestions(['Pricing', 'Case studies', 'Contact']);
      })
      .catch(function () {
        typing.remove();
        isApiOnline = false;
        updateStatus();
        answerLocally();
      });
    } else {
      setTimeout(function () { typing.remove(); answerLocally(); }, 350 + Math.random() * 450);
    }
  }

  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter') sendMessage(); });
})();
