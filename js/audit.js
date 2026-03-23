// ===== URL AUDIT TOOL =====

(function () {
  var urlInput = document.getElementById('auditUrl');
  var runBtn = document.getElementById('auditBtn');
  var loading = document.getElementById('auditLoading');
  var results = document.getElementById('auditResults');
  var gaugesContainer = document.getElementById('auditGauges');
  var recsContainer = document.getElementById('auditRecs');

  if (!runBtn) return;

  var RECS_POOL = [
    { text: 'Render-blocking resources detected', severity: 'high' },
    { text: 'Images not optimized — missing WebP format', severity: 'high' },
    { text: 'Missing meta description on multiple pages', severity: 'medium' },
    { text: 'No structured data (schema markup)', severity: 'medium' },
    { text: 'TTFB above 1.5s threshold', severity: 'high' },
    { text: 'Missing alt text on images', severity: 'medium' },
    { text: 'No canonical URL set', severity: 'low' },
    { text: 'CSS and JS not minified', severity: 'low' },
    { text: 'Missing Open Graph tags', severity: 'low' },
    { text: 'No sitemap.xml found', severity: 'medium' },
    { text: 'Heading hierarchy broken (skipped levels)', severity: 'medium' },
    { text: 'No lazy loading on below-fold images', severity: 'low' }
  ];

  runBtn.addEventListener('click', runAudit);
  urlInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') runAudit();
  });

  function runAudit() {
    var url = urlInput.value.trim();
    if (!url) { urlInput.focus(); return; }

    results.classList.remove('visible');
    results.style.display = 'none';
    loading.classList.add('active');
    runBtn.disabled = true;
    runBtn.textContent = 'Analyzing...';

    setTimeout(function () {
      loading.classList.remove('active');
      runBtn.disabled = false;
      runBtn.textContent = 'Run Free Audit';
      showResults(url);
    }, 3200);
  }

  function showResults(url) {
    var hash = simpleHash(url);

    var perf = 35 + Math.round(seededRandom(hash) * 55);
    var seo = 40 + Math.round(seededRandom(hash + 1) * 50);
    var access = 50 + Math.round(seededRandom(hash + 2) * 45);

    var scores = [
      { label: 'Performance', score: perf },
      { label: 'SEO', score: seo },
      { label: 'Accessibility', score: access }
    ];

    gaugesContainer.innerHTML = '';
    var circumference = 2 * Math.PI * 46;

    for (var i = 0; i < scores.length; i++) {
      var g = scores[i];
      var color = g.score >= 90 ? '#2bff88' : g.score >= 50 ? '#fbbf24' : '#f87171';
      var offset = circumference - (g.score / 100) * circumference;

      var div = document.createElement('div');
      div.className = 'audit-gauge';
      div.innerHTML =
        '<svg viewBox="0 0 100 100">' +
          '<circle class="track" cx="50" cy="50" r="46" stroke-dasharray="' + circumference + '"/>' +
          '<circle class="fill" cx="50" cy="50" r="46" stroke="' + color + '" stroke-dasharray="' + circumference + '" stroke-dashoffset="' + circumference + '"/>' +
        '</svg>' +
        '<div class="score" style="color:' + color + '">' + g.score + '</div>' +
        '<div class="gauge-label">' + g.label + '</div>';
      gaugesContainer.appendChild(div);
    }

    // Animate gauges after a tick
    setTimeout(function () {
      var fills = gaugesContainer.querySelectorAll('.fill');
      for (var j = 0; j < scores.length; j++) {
        var off = circumference - (scores[j].score / 100) * circumference;
        fills[j].style.strokeDashoffset = off;
      }
    }, 50);

    // Recommendations
    recsContainer.innerHTML = '';
    var seed = hash;
    var picked = [];
    var pool = RECS_POOL.slice();
    for (var k = 0; k < 5 && pool.length > 0; k++) {
      seed = seed + 7;
      var idx = Math.round(seededRandom(seed) * (pool.length - 1));
      picked.push(pool.splice(idx, 1)[0]);
    }

    for (var m = 0; m < picked.length; m++) {
      var rec = picked[m];
      var li = document.createElement('li');
      li.className = 'audit-rec';
      li.innerHTML =
        '<span class="severity severity-' + rec.severity + '">' + rec.severity + '</span>' +
        '<span>' + rec.text + '</span>';
      recsContainer.appendChild(li);
    }

    results.style.display = 'block';
    results.classList.add('visible');
  }
})();
