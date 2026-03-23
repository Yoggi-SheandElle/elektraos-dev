// ===== LIVE CHAT WIDGET =====

(function () {
  const toggle = document.getElementById('chatToggle');
  const panel = document.getElementById('chatPanel');
  const closeBtn = document.getElementById('chatClose');
  const input = document.getElementById('chatInput');
  const sendBtn = document.getElementById('chatSend');
  const messages = document.getElementById('chatMessages');

  if (!toggle) return;

  const RESPONSES = {
    greetings: {
      patterns: ['hello', 'hi', 'hey', 'hej', 'salut', 'bonjour', 'merhaba'],
      replies: [
        'Hey! Good to have you here. What are you working on?',
        'Hi there! Looking for AI solutions, automation, or something else?'
      ]
    },
    services: {
      patterns: ['service', 'what do you', 'what can you', 'offer', 'help', 'build'],
      replies: [
        'I build four things: AI chatbots, workflow automation, WordPress SEO optimization, and web design. Each one is tailored to what you actually need - no cookie-cutter packages.',
        'Four core services: AI assistants, automation workflows, SEO, and web design. Want me to go deeper on any of these?'
      ]
    },
    pricing: {
      patterns: ['price', 'cost', 'how much', 'budget', 'rate', 'expensive', 'cheap', 'afford'],
      replies: [
        'Depends on scope. AI chatbots start at $200, automation at $150, SEO at $150, and web design at $250. Check the pricing calculator above for a detailed estimate.',
        'I price by project, not by hour. Starting points: $150 for SEO audits, $200 for chatbots, $250 for web design. Use the calculator on this page to build your estimate.'
      ]
    },
    chatbot: {
      patterns: ['chatbot', 'assistant', 'bot', 'ai chat', 'rag', 'llm'],
      replies: [
        'I build RAG-powered chatbots trained on your data. They handle customer questions, capture leads, and work 24/7. Multi-language support included. Want to discuss your use case?'
      ]
    },
    automation: {
      patterns: ['automat', 'workflow', 'n8n', 'agent', 'integrate', 'api'],
      replies: [
        'I connect your tools and automate repetitive work. Think: invoice parsing, email routing, CRM updates, lead scoring - all running without you touching it. What processes are eating your time?'
      ]
    },
    seo: {
      patterns: ['seo', 'search', 'google', 'traffic', 'ranking', 'wordpress', 'speed', 'core web'],
      replies: [
        'I do full technical SEO: audits, Core Web Vitals optimization, schema markup, and automated content pipelines. I\'ve optimized 50+ sites. Drop your URL in the audit tool above for a free check.'
      ]
    },
    design: {
      patterns: ['design', 'website', 'landing', 'figma', 'redesign', 'ui', 'ux'],
      replies: [
        'I design and build responsive websites from scratch or from Figma. Six style categories available - from luxury to minimal. Everything ships mobile-first and SEO-ready.'
      ]
    },
    location: {
      patterns: ['where', 'location', 'country', 'copenhagen', 'denmark', 'remote', 'meet'],
      replies: [
        'Based in Copenhagen, Denmark. I work with clients worldwide. If you\'re local, we can meet in person - a 20-minute coffee is usually enough to scope a project.'
      ]
    },
    timeline: {
      patterns: ['how long', 'timeline', 'when', 'deadline', 'fast', 'urgent', 'rush'],
      replies: [
        'Depends on the project. A chatbot or SEO audit can be done in days. Full automation suites or brand websites take 2-4 weeks. Rush delivery is available as an add-on.'
      ]
    },
    fallback: {
      replies: [
        'Good question. Let me point you to the right place - check out the services section above or use the contact form for a detailed conversation.',
        'I\'d rather give you a proper answer than a generic one. Drop me a message through the contact form and I\'ll get back to you with specifics.',
        'That\'s worth a proper conversation. Book a quick call or send me a message through the form - I respond within 24 hours.'
      ]
    }
  };

  // Toggle panel
  toggle.addEventListener('click', function () {
    panel.classList.toggle('open');
    if (panel.classList.contains('open')) input.focus();
  });

  closeBtn.addEventListener('click', function () {
    panel.classList.remove('open');
  });

  // Send message
  function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    addMessage(text, 'user');
    input.value = '';

    // Show typing indicator
    const typing = document.createElement('div');
    typing.className = 'chat-typing';
    typing.innerHTML = '<span></span><span></span><span></span>';
    messages.appendChild(typing);
    messages.scrollTop = messages.scrollHeight;

    // Generate response
    const delay = 800 + Math.random() * 1200;
    setTimeout(function () {
      typing.remove();
      const reply = getResponse(text);
      addMessage(reply, 'bot');
    }, delay);
  }

  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') sendMessage();
  });

  function addMessage(text, type) {
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble ' + type;
    bubble.textContent = text;
    messages.appendChild(bubble);
    messages.scrollTop = messages.scrollHeight;
  }

  function getResponse(text) {
    const lower = text.toLowerCase();
    for (const category of Object.keys(RESPONSES)) {
      if (category === 'fallback') continue;
      const patterns = RESPONSES[category].patterns;
      for (const pattern of patterns) {
        if (lower.includes(pattern)) {
          const replies = RESPONSES[category].replies;
          return replies[Math.floor(Math.random() * replies.length)];
        }
      }
    }
    const fallbacks = RESPONSES.fallback.replies;
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }
})();
