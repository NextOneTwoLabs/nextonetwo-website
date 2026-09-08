const toggle = document.querySelector('#theme-toggle');
toggle.addEventListener('click', () => {
  const dark = document.documentElement.dataset.theme !== 'dark';
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  toggle.setAttribute('aria-pressed', String(dark));
  toggle.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
  document.querySelector('meta[name="theme-color"]').content = dark ? '#17212f' : '#ffffff';
});
document.querySelector('#year').textContent = new Date().getFullYear();

