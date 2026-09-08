# NextOneTwo entrance page

> **Know More. Connect Better. Act Smarter.**

The entrance page for the NextOneTwo Project at **https://www.nextonetwo.com** — the slogan, direct
links to the two research tools, the three project stages, and a light/dark theme toggle.

NextOneTwo supports student-athletes with well-grounded information, personalized guidance, and
timely action, starting with girls' soccer in the U.S.

The slogan is also the roadmap. Each phrase is one stage of the project, and the page states plainly
which one is delivered today:

| Stage | Slogan phrase  | What it means         | Status          |
|-------|----------------|-----------------------|-----------------|
| 1     | Know More      | Organized information | Our focus today |
| 2     | Connect Better | Personalized guidance | Planned         |
| 3     | Act Smarter    | Timely action         | Planned         |

Stages 2 and 3 are presented as planned, never as available. This is a research project, non-profit
for now.

## Layout

    public/            the site — everything served, exactly as served
      index.html
      styles.css
      app.js
      assets/favicon.svg
    worker.js          redirects the workers.dev address and the bare apex to www
    wrangler.toml      Cloudflare Workers config

No build, packages, database, external fonts, analytics, accounts, or forms. The page is plain
HTML, CSS, and ten lines of JavaScript.

## Preview

Run `python -m http.server 4173 --bind 127.0.0.1 --directory public` and open
http://127.0.0.1:4173, or just open `public/index.html` in a browser. What you see locally is
byte-identical to what deploys.

## Deploy

Same setup as the sibling repos: a Cloudflare Worker whose static assets are `public/`.

    npx wrangler deploy

The custom domains are attached in the Cloudflare dashboard under **Settings -> Domains & Routes**:
`www.nextonetwo.com` as the canonical address, and `nextonetwo.com` so the apex reaches the Worker
and is redirected to www. `worker.js` runs ahead of the assets for `/` only, so a page view costs
one Worker request and every other file is served as a free static asset.

## Related repos

- [collegedash](https://github.com/NextOneTwoLabs/collegedash) — https://college.nextonetwo.com
- [ecnl-dashboard](https://github.com/NextOneTwoLabs/ecnl-dashboard) — https://ecnl.nextonetwo.com

Both tool links on the page open in the same tab; users can use standard browser controls to open a
new tab. The theme choice lasts for the current page visit and is not stored. No claims are made
about live data freshness or independent verification.
