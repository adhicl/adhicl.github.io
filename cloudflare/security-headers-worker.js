// Reference implementation of the site's HTTP security headers.
// NOT the primary enforcement mechanism (see ../SECURITY.md) — the primary
// mechanism is a Cloudflare Transform Rule configured in the dashboard,
// because this is a solo-maintained static site with no CI/CD pipeline,
// and a buggy Worker/route can take the entire site down (Error 1101),
// whereas a Transform Rule is pure declarative config with no execution
// risk and no extra API-token secret to manage.
//
// Kept here as a versioned reference for the exact header values, and as
// a ready-to-deploy fallback if the header set ever needs conditional
// logic that Transform Rules can't express (e.g. per-path CSP).
//
// If you do deploy this: create a Worker, bind a route
// (yourfavoritegamestudio.com/*), and DISABLE the Transform Rule described
// in SECURITY.md to avoid duplicate/conflicting headers.

const CSP = [
  "default-src 'self'",
  "script-src 'self'", // TODO: add https://static.cloudflareinsights.com when Cloudflare Web Analytics is enabled
  "style-src 'self' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data:",
  "frame-src https://www.youtube-nocookie.com",
  "connect-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com", // TODO: add https://cloudflareinsights.com when Cloudflare Web Analytics is enabled
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join('; ');

const PERMISSIONS_POLICY = [
  'accelerometer=(self "https://www.youtube-nocookie.com")',
  'autoplay=(self "https://www.youtube-nocookie.com")',
  'clipboard-write=(self "https://www.youtube-nocookie.com")',
  'encrypted-media=(self "https://www.youtube-nocookie.com")',
  'gyroscope=(self "https://www.youtube-nocookie.com")',
  'picture-in-picture=(self "https://www.youtube-nocookie.com")',
  'fullscreen=(self "https://www.youtube-nocookie.com")',
  'camera=()', 'microphone=()', 'geolocation=()', 'payment=()', 'usb=()',
  'magnetometer=()', 'midi=()', 'interest-cohort=()',
].join(', ');

export default {
  async fetch(request) {
    const response = await fetch(request);
    const headers = new Headers(response.headers);

    headers.set('Content-Security-Policy', CSP);
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    headers.set('Permissions-Policy', PERMISSIONS_POLICY);
    headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains');
    headers.set('X-Frame-Options', 'DENY');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
};
