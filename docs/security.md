# Security Headers

The application sets a standard set of HTTP security headers in `middleware.ts`:

- **Content-Security-Policy** restricts resource loading to trusted origins. Allowed services:
  - Clerk domains (`*.clerk.com`, `*.clerk.dev`, `*.clerk.services`)
  - Supabase instances (`*.supabase.co`)
  - Stripe (`js.stripe.com`, `api.stripe.com`, `hooks.stripe.com`)

  ```
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://js.stripe.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data:;
  connect-src 'self' https://*.clerk.com https://*.clerk.dev https://*.clerk.services https://*.supabase.co https://api.stripe.com;
  frame-src 'self' https://js.stripe.com https://hooks.stripe.com;
  ```
- **Strict-Transport-Security**: `max-age=63072000; includeSubDomains; preload`
- **X-Frame-Options**: `DENY`
- **Referrer-Policy**: `no-referrer`
- **X-Content-Type-Options**: `nosniff`

Together these headers harden the app against clickjacking, content injection and other web threats.
