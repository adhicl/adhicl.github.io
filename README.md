# YourFavoriteGameStudio website

Plain HTML/CSS/JS static site. No build step, no dependencies.

## Deploy

Hosted on **GitHub Pages** (this repo), with **Cloudflare** in proxy mode
in front of it for security (WAF/DDoS protection) and analytics — Cloudflare
is not used as the hosting platform itself, just as a DNS/reverse-proxy
layer. The custom domain is wired up via the `CNAME` file at the repo root.

1. Push changes to the `main` branch — GitHub Pages serves directly from it (Settings → Pages → Source = `main`).
2. DNS for `yourfavoritegamestudio.com` is delegated to Cloudflare, proxying to GitHub Pages.
3. No build step — GitHub Pages serves the static files as-is.

See [SECURITY.md](SECURITY.md) for the security headers (applied at the
Cloudflare edge, since GitHub Pages can't serve custom headers) and the
account/DNS hardening checklist.

## Editing

- **Text/links**: edit `index.html` directly — each section (hero, about, games, connect) is plain HTML.
- **Colors/fonts**: edit the CSS variables at the top of `css/style.css` (`--color-primary`, `--font-heading`, etc.).
- **Images**: replace files in `assets/` and keep the same filenames, or update the `src`/`href` in `index.html` if you rename them.
- **Game trailers**: each game card embeds a YouTube video by ID in `index.html` (`youtube-nocookie.com/embed/<id>`) — swap the ID to change the video.
