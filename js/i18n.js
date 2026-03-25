/* ==============================
   i18n - Language Detection & Switcher
   elektraos.dev
   ============================== */

(function(){
  'use strict';

  var SUPPORTED = ['en','da','fr','it'];
  var LABELS = {en:'EN',da:'DA',fr:'FR',it:'IT'};
  var FLAGS = {en:'\uD83C\uDDEC\uD83C\uDDE7',da:'\uD83C\uDDE9\uD83C\uDDF0',fr:'\uD83C\uDDEB\uD83C\uDDF7',it:'\uD83C\uDDEE\uD83C\uDDF9'};

  // Detect current language from URL
  function getCurrentLang(){
    var path = window.location.pathname;
    for(var i=0;i<SUPPORTED.length;i++){
      if(path.indexOf('/'+SUPPORTED[i]+'/')===0) return SUPPORTED[i];
    }
    return 'en';
  }

  // Get equivalent path in another language
  function getLangPath(targetLang){
    var path = window.location.pathname;
    var currentLang = getCurrentLang();

    // Strip current lang prefix
    var cleanPath = path;
    if(currentLang !== 'en'){
      cleanPath = path.replace('/'+currentLang+'/', '/');
    }

    // Add target lang prefix
    if(targetLang === 'en') return cleanPath;
    return '/'+targetLang+cleanPath;
  }

  // Build switcher HTML
  function buildSwitcher(){
    var current = getCurrentLang();
    var html = '<div class="lang-switcher" id="langSwitcher">';
    html += '<button class="lang-current" aria-label="Change language">';
    html += '<span class="lang-flag">'+FLAGS[current]+'</span>';
    html += '<span class="lang-code">'+LABELS[current]+'</span>';
    html += '<svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>';
    html += '</button>';
    html += '<div class="lang-dropdown">';

    for(var i=0;i<SUPPORTED.length;i++){
      var lang = SUPPORTED[i];
      if(lang === current) continue;
      html += '<a href="'+getLangPath(lang)+'" class="lang-option" hreflang="'+lang+'">';
      html += '<span class="lang-flag">'+FLAGS[lang]+'</span>';
      html += '<span>'+LABELS[lang]+'</span>';
      html += '</a>';
    }

    html += '</div></div>';
    return html;
  }

  // Inject switcher into nav
  function injectSwitcher(){
    var navInner = document.querySelector('.nav-inner');
    if(!navInner) return;

    // Insert before the CTA button
    var cta = navInner.querySelector('.nav-cta');
    if(cta){
      cta.insertAdjacentHTML('beforebegin', buildSwitcher());
    } else {
      navInner.insertAdjacentHTML('beforeend', buildSwitcher());
    }

    // Toggle dropdown
    var switcher = document.getElementById('langSwitcher');
    if(!switcher) return;
    var btn = switcher.querySelector('.lang-current');
    var dropdown = switcher.querySelector('.lang-dropdown');

    btn.addEventListener('click', function(e){
      e.stopPropagation();
      dropdown.classList.toggle('open');
    });

    document.addEventListener('click', function(){
      dropdown.classList.remove('open');
    });
  }

  // Auto-suggest based on browser language
  function suggestLanguage(){
    var current = getCurrentLang();
    var browserLang = (navigator.language || navigator.userLanguage || 'en').substring(0,2).toLowerCase();

    // Only suggest if we support it and user isn't already on it
    if(SUPPORTED.indexOf(browserLang) === -1) return;
    if(browserLang === current) return;

    // Don't suggest if user dismissed before
    if(sessionStorage.getItem('lang_dismissed')) return;

    var names = {en:'English',da:'Dansk',fr:'Fran\u00E7ais',it:'Italiano'};
    var bar = document.createElement('div');
    bar.className = 'lang-suggest';
    bar.innerHTML = '<span>'+FLAGS[browserLang]+' This page is available in <strong>'+names[browserLang]+'</strong></span>'
      + '<a href="'+getLangPath(browserLang)+'" class="lang-suggest-btn">Switch</a>'
      + '<button class="lang-suggest-close" aria-label="Dismiss">&times;</button>';

    document.body.appendChild(bar);

    // Animate in
    requestAnimationFrame(function(){
      bar.classList.add('visible');
    });

    bar.querySelector('.lang-suggest-close').addEventListener('click', function(){
      bar.classList.remove('visible');
      sessionStorage.setItem('lang_dismissed','1');
      setTimeout(function(){ bar.remove(); }, 300);
    });
  }

  // Init
  document.addEventListener('DOMContentLoaded', function(){
    injectSwitcher();
    setTimeout(suggestLanguage, 2000); // Suggest after 2s
  });

})();
