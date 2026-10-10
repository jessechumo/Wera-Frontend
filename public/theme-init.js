// Applies the saved theme before first paint (see src/lib/theme.tsx).
(function () {
  var t = 'system';
  try {
    t = localStorage.getItem('wera-theme') || 'system';
  } catch (e) {}
  if (t === 'system') t = matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  document.documentElement.dataset.theme = t;
  document.documentElement.style.background = t === 'light' ? '#F6F6F3' : '#0A0B0F';
})();
