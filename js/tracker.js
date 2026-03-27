// ===== ELEKTRA SITE TRACKER =====
// Lightweight async visitor tracking for elektraos.dev
// Sends page views + key events to ElektraOS backend.
// Non-blocking. Falls back silently if endpoint offline.
// Privacy: IPs are hashed server-side. No PII collected.

(function () {
  'use strict';

  // ── Config ──────────────────────────────────────────────────────────────
  // Set this to your Cloudflare tunnel URL or public ElektraOS URL
  var TRACKER_URL = 'https://elektraos-tracker.trycloudflare.com/public/track';
  // Fallback: set via window.ELEKTRA_TRACKER_URL before this script loads
  if (window.ELEKTRA_TRACKER_URL) TRACKER_URL = window.ELEKTRA_TRACKER_URL;

  var SESSION_KEY = 'ek_sid';
  var PAGE_START = Date.now();

  // ── Session ID ───────────────────────────────────────────────────────────
  function getSessionId() {
    var sid = sessionStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid = 'ek_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
      sessionStorage.setItem(SESSION_KEY, sid);
    }
    return sid;
  }

  // ── Device detection ─────────────────────────────────────────────────────
  function getDevice() {
    var ua = navigator.userAgent;
    if (/Mobi|Android|iPhone|iPad/i.test(ua)) return 'mobile';
    if (/Tablet|iPad/i.test(ua)) return 'tablet';
    return 'desktop';
  }

  function getBrowser() {
    var ua = navigator.userAgent;
    if (ua.indexOf('Chrome') > -1 && ua.indexOf('Edg') === -1) return 'Chrome';
    if (ua.indexOf('Firefox') > -1) return 'Firefox';
    if (ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1) return 'Safari';
    if (ua.indexOf('Edg') > -1) return 'Edge';
    return 'Other';
  }

  function getOS() {
    var ua = navigator.userAgent;
    if (/Windows/.test(ua)) return 'Windows';
    if (/Mac OS X/.test(ua)) return 'macOS';
    if (/Linux/.test(ua)) return 'Linux';
    if (/Android/.test(ua)) return 'Android';
    if (/iPhone|iPad/.test(ua)) return 'iOS';
    return 'Other';
  }

  // ── UTM params ───────────────────────────────────────────────────────────
  function getUTM() {
    var params = new URLSearchParams(window.location.search);
    return {
      source: params.get('utm_source'),
      medium: params.get('utm_medium'),
      campaign: params.get('utm_campaign')
    };
  }

  // ── Send beacon ──────────────────────────────────────────────────────────
  function send(payload) {
    try {
      var body = JSON.stringify(payload);
      if (navigator.sendBeacon) {
        var blob = new Blob([body], { type: 'application/json' });
        navigator.sendBeacon(TRACKER_URL, blob);
      } else {
        fetch(TRACKER_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: body,
          keepalive: true
        }).catch(function () {});
      }
    } catch (e) {}
  }

  // ── Page view ─────────────────────────────────────────────────────────────
  function trackPageView() {
    var utm = getUTM();
    var path = window.location.pathname;
    // Clean up index.html suffix
    if (path.endsWith('/index.html')) path = path.replace('/index.html', '/');

    send({
      type: 'pageview',
      session_id: getSessionId(),
      page: path,
      referrer: document.referrer || null,
      utm_source: utm.source,
      utm_medium: utm.medium,
      utm_campaign: utm.campaign,
      device_type: getDevice(),
      browser: getBrowser(),
      os: getOS(),
      viewport_w: window.innerWidth,
      viewport_h: window.innerHeight
    });
  }

  // ── Duration on unload ───────────────────────────────────────────────────
  function trackDuration() {
    var ms = Date.now() - PAGE_START;
    if (ms < 500) return; // ignore instant bounces
    send({
      type: 'duration',
      session_id: getSessionId(),
      page: window.location.pathname,
      duration_ms: ms
    });
  }

  // ── Custom event ──────────────────────────────────────────────────────────
  window.trackEvent = function (eventType, element, metadata) {
    send({
      type: 'event',
      session_id: getSessionId(),
      event_type: eventType,
      page: window.location.pathname,
      element: element || null,
      metadata: metadata || null
    });
  };

  // ── Auto-track key clicks ──────────────────────────────────────────────────
  function autoTrackClicks() {
    document.addEventListener('click', function (e) {
      var el = e.target.closest('a, button, [data-track]');
      if (!el) return;

      var href = el.href || '';
      var text = (el.textContent || '').trim().slice(0, 60);
      var label = el.getAttribute('data-track') || text;

      // Portfolio link
      if (href.indexOf('elektraos-portfolio') !== -1) {
        window.trackEvent('portfolio_click', label, { href: href });
      }
      // External links
      else if (href && href.indexOf('elektraos.dev') === -1 && href.startsWith('http')) {
        window.trackEvent('external_link', label, { href: href });
      }
      // Case study opens
      else if (href && href.indexOf('/case-') !== -1) {
        window.trackEvent('case_open', label, { href: href });
      }
      // Contact CTA
      else if (href && (href.indexOf('#contact') !== -1 || href.indexOf('upwork') !== -1)) {
        window.trackEvent('contact_cta', label, { href: href });
      }
      // Chat opens
      else if (el.id === 'chatToggle' || el.id === 'sigil3d' || el.closest('#sigil3d')) {
        window.trackEvent('chat_open', 'sigil', null);
      }
      // Pricing page links
      else if (href && href.indexOf('/pricing') !== -1) {
        window.trackEvent('pricing_view', label, null);
      }
    }, true);
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  // Page view on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', trackPageView);
  } else {
    trackPageView();
  }

  // Duration on unload
  window.addEventListener('pagehide', trackDuration);
  window.addEventListener('beforeunload', trackDuration);

  // Auto-track clicks
  autoTrackClicks();

})();
