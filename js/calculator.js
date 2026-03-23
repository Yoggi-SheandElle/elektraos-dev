// ===== INTERACTIVE PRICING CALCULATOR =====

(function () {
  const PRICING = {
    chatbot: {
      starter: { range: [200, 400], name: 'Starter', features: ['Basic FAQ bot', 'Single data source', 'Web widget', '1 revision round'] },
      pro: { range: [400, 800], name: 'Pro', features: ['RAG-powered assistant', 'Multiple data sources', 'API integrations', 'Cross-session memory', '3 revision rounds'] },
      enterprise: { range: [800, 2000], name: 'Enterprise', features: ['Multi-model fallback', 'Custom training pipeline', 'Full API access', 'Analytics dashboard', 'Unlimited revisions'] }
    },
    automation: {
      starter: { range: [150, 350], name: 'Starter', features: ['Up to 3 workflows', 'Basic integrations', 'Email triggers', '1 revision round'] },
      pro: { range: [350, 700], name: 'Pro', features: ['Up to 10 workflows', 'AI agent routing', 'CRM + calendar sync', 'Error handling', '3 revision rounds'] },
      enterprise: { range: [700, 1500], name: 'Enterprise', features: ['Unlimited workflows', 'Multi-agent teams', 'Custom API endpoints', 'Monitoring dashboard', 'Unlimited revisions'] }
    },
    seo: {
      starter: { range: [150, 300], name: 'Quick Audit', features: ['Technical SEO audit', 'Core Web Vitals report', 'Top 10 fixes list', 'PDF report'] },
      pro: { range: [300, 600], name: 'Full Optimization', features: ['Everything in Quick Audit', 'On-page optimization', 'Schema markup', 'Speed optimization', 'Monthly report'] },
      enterprise: { range: [600, 1200], name: 'Ongoing SEO', features: ['Everything in Full', 'Content pipeline', 'Keyword tracking', 'Monthly optimization', 'Competitor monitoring'] }
    },
    design: {
      starter: { range: [250, 500], name: 'Landing Page', features: ['Single page design', 'Mobile responsive', 'Contact form', '1 revision round'] },
      pro: { range: [500, 1000], name: 'Multi-Page Site', features: ['Up to 5 pages', 'Custom design', 'CMS integration', 'SEO setup', '3 revision rounds'] },
      enterprise: { range: [1000, 3000], name: 'Full Brand', features: ['Unlimited pages', 'Brand identity', 'E-commerce ready', 'Custom animations', 'Unlimited revisions'] }
    }
  };

  const ADDONS = { rush: 100, maintenance: 75, revisions: 50 };

  let state = { service: null, tier: null, addons: [] };

  const serviceCards = document.querySelectorAll('.calc-service-card');
  const tierStep = document.getElementById('calcTierStep');
  const tiersContainer = document.getElementById('calcTiers');
  const addonStep = document.getElementById('calcAddonStep');
  const addonCards = document.querySelectorAll('.calc-addon');
  const totalSection = document.getElementById('calcTotal');
  const amountDisplay = document.getElementById('calcAmount');

  // Service selection
  serviceCards.forEach(function (card) {
    card.addEventListener('click', function () {
      serviceCards.forEach(function (c) { c.classList.remove('selected'); });
      card.classList.add('selected');
      state.service = card.dataset.service;
      state.tier = null;
      state.addons = [];
      addonCards.forEach(function (a) { a.classList.remove('selected'); });
      renderTiers();
      tierStep.style.display = 'block';
      addonStep.style.display = 'none';
      totalSection.style.display = 'none';
      tierStep.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  });

  function renderTiers() {
    const tiers = PRICING[state.service];
    tiersContainer.innerHTML = '';
    Object.keys(tiers).forEach(function (key) {
      const tier = tiers[key];
      const el = document.createElement('div');
      el.className = 'calc-tier';
      el.dataset.tier = key;
      el.innerHTML =
        '<div class="tier-name">' + tier.name + '</div>' +
        '<div class="tier-range">' + formatCurrency(tier.range[0]) + ' - ' + formatCurrency(tier.range[1]) + '</div>' +
        '<ul class="tier-features">' +
        tier.features.map(function (f) { return '<li>' + f + '</li>'; }).join('') +
        '</ul>';
      el.addEventListener('click', function () {
        tiersContainer.querySelectorAll('.calc-tier').forEach(function (t) { t.classList.remove('selected'); });
        el.classList.add('selected');
        state.tier = key;
        addonStep.style.display = 'block';
        totalSection.style.display = 'block';
        updateTotal();
        addonStep.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
      tiersContainer.appendChild(el);
    });
  }

  // Add-on selection
  addonCards.forEach(function (card) {
    card.addEventListener('click', function () {
      card.classList.toggle('selected');
      const addon = card.dataset.addon;
      if (state.addons.includes(addon)) {
        state.addons = state.addons.filter(function (a) { return a !== addon; });
      } else {
        state.addons.push(addon);
      }
      updateTotal();
    });
  });

  function updateTotal() {
    if (!state.service || !state.tier) return;
    const tier = PRICING[state.service][state.tier];
    let addonTotal = 0;
    state.addons.forEach(function (a) { addonTotal += ADDONS[a]; });
    const min = tier.range[0] + addonTotal;
    const max = tier.range[1] + addonTotal;
    amountDisplay.textContent = formatCurrency(min) + ' - ' + formatCurrency(max);
  }
})();
