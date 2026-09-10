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
      app.js           theme toggle, copyright year, waiting-list and feedback form submits
      assets/favicon.svg         the badge mark alone: tab icon and header
      assets/badge.svg           the full badge, source of the two PNGs
      assets/apple-touch-icon.png
      assets/og.png              link preview
      _headers         security headers for the static files (see Security headers)
    worker.js          redirects workers.dev and the bare apex to www; handles POST /api/waitlist
                       and POST /api/feedback
    wrangler.toml      Cloudflare Workers config, including the WAITLIST and FEEDBACK KV bindings

No build, packages, external fonts, or accounts. Plain HTML, CSS, a small script, and the badge
artwork. Cloudflare Web Analytics is injected at the zone level, not from this repo.

## What the site collects

Two things, and only from forms a visitor fills in: a waiting-list email address, and feedback.
Neither stores an IP address or a user agent.

### The waiting list

The form on the page posts to `/api/waitlist`, which `worker.js` handles by writing one key per
email into the `WAITLIST` KV namespace:

    key:    the email address, lowercased
    value:  { "joined": "<first signup, ISO 8601>", "sources": ["connect-better", "act-smarter"] }

`sources` records which section's "Join the waiting list" link(s) the visitor used, so the list
says what people are waiting for. Signing up twice updates the one record rather than creating
another.

### Feedback

The "Send feedback" panel in the footer posts to `/api/feedback`, which writes one key per
submission into the `FEEDBACK` KV namespace:

    key:      <sent, ISO 8601>-<8 random hex characters>
              e.g. 2026-09-10T18:04:21.512Z-9f3ac1b2
    value:    { "sent": "<ISO 8601>", "message": "<what the visitor typed>", "email": "<optional>" }
    metadata: { "email": "<the same address, or null>" }

The email cannot be the key: it is optional and not unique. `email` is left out of the value
entirely when the visitor gave none. The timestamp prefix makes a key listing come back in
chronological order and readable by eye; the random suffix keeps two submissions in the same
millisecond apart. The address is repeated as key metadata so a listing shows the date and whether
there is a reply address without fetching every record.

**The message is free text.** It can contain anything a visitor chooses to type, including a name,
a school, a club, or contact details the site never asked for and cannot validate. It is stored in
plain text, readable by anyone with dashboard or wrangler access. This repo sets no retention limit
and provides no deletion path; both are open decisions.

### Spam, limits, and JavaScript off

Both forms work with JavaScript off (plain POST, the Worker redirects back to the page). A hidden
honeypot field drops the crudest bots, and the feedback message is capped at 2,000 characters, but
those are the only defences: the cap bounds each write, not how many arrive. KV writes on the free
plan are capped at 1,000 a day for the whole account, shared between the two namespaces, so a flood
of feedback would break signups too. If junk appears, the free plan includes one WAF rate-limiting
rule that can cap requests per IP from the dashboard — one rule per account, so match `/api/*` to
cover both endpoints.

### Reading them back

    npx wrangler kv key list --binding WAITLIST --remote
    npx wrangler kv key get "someone@example.com" --binding WAITLIST --remote

    npx wrangler kv key list --binding FEEDBACK --remote
    npx wrangler kv key get "2026-09-10T18:04:21.512Z-9f3ac1b2" --binding FEEDBACK --remote

or in the dashboard under Storage & Databases → KV. Feedback keys are not guessable, so reading
feedback back is list then get, one call per submission — it is storage, not an inbox. A feedback
listing prints the metadata, so it prints every reply email: never paste one into a public issue
or a screenshot.

## Preview

For the full site including the forms:

    npx wrangler dev

then open http://localhost:8787. KV is simulated locally, so test signups and test feedback stay
on your machine.

For the static page alone, `python -m http.server 4173 --bind 127.0.0.1 --directory public` and
open http://127.0.0.1:4173 (the forms will 404 there — expected).

## Deploy

Same setup as the sibling repos: a Cloudflare Worker whose static assets are `public/`. Pushes to
`main` deploy through the Cloudflare Git integration.

One-time setup for the two forms — each KV namespace must exist before the first deploy that
references it, or the binding is missing and that form fails:

    npx wrangler kv namespace create WAITLIST
    npx wrangler kv namespace create FEEDBACK

Paste the id each prints into `wrangler.toml` under `[[kv_namespaces]]` and push. Because pushes
to `main` deploy automatically, never merge a binding that still holds a placeholder id.

The custom domains are attached in the Cloudflare dashboard under **Settings → Domains & Routes**:
`www.nextonetwo.com` as the canonical address, and `nextonetwo.com` so the apex reaches the Worker
and is redirected to www. `worker.js` runs ahead of the assets for `/` and `/api/*` only; every other
file is served as a free static asset.

### Security headers

`worker.js` sets them on `/` and `/api/*`; `public/_headers` sets them on the static files. Keep the
two in sync. HSTS is one week for now, to be raised to a year in a follow-up. The CSP is report-only
for now and allows the inline theme script in `index.html` by two hashes; the recipe prints the
checkout's hash first (CRLF on Windows with autocrlf), then LF, so keep that order. Recompute
them after any edit to that script (`wrangler dev` serves CRLF on Windows, production serves LF):

    python -c "import hashlib,base64;b=open('public/index.html','rb').read();s=b[b.index(b'<script>')+8:b.index(b'</script>')];print(base64.b64encode(hashlib.sha256(s).digest()).decode(),base64.b64encode(hashlib.sha256(s.replace(b'\r\n',b'\n')).digest()).decode())"

Cloudflare features that rewrite inline scripts (Rocket Loader) would break the hashes; leave them
off. HSTS only counts over HTTPS; **SSL/TLS → Edge Certificates → Always Use HTTPS** must be on.

## Related repos

- [collegedash](https://github.com/NextOneTwoLabs/collegedash) — https://college.nextonetwo.com
- [ecnl-dashboard](https://github.com/NextOneTwoLabs/ecnl-dashboard) — https://ecnl.nextonetwo.com

The tool links on the page open in the same tab; users can use standard browser controls to open a
new tab. The theme follows the system preference until the visitor toggles it; that choice is kept
in the browser under one localStorage key, `theme`. Nothing else is stored client-side. No claims
are made about live data freshness or independent verification.
