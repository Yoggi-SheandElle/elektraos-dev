/* ==============================
   i18n - Language Detection & Switcher
   elektraos.dev
   ============================== */

(function(){
  'use strict';

  var SUPPORTED = ['en','da','de','fr','it','nl','se','ma'];
  var LABELS = {en:'EN',da:'DA',de:'DE',fr:'FR',it:'IT',nl:'NL',se:'SE',ma:'MA'};
  var NAMES = {en:'English',da:'Dansk',de:'Deutsch',fr:'Fran\u00E7ais',it:'Italiano',nl:'Nederlands',se:'Svenska',ma:'Darija'};

  function getCurrentLang(){
    var path = window.location.pathname;
    for(var i=0;i<SUPPORTED.length;i++){
      if(path.indexOf('/'+SUPPORTED[i]+'/')===0) return SUPPORTED[i];
    }
    return 'en';
  }

  function getLangPath(targetLang){
    var path = window.location.pathname;
    var currentLang = getCurrentLang();
    var cleanPath = path;
    if(currentLang !== 'en'){
      cleanPath = path.replace('/'+currentLang+'/', '/');
    }
    if(targetLang === 'en') return cleanPath;
    return '/'+targetLang+cleanPath;
  }

  function buildSwitcher(){
    var current = getCurrentLang();
    var html = '<div class="lang-switcher" id="langSwitcher">';
    html += '<button class="lang-current" aria-label="Change language">';
    html += '<svg class="lang-globe" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>';
    html += '<span class="lang-code">'+LABELS[current]+'</span>';
    html += '<svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>';
    html += '</button>';
    html += '<div class="lang-dropdown">';

    for(var i=0;i<SUPPORTED.length;i++){
      var lang = SUPPORTED[i];
      var isActive = lang === current;
      html += '<a href="'+(isActive ? '#' : getLangPath(lang))+'" class="lang-option'+(isActive ? ' active' : '')+'" hreflang="'+lang+'">';
      html += '<span class="lang-option-code">'+LABELS[lang]+'</span>';
      html += '<span class="lang-option-name">'+NAMES[lang]+'</span>';
      if(isActive) html += '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>';
      html += '</a>';
    }

    html += '</div></div>';
    return html;
  }

  function injectSwitcher(){
    var navInner = document.querySelector('.nav-inner');
    if(!navInner) return;

    var cta = navInner.querySelector('.nav-cta');
    if(cta){
      cta.insertAdjacentHTML('beforebegin', buildSwitcher());
    } else {
      navInner.insertAdjacentHTML('beforeend', buildSwitcher());
    }

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

  function suggestLanguage(){
    var current = getCurrentLang();
    var browserLang = (navigator.language || navigator.userLanguage || 'en').substring(0,2).toLowerCase();
    if(SUPPORTED.indexOf(browserLang) === -1) return;
    if(browserLang === current) return;
    if(sessionStorage.getItem('lang_dismissed')) return;

    var bar = document.createElement('div');
    bar.className = 'lang-suggest';
    bar.innerHTML = '<span>This page is available in <strong>'+NAMES[browserLang]+'</strong></span>'
      + '<a href="'+getLangPath(browserLang)+'" class="lang-suggest-btn">Switch</a>'
      + '<button class="lang-suggest-close" aria-label="Dismiss">&times;</button>';

    document.body.appendChild(bar);
    requestAnimationFrame(function(){ bar.classList.add('visible'); });

    bar.querySelector('.lang-suggest-close').addEventListener('click', function(){
      bar.classList.remove('visible');
      sessionStorage.setItem('lang_dismissed','1');
      setTimeout(function(){ bar.remove(); }, 300);
    });
  }

  document.addEventListener('DOMContentLoaded', function(){
    injectSwitcher();
    setTimeout(suggestLanguage, 2500);
  });

})();
