// ===== TYPING ANIMATION =====

(function () {
  const el = document.getElementById('typingText');
  if (!el) return;

  const phrases = [
    'AI that works while you sleep.',
    'Automation that scales.',
    'Performance you can measure.',
    'Infrastructure that compounds.',
    'Systems that deliver.'
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
