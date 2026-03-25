// ===== TYPING ANIMATION =====

(function () {
  const el = document.getElementById('typingText');
  if (!el) return;

  const phrases = [
    'Custom SaaS. Apps. AI systems. Shipped.',
    'From concept to production in days.',
    'It works before you pay. That\'s the deal.',
    'Systems that compound over time.',
    'I build because I enjoy it.'
  ];

  let phraseIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  let timeout;

  function type() {
    const current = phrases[phraseIndex];

    if (!isDeleting) {
      el.textContent = current.substring(0, charIndex + 1);
      charIndex++;
      if (charIndex === current.length) {
        isDeleting = true;
        timeout = setTimeout(type, 2000);
        return;
      }
      timeout = setTimeout(type, 70);
    } else {
      el.textContent = current.substring(0, charIndex - 1);
      charIndex--;
      if (charIndex === 0) {
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        timeout = setTimeout(type, 400);
        return;
      }
      timeout = setTimeout(type, 35);
    }
  }

  setTimeout(type, 800);
})();
