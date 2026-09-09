const root = document.documentElement;
const toggle = document.querySelector('#theme-toggle');
const themeColor = document.querySelector('meta[name="theme-color"]'); // colors also in the inline script in index.html
const paint = (dark) => {
  root.dataset.theme = dark ? 'dark' : 'light';
  toggle.setAttribute('aria-pressed', String(dark));
  toggle.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
  themeColor.content = dark ? '#17212f' : '#ffffff';
};
paint(root.dataset.theme === 'dark'); // the inline script in index.html chose the theme; sync the button to it
toggle.addEventListener('click', () => {
  const dark = root.dataset.theme !== 'dark';
  paint(dark);
  try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch {}
});
document.querySelector('#year').textContent = new Date().getFullYear();

// Waiting list. The form works without this script (plain POST, the Worker answers with a 303
// back to /?joined=1#waitlist); this upgrades it to an in-place submit.
const form = document.querySelector('#waitlist-form');
const note = document.querySelector('#waitlist-note');
if (form && note) {
  const email = form.elements.email;
  const source = form.elements.source;

  const done = () => {
    form.hidden = true;
    note.textContent = 'You’re on the list.';
    note.classList.add('is-ok');
    note.tabIndex = -1;
    note.focus();
  };

  // "Join the waiting list" buttons: remember which section sent the visitor, then hand focus to
  // the email field once the anchor jump has happened.
  for (const btn of document.querySelectorAll('[data-source]')) {
    btn.addEventListener('click', () => {
      source.value = btn.dataset.source;
      setTimeout(() => email.focus({ preventScroll: true }), 0);
    });
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = form.querySelector('button');
    button.disabled = true;
    note.classList.remove('is-ok');
    note.textContent = 'Joining…';
    try {
      const res = await fetch(form.action, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: email.value, source: source.value, website: form.elements.website.value }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) done();
      else note.textContent = data.error || 'Something went wrong. Please try again.';
    } catch {
      note.textContent = 'Couldn’t reach the server. Please try again.';
    }
    button.disabled = false;
  });

  // No-JS fallback path lands here with ?joined=1; show the same confirmation and tidy the URL.
  if (new URLSearchParams(location.search).get('joined') === '1') {
    done();
    addEventListener('load', () => note.focus(), { once: true });
    history.replaceState(null, '', location.pathname + location.hash);
  }
}
