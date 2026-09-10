# NextOneTwo entrance page

> **Know More. Connect Better. Act Smarter.**

The entrance page for the NextOneTwo Project at **https://www.nextonetwo.com**. One sentence, then
the three things it names:

| Section        | Status        | On the page                                     |
|----------------|---------------|-------------------------------------------------|
| Know More      | Available now | The College Soccer and ECNL Girls research tools |
| Connect Better | Coming soon   | Personalized guidance — join the waiting list    |
| Act Smarter    | Coming soon   | Timely recommendations — join the waiting list   |

NextOneTwo supports student-athletes, starting with girls' soccer in the U.S. Connect Better and
Act Smarter are presented as coming soon, never as available. This is a research project,
non-profit for now.

## Layout

    public/            the site — everything served, exactly as served
      index.html
      styles.css
      app.js           theme toggle, copyright year, waiting-list form submit
      assets/favicon.svg
    worker.js          redirects workers.dev and the bare apex to www; handles POST /api/waitlist
    wrangler.toml      Cloudflare Workers config, including the WAITLIST KV binding

No build, packages, external fonts, or accounts. Plain HTML, CSS, and a small script. Cloudflare
Web Analytics is injected at the zone level, not from this repo.

## The waiting list

The only thing the site itself collects. The form on the page posts to `/api/waitlist`, which
`worker.js` handles by writing one key per email into the `WAITLIST` KV namespace:

    key:    the email address, lowercased
    value:  { "joined": "<first signup, ISO 8601>", "sources": ["connect-better", "act-smarter"] }

`sources` records which section's "Join the waiting list" link(s) the visitor used, so the list
says what people are waiting for. Nothing else is stored — no IP address, no user agent. Signing up twice
updates the one record rather than creating another.

The form works with JavaScript off (plain POST, the Worker redirects back to the page with a
confirmation). A hidden honeypot field drops the crudest bots. If junk signups appear, the free plan
includes one WAF rate-limiting rule that can cap `POST /api/waitlist` per IP from the dashboard.

### Reading the list

    npx wrangler kv key list --binding WAITLIST --remote
    npx wrangler kv key get "someone@example.com" --binding WAITLIST --remote

or in the dashboard under Storage & Databases → KV → WAITLIST.

## Preview

For the full site including the form:

    npx wrangler dev

then open http://localhost:8787. KV is simulated locally, so test signups stay on your machine.

For the static page alone, `python -m http.server 4173 --bind 127.0.0.1 --directory public` and
open http://127.0.0.1:4173 (the form will 404 there — expected).

## Deploy

Same setup as the sibling repos: a Cloudflare Worker whose static assets are `public/`. Pushes to
`main` deploy through the Cloudflare Git integration.

One-time setup for the waiting list — the KV namespace must exist before the first deploy that
references it, or the binding is missing and the form fails:

    npx wrangler kv namespace create WAITLIST

Paste the id it prints into `wrangler.toml` under `[[kv_namespaces]]` and push.

The custom domains are attached in the Cloudflare dashboard under **Settings → Domains & Routes**:
`www.nextonetwo.com` as the canonical address, and `nextonetwo.com` so the apex reaches the Worker
and is redirected to www. `worker.js` runs ahead of the assets for `/` and `/api/*` only; every other
file is served as a free static asset.

### Security headers

`worker.js` sets them on `/` and `/api/*`; `public/_headers` sets them on the static files. Keep the
two in sync. HSTS is one week for now, to be raised to a year in a follow-up. The CSP is report-only
for now and allows the inline theme script in `index.html` by two hashes, LF and CRLF. Recompute
them after any edit to that script (`wrangler dev` serves CRLF on Windows, production serves LF):

    python -c "import hashlib,base64;b=open('public/index.html','rb').read();s=b[b.index(b'<script>')+8:b.index(b'</script>')];print(base64.b64encode(hashlib.sha256(s).digest()).decode(),base64.b64encode(hashlib.sha256(s.replace(b'\r\n',b'\n')).digest()).decode())"

Cloudflare features that rewrite inline scripts (Rocket Loader) would break the hashes; leave them
off. HSTS only counts over HTTPS, so **SSL/TLS → Edge Certificates → Always Use HTTPS** is on.

## Related repos

- [collegedash](https://github.com/NextOneTwoLabs/collegedash) — https://college.nextonetwo.com
- [ecnl-dashboard](https://github.com/NextOneTwoLabs/ecnl-dashboard) — https://ecnl.nextonetwo.com

The tool links on the page open in the same tab; users can use standard browser controls to open a
new tab. The theme follows the system preference until the visitor toggles it; that choice is kept
in the browser under one localStorage key, `theme`. Nothing else is stored client-side. No claims
are made about live data freshness or independent verification.
