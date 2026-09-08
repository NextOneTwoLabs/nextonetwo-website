// Entry point for the deployed Worker. The site itself is the static files in public/ (see
// [assets] in wrangler.toml). This script does two things and runs ahead of the static assets only
// for "/" and "/api/*" (run_worker_first in wrangler.toml), so every other file is served as a
// free static asset:
//
//   1. Redirects the workers.dev address and the bare apex to the canonical custom domain.
//   2. Accepts waiting-list signups at POST /api/waitlist and stores them in the WAITLIST KV
//      namespace, one key per email. Stored per signup: the first-joined timestamp and which
//      "Join the waiting list" buttons were used. No IP, no user agent.
const CANONICAL_HOST = 'www.nextonetwo.com';
const SOURCES = new Set(['connect-better', 'act-smarter']);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname.endsWith('.workers.dev') || url.hostname === 'nextonetwo.com') {
      url.hostname = CANONICAL_HOST;
      return Response.redirect(url.toString(), 301);
    }
    if (url.pathname === '/api/waitlist') return waitlist(request, env);
    return env.ASSETS.fetch(request);
  },
};

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
