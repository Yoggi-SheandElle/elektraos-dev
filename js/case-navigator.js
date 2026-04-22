// ===== CASE NAVIGATOR =====
// Renders breadcrumb, related-cases grid, dual CTA, prev/next on every
// case page. Slug is read from data-case-slug on any element or URL path.
// Manifest below is the single source of truth for interlinking.

(function () {
  'use strict';

  var SVG_NS = 'http://www.w3.org/2000/svg';

  var CASES = [
    {
      slug: 'case-loomgraph',
      title: 'Loomgraph',
      tagline: 'Agentic SEO + interconnected sites',
      status: 'In Design',
      category: 'Platform',
      icon: 'L',
      grad: 'linear-gradient(135deg,#7c3aed,#E8A838)',
      related: ['case-elektraos', 'loomgraph-society', 'casestudy-mealshift'],
      cta_secondary: { label: 'Loomgraph Society', href: '/loomgraph-society/' },
    },
    {
      slug: 'case-elektraos',
      title: 'ElektraOS',
      tagline: 'Cognitive operating system with 49 agents',
      status: 'Production',
      category: 'Platform',
      icon: 'E',
      grad: 'linear-gradient(135deg,#7c3aed,#00d4ff)',
      related: ['case-loomgraph', 'case-thumbnail-pipeline', 'casestudy-mealshift'],
      cta_secondary: { label: 'Live Portfolio', href: 'https://yoggi-sheandelle.github.io/elektraos-portfolio/', external: true },
    },
    {
      slug: 'case-ayla',
      title: 'AYLA Maison',
      tagline: 'Luxury jewelry e-commerce, Casablanca',
      status: 'Live',
      category: 'E-commerce',
      icon: 'A',
      grad: 'linear-gradient(135deg,#B8956A,#D4B896)',
      related: ['case-sheandelle', 'case-loomgraph', 'case-kettering-montagu'],
      cta_secondary: { label: 'aylamaison.com', href: 'https://aylamaison.com', external: true },
    },
    {
      slug: 'case-sheandelle',
      title: 'She&Elle of Morocco',
      tagline: 'Moroccan-Scandinavian lifestyle brand',
      status: 'Active',
      category: 'Brand + site',
      icon: 'S',
      grad: 'linear-gradient(135deg,#c4956a,#8b6d4f)',
      related: ['case-ayla', 'case-kettering-montagu', 'case-loomgraph'],
      cta_secondary: { label: 'sheandelle.com', href: 'https://sheandelle.com', external: true },
    },
    {
      slug: 'case-kettering-montagu',
      title: 'Kettering Montagu',
      tagline: '8-flat UK block - vault, DB, outreach pack',
      status: 'Live',
      category: 'Property + ops',
      icon: 'K',
      grad: 'linear-gradient(135deg,#1d4ed8,#0ea5e9)',
      related: ['case-elektraos', 'casestudy-mealshift', 'case-sheandelle'],
      cta_secondary: { label: 'BizUs Legal', href: 'https://bizus.co.uk', external: true },
    },
    {
      slug: 'case-40th-brick',
      title: 'The 40th Brick',
      tagline: '40-room puzzle adventure for Ante',
      status: 'Deployed',
      category: 'Game',
      icon: '40',
      grad: 'linear-gradient(135deg,#e05545,#f59e0b)',
      related: ['case-thumbnail-pipeline', 'case-elektraos', 'case-loomgraph'],
      cta_secondary: { label: 'Play teaser', href: '/birthday/' },
    },
    {
      slug: 'case-thumbnail-pipeline',
      title: 'AI Thumbnail Pipeline',
      tagline: 'Multi-brand visual generator under 60s',
      status: 'Active',
      category: 'AI system',
      icon: 'T',
      grad: 'linear-gradient(135deg,#1a1a2e,#7c3aed)',
      related: ['case-elektraos', 'case-loomgraph', 'case-ayla'],
      cta_secondary: null,
    },
    {
      slug: 'casestudy-mealshift',
      path: '/casestudy/mealshift/',
      title: 'MealShift',
      tagline: 'UK food delivery - audit, recovery, API portal',
      status: 'Active build',
      category: 'Mobile + API',
      icon: 'M',
      grad: 'linear-gradient(135deg,#FF5362,#0d6600)',
      related: ['case-elektraos', 'case-loomgraph', 'case-kettering-montagu'],
      cta_secondary: null,
    },
    {
      slug: 'loomgraph-society',
      path: '/loomgraph-society/',
      title: 'Loomgraph Society',
      tagline: 'Hub of 11 founding sites growing together',
      status: 'Cohort open',
      category: 'Network',
      icon: '\u2605',
      grad: 'linear-gradient(135deg,#00ff9d,#00d4ff)',
      related: ['case-loomgraph', 'case-elektraos', 'case-ayla'],
      cta_secondary: { label: 'Apply to join', href: '/loomgraph-society/#apply' },
    },
  ];

  var BY_SLUG = {};
  CASES.forEach(function (c) { BY_SLUG[c.slug] = c; if (!c.path) c.path = '/' + c.slug + '/'; });

  function currentSlug() {
    var el = document.querySelector('[data-case-slug]');
    if (el) return el.getAttribute('data-case-slug');
    var m = window.location.pathname.replace(/\/$/, '').split('/').pop();
    return m || null;
  }

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        if (k === 'class') node.className = attrs[k];
        else if (k === 'text') node.textContent = attrs[k];
        else if (k === 'style') node.setAttribute('style', attrs[k]);
        else node.setAttribute(k, attrs[k]);
      }
    }
    (children || []).forEach(function (c) {
      if (c == null) return;
      node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return node;
  }

  function svg(tag, attrs) {
    var node = document.createElementNS(SVG_NS, tag);
    if (attrs) for (var k in attrs) node.setAttribute(k, attrs[k]);
    return node;
  }

  function externalIcon() {
    var root = svg('svg', { width: '12', height: '12', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' });
    root.appendChild(svg('path', { d: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6' }));
    root.appendChild(svg('polyline', { points: '15 3 21 3 21 9' }));
    root.appendChild(svg('line', { x1: '10', y1: '14', x2: '21', y2: '3' }));
    return root;
  }

  function renderBreadcrumb(current) {
    return el('nav', { class: 'case-breadcrumb', 'aria-label': 'Breadcrumb' }, [
      el('a', { href: '/' }, ['Home']),
      el('span', { class: 'sep', text: '\u203A' }),
      el('a', { href: '/cases/' }, ['Case Studies']),
      el('span', { class: 'sep', text: '\u203A' }),
      el('span', { class: 'current', text: current.title }),
      el('span', { class: 'status-pill', text: current.status }),
    ]);
  }

  function relatedCard(c) {
    return el('a', { class: 'related-card', href: c.path }, [
      el('div', { class: 'related-icon', style: 'background:' + c.grad, text: c.icon }),
      el('div', { class: 'related-body' }, [
        el('div', { class: 'related-cat', text: c.category }),
        el('h4', { class: 'related-title', text: c.title }),
        el('p', { class: 'related-tagline', text: c.tagline }),
      ]),
      el('span', { class: 'related-arrow', text: '\u2192' }),
    ]);
  }

  function renderRelated(current) {
    var related = (current.related || [])
      .map(function (s) { return BY_SLUG[s]; })
      .filter(function (c) { return c && c.slug !== current.slug; });
    if (!related.length) return null;
    return el('section', { class: 'case-related' }, [
      el('div', { class: 'section-label', text: '// Related work' }),
      el('h2', { class: 'related-heading', text: 'Part of the same network.' }),
      el('div', { class: 'related-grid' }, related.slice(0, 3).map(relatedCard)),
    ]);
  }

  function renderDualCTA(current) {
    var primary = el('a', { class: 'cta-primary', href: '/#contact' }, [
      el('span', { text: 'Start a project' }),
      el('span', { class: 'arrow', text: '\u2192' }),
    ]);
    var buttons = [primary];
    if (current.cta_secondary) {
      var attrs = { class: 'cta-secondary', href: current.cta_secondary.href };
      if (current.cta_secondary.external) {
        attrs.target = '_blank';
        attrs.rel = 'noopener';
      }
      var btn = el('a', attrs, [el('span', { text: current.cta_secondary.label })]);
      if (current.cta_secondary.external) btn.appendChild(externalIcon());
      buttons.push(btn);
    }
    return el('div', { class: 'cta-dual' }, [
      el('h3', { class: 'cta-heading', text: 'Working on something like this?' }),
      el('p', { class: 'cta-sub', text: 'Every project above started with a conversation. Yours can too.' }),
      el('div', { class: 'cta-buttons' }, buttons),
    ]);
  }

  function renderPrevNext(current) {
    var idx = CASES.findIndex(function (c) { return c.slug === current.slug; });
    if (idx < 0) return null;
    var prev = CASES[(idx - 1 + CASES.length) % CASES.length];
    var next = CASES[(idx + 1) % CASES.length];
    return el('nav', { class: 'case-pagination', 'aria-label': 'Case studies' }, [
      el('a', { class: 'pag-link prev', href: prev.path }, [
        el('span', { class: 'pag-arrow', text: '\u2190' }),
        el('span', { class: 'pag-body' }, [
          el('span', { class: 'pag-label', text: 'Previous' }),
          el('span', { class: 'pag-title', text: prev.title }),
        ]),
      ]),
      el('a', { class: 'pag-link next', href: next.path }, [
        el('span', { class: 'pag-body' }, [
          el('span', { class: 'pag-label', text: 'Next' }),
          el('span', { class: 'pag-title', text: next.title }),
        ]),
        el('span', { class: 'pag-arrow', text: '\u2192' }),
      ]),
    ]);
  }

  function mount() {
    var slug = currentSlug();
    if (!slug) return;
    var current = BY_SLUG[slug];
    if (!current) return;

    var topSlot = document.querySelector('[data-case-breadcrumb]');
    if (topSlot) {
      topSlot.appendChild(renderBreadcrumb(current));
    } else {
      var nav = document.querySelector('nav.nav');
      if (nav && nav.parentNode) {
        var wrapper = el('div', { class: 'case-breadcrumb-wrap' }, [renderBreadcrumb(current)]);
        nav.parentNode.insertBefore(wrapper, nav.nextSibling);
      }
    }

    var bottomSlot = document.querySelector('[data-case-navigator]');
    var host;
    if (bottomSlot) {
      host = bottomSlot;
    } else {
      host = el('div', { class: 'case-navigator-host' }, []);
      var footer = document.querySelector('footer.footer');
      if (footer && footer.parentNode) footer.parentNode.insertBefore(host, footer);
      else document.body.appendChild(host);
    }

    var related = renderRelated(current);
    if (related) host.appendChild(related);
    host.appendChild(renderDualCTA(current));
    var pn = renderPrevNext(current);
    if (pn) host.appendChild(pn);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
