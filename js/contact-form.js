(function () {
  function init() {
    var form = document.getElementById('contactForm');
    if (!form) return;
    form.setAttribute('action', 'javascript:void(0)');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var fd = new FormData(form);
      var name = (fd.get('name') || '').toString().trim();
      var email = (fd.get('email') || '').toString().trim();
      var service = (fd.get('service') || '').toString().trim();
      var budget = (fd.get('budget') || '').toString().trim();
      var message = (fd.get('message') || '').toString().trim();
      if (!name || !email) {
        alert('Please fill in name and email.');
        return;
      }
      var subject = 'Contact from elektraos.dev . ' + (service || 'general');
      var lines = [
        'Name: ' + name,
        'Email: ' + email,
        'Service interest: ' + (service || '-'),
        'Budget range: ' + (budget || '-'),
        '',
        'Message:',
        message || '(no message provided)',
        '',
        '--',
        'Sent from ' + window.location.href
      ];
      var mailto = 'mailto:yossra.benzad@gmail.com'
        + '?subject=' + encodeURIComponent(subject)
        + '&body=' + encodeURIComponent(lines.join('\n'));
      window.location.href = mailto;
      var btn = form.querySelector('button[type="submit"]');
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Opening email client . . .';
      }
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
