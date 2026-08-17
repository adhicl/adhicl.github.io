# Security

This is a static brochure site (no server, no forms, no login, no user data
collected by us directly). The real attack surface for "defacement" is
account takeover — GitHub, Cloudflare, or GoDaddy (registrar) — not
application code. This doc is the working checklist for all four areas:
headers, GitHub, Cloudflare, GoDaddy/DNS, and repo hygiene.

## 1. HTTP security headers

GitHub Pages can't serve custom response headers, so these are applied at
Cloudflare (edge, in front of GitHub Pages). Primary mechanism: a
**Cloudflare Transform Rule** (Rules → Overview → Create rule → Response
Header Transform Rule), matching the zone's hostname(s), setting each
header below as a static header. `cloudflare/security-headers-worker.js`
is kept in-repo as a versioned reference/fallback only — see that file for
why it isn't the primary mechanism. If you ever change one, mirror the
change into the other.

```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; frame-src https://www.youtube-nocookie.com; connect-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'; upgrade-insecure-requests
```
`connect-src` includes the two Google Fonts origins so `<link rel=preconnect>`
doesn't throw benign CSP console warnings.

**TODO** once Cloudflare Web Analytics is enabled, append to the CSP:
- `script-src`: add `https://static.cloudflareinsights.com`
- `connect-src`: add `https://cloudflareinsights.com`

```
Referrer-Policy: strict-origin-when-cross-origin

Permissions-Policy: accelerometer=(self "https://www.youtube-nocookie.com"), autoplay=(self "https://www.youtube-nocookie.com"), clipboard-write=(self "https://www.youtube-nocookie.com"), encrypted-media=(self "https://www.youtube-nocookie.com"), gyroscope=(self "https://www.youtube-nocookie.com"), picture-in-picture=(self "https://www.youtube-nocookie.com"), fullscreen=(self "https://www.youtube-nocookie.com"), camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), midi=(), interest-cohort=()

X-Frame-Options: DENY
```
(belt-and-suspenders alongside `frame-ancestors 'none'` for older browsers)

`Strict-Transport-Security` and `X-Content-Type-Options: nosniff` — apply
via Cloudflare's **native** SSL/TLS → Edge Certificates toggles (HSTS
section; "No-Sniff Header" checkbox) instead of a Transform Rule — simpler
and self-documenting in the dashboard.

**Optional extra caution**: Cloudflare Transform Rules support pairing with
a Report-Only rollout. Not required here since the site's resource
inventory is small and fully audited (see below), but worth doing if you
want a safety net before enforcing.

### Resource inventory the CSP is built from
- Scripts: local `js/main.js` only, no inline `<script>` anywhere in the site.
- Styles: local `css/style.css` + Google Fonts stylesheet, no inline `style=`.
- Fonts: `fonts.gstatic.com`.
- Frames: three YouTube trailers via `youtube-nocookie.com/embed/...` (index.html only).
- Forms: none, anywhere.
- No secrets/API keys anywhere in the repo.

## 2. GitHub account hardening

- [ ] 2FA via authenticator app or hardware key (not SMS)
- [ ] Store recovery codes offline; verify recovery email is current
- [ ] Settings → Sessions / Authorized OAuth Apps / Authorized GitHub Apps — revoke anything unrecognized
- [ ] Review/revoke unused Personal Access Tokens; prefer fine-grained, expiring tokens
- [ ] Settings → Pages → "Verify domain" for yourfavoritegamestudio.com — adds a TXT record proving ownership, so nobody else can claim the domain on a different repo if the `CNAME` file is ever removed
- [ ] Branch protection on `main` (block force-push/deletion) even solo — protects against a compromised session/token silently rewriting history
- [ ] Confirm Pages "Source" is set to `main`, not `dev`

## 3. Cloudflare account hardening

- [ ] 2FA (authenticator/hardware key)
- [ ] Use scoped API Tokens only — never the legacy Global API Key
- [ ] Periodically check the Audit Log (available on the free plan) for login/config changes
- [ ] SSL/TLS → Overview: mode = **Full (strict)** — never Flexible
- [ ] SSL/TLS → Edge Certificates: Always Use HTTPS = on; HSTS enabled (start with a shorter max-age, e.g. 6–12 months, ramp up once confirmed safe); TLS 1.3 on; Minimum TLS Version 1.2; "No-Sniff Header" toggle = on

## 4. GoDaddy / DNS / registrar hardening

GoDaddy remains the domain registrar even after hosting moves to GitHub
Pages — registrar takeover is "defacement without touching any code."

- [ ] 2FA on the GoDaddy account; unique strong password
- [ ] Enable Domain Lock (transfer lock)
- [ ] Verify recovery email/phone are current and owned by you
- [ ] WHOIS privacy enabled
- [ ] Auto-renew on + payment method valid (an expired domain is an instant drop-catch/defacement risk)
- [ ] DNSSEC: enable in Cloudflare DNS (after nameservers are delegated to Cloudflare), copy the generated DS record, add it under GoDaddy's domain DNSSEC settings
- [ ] CAA records (in Cloudflare DNS, after the zone is active) — restrict which CAs may issue certs for the domain. Check the current CA under Cloudflare's SSL/TLS → Edge Certificates → Certificate Authority first, then add records like:
  ```
  yourfavoritegamestudio.com. CAA 0 issue "letsencrypt.org"
  yourfavoritegamestudio.com. CAA 0 issue "pki.goog"
  yourfavoritegamestudio.com. CAA 0 issuewild ";"
  ```
  (verify the actual issuing CA(s) before locking this in — don't just copy the above blind)

## 5. Repo hygiene

- [x] Deleted `site/_nul` (untracked accidental duplicate of `app-ads.txt`, from a Windows `> NUL` redirect mishap)
- [x] `.gitignore` updated with `_nul`/`nul`/`NUL` patterns to stop this recurring
- [ ] (Outside the repo, optional/cosmetic) the GoDaddy-era snapshot one level above `site/` (`Home.html`, `Home_files/`, duplicate `index.html`/`app-ads.txt`) is untracked and unreachable by git — safe to delete or archive whenever convenient, not a security requirement
- [x] `README.md` deploy section updated to reflect GitHub Pages + Cloudflare instead of the old Cloudflare Pages drag-and-drop flow

## 6. Google OAuth consent screen / brand verification (Jajanan)

Requirements per Google's own checklist
(support.google.com/cloud/answer/13807376): the app homepage must identify
the app/brand, fully describe functionality, explain why user data is
requested, be visible with no login wall, be hosted on a domain **you've
verified you own**, and link to a Privacy Policy that matches the one on
the consent screen exactly. `jajanan/index.html` covers the content side
of this; the following is account-side setup only you can do:

- [ ] Google Cloud Console → OAuth consent screen → **Authorized domains**: add `yourfavoritegamestudio.com`
- [ ] **Verify domain ownership** in [Google Search Console](https://search.google.com/search-console) (Settings → add the domain as a property → verify via DNS TXT record — straightforward once DNS is on Cloudflare, since you'll already be adding CAA/DNSSEC records there)
- [ ] Set **Application Home Page URL** = `https://yourfavoritegamestudio.com/jajanan/` — use this exact form (with the trailing slash) consistently everywhere it's entered
- [ ] Set **Privacy Policy URL** = `https://yourfavoritegamestudio.com/privacy-policy.html` — must be the literal string-for-string URL used, since Google checks it matches the link actually on the page
- [ ] Before submitting for review, confirm there's **no redirect chain**: `curl -IL https://yourfavoritegamestudio.com/jajanan/` should return a single `200`, not a chain of redirects to a different host/path (e.g. to the bare `adhicl.github.io` domain, or `http→https` landing somewhere unexpected) — Google explicitly rejects apps where "the homepage linked on your consent screen" doesn't match what's presented in-browser
- [ ] Confirm the GitHub repo backing Pages is **public** — GitHub Pages' free tier requires it, and a private repo would make the homepage effectively login-gated from Google's crawler even though the rendered page has no auth wall
- [ ] Sanity-check the homepage in an incognito window (or `curl`) to confirm it's reachable with zero cookies/session state

## 7. security.txt

Published at `/.well-known/security.txt` (RFC 9116) — gives a direct
responsible-disclosure contact instead of a stranger having to guess or
publicly disclose an issue. Update the `Expires` date annually.

## Verification

Once the site is live behind Cloudflare:

```
curl -I https://yourfavoritegamestudio.com/
curl -I https://yourfavoritegamestudio.com/privacy-policy.html
```

Confirm `content-security-policy`, `x-content-type-options`,
`referrer-policy`, `permissions-policy`, `strict-transport-security`, and
`x-frame-options` are all present with the values above. Cross-check with
securityheaders.com (target A/A+) and ssllabs.com (TLS grade).

Then do a functional/CSP regression pass in a real browser with DevTools
console open, on all three pages:
- [ ] Hamburger nav toggle opens/closes the menu
- [ ] All three YouTube trailer embeds load and play
- [ ] Google Fonts render as Fredoka One / Poppins, not a system-font fallback
- [ ] Footer copyright year populates
- [ ] Zero CSP violation errors in the console
- [ ] Outbound links (itch.io, Google Play, Steam, social icons) still open correctly

After enabling Cloudflare Web Analytics, re-check the console specifically
for `cloudflareinsights.com` CSP errors to confirm the TODO extension above
was applied correctly.
