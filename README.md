# NextOneTwo entrance page

The entrance page for the NextOneTwo Project at **https://www.nextonetwo.com** — a project
introduction, direct links to the two research tools, the current information stage alongside the
planned guidance and action stages, and a light/dark theme toggle.

NextOneTwo supports student-athletes with well-grounded, organized information, customized and
specialized guidance, and timely action recommendations. The project is currently in the
information stage, starting with girls' soccer in the U.S.; guidance and action recommendations are
presented as planned. The name represents the next action, connection, play, and breakthrough
toward winning, success, growth, and learning.

This is a research project, non-profit for now.

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
