// Entry point for the deployed Worker. The site itself is the static files in public/ (see
// [assets] in wrangler.toml). This script does two things and runs ahead of the static assets only
// for "/" and "/api/*" (run_worker_first in wrangler.toml), so every other file is served as a
// free static asset:
//
//   1. Redirects the workers.dev address and the bare apex to the canonical custom domain.
//   2. Accepts waiting-list signups at POST /api/waitlist and stores them in the WAITLIST KV
//      namespace, one key per email. Stored per signup: the first-joined timestamp and which
//      "Join the waiting list" buttons were used. No IP, no user agent.
//
// Every response this script returns carries the security headers below. Static files never reach
// this script, so public/_headers repeats the ones that apply to them; keep the two in sync.
const CANONICAL_HOST = 'www.nextonetwo.com';
const SOURCES = new Set(['connect-better', 'act-smarter']);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// The CSP is report-only until the live console is confirmed clean, then enforced. The two hashes
// are the SHA-256 of the inline theme script in public/index.html (the bytes between <script> and
// </script>), once with LF line endings as deployed and once with CRLF as checked out on Windows,
// so `wrangler dev` passes too. Any edit to that script must update both; the recipe is in the
// README under "Security headers".
const HEADERS = {
  'strict-transport-security': 'max-age=604800',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy': 'camera=(), microphone=(), geolocation=()',
  'content-security-policy-report-only':
    "default-src 'self'; " +
    "script-src 'self' 'sha256-MOzRt8wdypyoSuLVgnmKgSp3UZfiZiL1UYYTFoTinrw=' " +
    "'sha256-1XDJnt+WLN+GeSvc99vQUh5J+a8ndXRcF7utwh99c+M=' https://static.cloudflareinsights.com; " +
    "style-src 'self'; img-src 'self'; connect-src 'self'; form-action 'self'; " +
    "frame-ancestors 'none'; base-uri 'none'; object-src 'none'",
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname.endsWith('.workers.dev') || url.hostname === 'nextonetwo.com') {
      url.protocol = 'https:';
      url.hostname = CANONICAL_HOST;
      return secure(Response.redirect(url.toString(), 301));
    }
    if (url.pathname === '/api/waitlist') return secure(await waitlist(request, env));
    return secure(await env.ASSETS.fetch(request));
  },
};

// Copies a response (Response.redirect and asset responses are immutable) and sets every header.
function secure(res) {
  const out = new Response(res.body, res);
  for (const [name, value] of Object.entries(HEADERS)) out.headers.set(name, value);
  return out;
}

async function waitlist(request, env) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: { allow: 'POST' } });
  }

  // The page's script posts JSON; the plain no-JS form posts urlencoded. Answer each in kind.
  const wantsJson = (request.headers.get('content-type') || '').includes('application/json');
  let body = {};
  try {
    body = wantsJson
      ? await request.json()
      : Object.fromEntries((await request.formData()).entries());
  } catch {
    body = {};
  }

  const reply = (status, error) => {
    if (wantsJson) return Response.json(error ? { ok: false, error } : { ok: true }, { status });
    const back = new URL(error ? '/#waitlist' : '/?joined=1#waitlist', request.url);
    return Response.redirect(back.toString(), 303);
  };

  // Honeypot: real visitors never see the "website" field. Pretend it worked and store nothing.
  if (body.website) return reply(200);

  const email = String(body.email || '').trim().toLowerCase();
  if (!EMAIL.test(email) || email.length > 254) {
    return reply(400, 'Please enter a valid email address.');
  }
  const source = SOURCES.has(body.source) ? body.source : 'page';

  // One key per email. A second signup from the other section just adds its source.
  const existing = (await env.WAITLIST.get(email, 'json')) || {};
  const record = {
    joined: existing.joined || new Date().toISOString(),
    sources: [...new Set([...(existing.sources || []), source])],
  };
  await env.WAITLIST.put(email, JSON.stringify(record));
  return reply(200);
}
