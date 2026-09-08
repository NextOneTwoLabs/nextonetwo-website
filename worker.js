// Entry point for the deployed Worker. The site itself is the static files in public/ (see
// [assets] in wrangler.toml); this script exists only to send the workers.dev address and the
// bare apex to the canonical custom domain. It runs ahead of the static assets for "/" only
// (run_worker_first in wrangler.toml), so a page view costs one Worker request and every other
// file is served as a free static asset.
const CANONICAL_HOST = 'www.nextonetwo.com';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname.endsWith('.workers.dev') || url.hostname === 'nextonetwo.com') {
      url.hostname = CANONICAL_HOST;
      return Response.redirect(url.toString(), 301);
    }
    return env.ASSETS.fetch(request);
  },
};
