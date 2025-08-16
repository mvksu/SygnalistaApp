# Implementation Plan

## Project Scaffold & Conventions
- [x] Step 1: Initialize Next.js 15 SaaS skeleton
  - **Task**: Create app with TypeScript, Tailwind CSS v4, shadcn/ui, Framer Motion. Add base pages and alias paths.
  - **Files**:
    - `package.json`: add dependencies/scripts
    - `next.config.ts`: enable App Router & experimental flags as needed
    - `tsconfig.json`: path aliases, strict true
    - `tailwind.config.ts`: Tailwind v4 config
    - `postcss.config.js`: Tailwind plugin
    - `app/layout.tsx`: global providers/shell
    - `app/page.tsx`: landing placeholder
    - `components/ui/*`: shadcn init (button, input, textarea, dialog, alert, badge)
    - `styles/globals.css`: base styles
  - **Step Dependencies**: None
  - **User Instructions**: Initialize repo; run `npx create-next-app@latest`; install Tailwind v4, shadcn, Framer Motion per docs.

- [x] Step 2: Code quality & typesafe env
  - **Task**: Add ESLint, Prettier, simple commit hooks (Husky), and zod-based env validation.
  - **Files**:
    - `.eslintrc.cjs`, `.prettierrc`
    - `.husky/pre-commit`: run lint & typecheck
    - `src/lib/env.ts`: zod schema for `process.env`
  - **Step Dependencies**: Step 1
  - **User Instructions**: `npm i -D eslint prettier husky lint-staged zod @types/node`; run `npx husky init`.

## Auth, Multi-Tenancy, and RBAC
- [x] Step 3: Clerk integration (Organizations)
  - **Task**: Wire Clerk provider, middleware, and org selector. Add protected routes layout.
  - **Files**:
    - `middleware.ts`: Clerk middleware
    - `app/(app)/layout.tsx`: `<ClerkProvider/>` and session boundary
    - `app/(app)/dashboard/page.tsx`: placeholder authed page
    - `components/org-switcher.tsx`: Clerk org switch component
  - **Step Dependencies**: Step 1–2
  - **User Instructions**: Create Clerk app; enable Organizations; add `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`.

- [x] Step 4: Role model & guards
  - **Task**: Define roles (`ADMIN|HANDLER|AUDITOR`), simple hook/HOC to enforce page-level access.
  - **Files**:
    - `src/lib/authz.ts`: role constants, guards
    - `components/auth/require-role.tsx`: wrapper component
  - **Step Dependencies**: Step 3
  - **User Instructions**: In Clerk dashboard, add default org roles to match.

## Database & Migrations (Drizzle + Supabase)
- [x] Step 5: Drizzle setup
  - **Task**: Configure Drizzle with Postgres (Supabase for dev); add migration scripts.
  - **Files**:
    - `drizzle.config.ts`
    - `src/server/db/client.ts`: Postgres client
    - `src/server/db/index.ts`: Drizzle instance
    - `scripts/migrate.ts`: migration runner
  - **Step Dependencies**: Step 1–2
  - **User Instructions**: Create Supabase project (dev), get connection string; set `DATABASE_URL`. Install: `drizzle-orm drizzle-kit pg`.

- [x] Step 6: Core schema — orgs & membership
  - **Task**: Define `organizations`, `users`, `org_members`.
  - **Files**:
    - `src/server/db/schema/organizations.ts`
    - `src/server/db/schema/users.ts`
    - `src/server/db/schema/orgMembers.ts`
  - **Step Dependencies**: Step 5
  - **User Instructions**: Run `npm run db:migrate`.

- [x] Step 7: Reporting schema — categories & reports
  - **Task**: Define `report_categories`, `reports` (with fields for anonymous mode, receipt code, passphrase hash, due dates).
  - **Files**:
    - `src/server/db/schema/reportCategories.ts`
    - `src/server/db/schema/reports.ts`
  - **Step Dependencies**: Step 6
  - **User Instructions**: Migrate DB.

- [x] Step 8: Communication schema — messages & attachments
  - **Task**: Define `report_messages` and `attachments`.
  - **Files**:
    - `src/server/db/schema/reportMessages.ts`
    - `src/server/db/schema/attachments.ts`
  - **Step Dependencies**: Step 7
  - **User Instructions**: Migrate DB.

- [x] Step 9: Compliance schema — SLA, audit, exports
  - **Task**: Define `sla_events`, `audit_log`, `exports`.
  - **Files**:
    - `src/server/db/schema/sla.ts`
    - `src/server/db/schema/audit.ts`
    - `src/server/db/schema/exports.ts`
  - **Step Dependencies**: Step 8
  - **User Instructions**: Migrate DB.

## Security Utilities, Storage, and Uploads
- [x] Step 10: Encryption utilities (field-level)
  - **Task**: Implement AES-GCM helpers and per-org envelope key management.
  - **Files**:
    - `src/lib/crypto/encryption.ts`: encrypt/decrypt, random IV, auth tag
    - `src/lib/crypto/keys.ts`: derive/load per-org keys, rotation hooks
    - `src/lib/crypto/types.ts`: types
  - **Step Dependencies**: Step 6–9
  - **User Instructions**: Provide `APP_MASTER_KEY` (32 bytes base64). Rotate in prod via KMS later.

<!-- - [ ] Step 11: S3 storage client + upload flow
  - **Task**: Add S3/R2 client and presigned upload API. Limit file sizes; compute content hash.
  - **Files**:
    - `src/server/storage/s3.ts`: client and presign
    - `app/api/files/presign/route.ts`: POST for presigned URL
    - `src/lib/validation/upload.ts`: zod schema for file meta
  - **Step Dependencies**: Step 7–8
  - **User Instructions**: Create S3/R2 bucket; set `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`. -->

<!-- - [ ] Step 12: AV scanning hook (stub)
  - **Task**: Add AV status to attachments and a scan-callback route (to be triggered by your AV worker).
  - **Files**:
    - `app/api/files/scan-callback/route.ts`: POST to update `av_status`
    - `src/server/services/av.ts`: placeholder interface
  - **Step Dependencies**: Step 11
  - **User Instructions**: Stand up ClamAV (or vendor) and call scan-callback after scan; reject non-clean files. -->

- [x] Step 13: Anti-abuse (rate limit + CAPTCHA)
  - **Task**: Implement IP-based sliding window and Turnstile/hCaptcha in public intake.
  - **Files**:
    - `src/server/rate-limit.ts`: simple Redis-less in-memory dev limiter + adapter
    - `components/captcha.tsx`: widget wrapper
    - `src/lib/captcha.ts`: server verification helper
  - **Step Dependencies**: Step 1–2
  - **User Instructions**: Obtain Turnstile/hCaptcha keys; add envs.

## Public Intake & Reporter Inbox
- [ ] Step 14: Public report form UI
  - **Task**: Create `/report` wizard (category, text, attachments, optional contact).
  - **Files**:
    - `app/(public)/report/page.tsx`
    - `components/report/report-form.tsx`
    - `src/lib/validation/report.ts`: zod schema
  - **Step Dependencies**: Steps 7–13
  - **User Instructions**: None.

- [x] Step 15: Create report API + receipt generation
  - **Task**: Implement `POST /api/reports` to create report, encrypt sensitive fields, compute due dates, generate `receipt_code` & `passphrase`.
  - **Files**:
    - `app/api/reports/route.ts`
    - `src/server/services/reports.ts`: creation logic
    - `src/lib/ids.ts`: nanoid/ulid helpers for receipt
  - **Step Dependencies**: Step 10, Step 14
  - **User Instructions**: None.

- [x] Step 16: Receipt modal + printable view
  - **Task**: After submission, show one-time modal (receipt + passphrase) with option to print/save securely.
  - **Files**:
    - `components/report/receipt-modal.tsx`
    - `app/(public)/receipt/[code]/page.tsx`: read-only static tips
  - **Step Dependencies**: Step 15
  - **User Instructions**: None.

- [x] Step 17: Reporter secure inbox (unlock + thread)
  - **Task**: Build `/r/[receipt]` page; unlock with passphrase; fetch thread; post messages & attachments.
  - **Files**:
    - `app/(public)/r/[receipt]/page.tsx`
    - `app/api/inbox/[receipt]/auth/route.ts`: verify passphrase
    - `app/api/inbox/[receipt]/messages/route.ts`: GET/POST messages
    - `src/server/services/inbox.ts`
  - **Step Dependencies**: Step 15–16
  - **User Instructions**: None.

## Back-Office (Handlers & Admins)
- [x] Step 18: App shell & navigation for dashboard
  - **Task**: Create `(app)` layout with sidebar/topbar; org switch; role-aware nav.
  - **Files**:
    - `app/(app)/layout.tsx`
    - `components/app/sidebar.tsx`
    - `components/app/topbar.tsx`
  - **Step Dependencies**: Step 3–4
  - **User Instructions**: None.

- [x] Step 19: Case list with filters & SLA badges
  - **Task**: Implement `/dashboard/cases` grid/filter; show ack/feedback due chips.
  - **Files**:
    - `app/(app)/dashboard/cases/page.tsx`
    - `src/server/services/cases.ts`: list/query functions
    - `components/cases/case-table.tsx`
  - **Step Dependencies**: Step 7, Step 9, Step 18
  - **User Instructions**: None.

- [ ] Step 20: Case view (thread, actions, status)
  - **Task**: Implement `/dashboard/cases/[id]` view: message thread, acknowledge/feedback buttons, add follow-up actions, attachments, audit write.
  - **Files**:
    - `app/(app)/dashboard/cases/[id]/page.tsx`
    - `app/api/reports/[id]/acknowledge/route.ts`
    - `app/api/reports/[id]/feedback/route.ts`
    - `app/api/reports/[id]/messages/route.ts`
    - `src/server/services/audit.ts`
  - **Step Dependencies**: Step 17, Step 19
  - **User Instructions**: None.

## SLA Engine & Notifications
- [x] Step 21: SLA scheduler endpoint
  - **Task**: Add `/api/cron/sla` to compute/mark due events and queue notifications; secure with header token.
  - **Files**:
    - `app/api/cron/sla/route.ts`
    - `src/server/services/sla.ts`
  - **Step Dependencies**: Step 9, Step 20
  - **User Instructions**: Configure Vercel (or cron) to call hourly with `CRON_SECRET`.

<!-- - [ ] Step 22: Email notifications (ack/feedback)
  - **Task**: Add Resend mailer with templates; only send if reporter provided contact.
  - **Files**:
    - `src/server/notify/mailer.ts`
    - `src/server/notify/templates/acknowledge.tsx`
    - `src/server/notify/templates/feedback.tsx`
  - **Step Dependencies**: Step 21
  - **User Instructions**: Set `RESEND_API_KEY` (or other provider); verify domain/sender. -->

## Register, Exports, and Audit
- [x] Step 23: Register view + filters
  - **Task**: Implement `/dashboard/register` listing required columns, filters, and status.
  - **Files**:
    - `app/(app)/dashboard/register/page.tsx`
    - `src/server/services/register.ts`
  - **Step Dependencies**: Step 19–20
  - **User Instructions**: None.

- [x] Step 24: CSV/PDF export + monthly snapshot
  - **Task**: Export current filtered register to CSV/PDF; scheduled monthly snapshot with checksum recorded in `exports`.
  - **Files**:
    - `app/api/register/export/route.ts`
    - `src/server/services/exports.ts`
    - `app/api/cron/snapshot/route.ts`
  - **Step Dependencies**: Step 23, Step 21
  - **User Instructions**: Add cron for `/api/cron/snapshot` monthly.

## Org Settings & Policy Pack
- [ ] Step 25: Settings UI (categories, retention, anonymous toggle)
  - **Task**: Build `/dashboard/settings` with forms to configure categories, retention days, anonymous toggle, and email templates.
  - **Files**:
    - `app/(app)/dashboard/settings/page.tsx`
    - `src/server/services/settings.ts`
    - `components/settings/*`
  - **Step Dependencies**: Step 6–7, Step 18
  - **User Instructions**: None.

- [ ] Step 26: Downloadable policy pack
  - **Task**: Serve static policy templates (procedures, privacy notices) with org merge fields.
  - **Files**:
    - `app/(app)/dashboard/settings/policies/page.tsx`
    - `src/server/services/policies.ts`
  - **Step Dependencies**: Step 25
  - **User Instructions**: Edit templates to your jurisdictional flavor before production.

## Billing (Stripe)
<!-- - [ ] Step 27: Plan gating and Stripe checkout
  - **Task**: Add plans (Basic/Pro/Business), checkout page, server verification of entitlements.
  - **Files**:
    - `app/(app)/billing/page.tsx`
    - `src/server/billing/plans.ts`
    - `app/api/billing/checkout/route.ts`
  - **Step Dependencies**: Step 6, Step 18
  - **User Instructions**: Set `STRIPE_PRICE_*` envs; create products/prices in Stripe. -->

<!-- - [ ] Step 28: Stripe webhooks & lifecycle
  - **Task**: Handle `checkout.session.completed`, `customer.subscription.updated|deleted`; update `organizations.plan` and feature gates.
  - **Files**:
    - `app/api/stripe/webhook/route.ts`
    - `src/server/billing/webhooks.ts`
  - **Step Dependencies**: Step 27
  - **User Instructions**: `stripe listen --forward-to localhost:3000/api/stripe/webhook` in dev; set webhook secret in env. -->

<!-- ## Security Hardening & Compliance Features
- [ ] Step 29: Security headers, CSP, and 2FA enforcement
  - **Task**: Add strict CSP, HSTS, referrer policy; enforce 2FA for handler roles via Clerk.
  - **Files**:
    - `next.config.ts`: headers
    - `src/lib/security.ts`: CSP utility
    - `components/auth/2fa-gate.tsx`
  - **Step Dependencies**: Step 3–4
  - **User Instructions**: Enable MFA in Clerk dashboard; require for org roles. -->

- [ ] Step 30: Platform admin read-isolation
  - **Task**: Ensure no platform administrator can read case contents; add break-glass path that logs explicit consent.
  - **Files**:
    - `src/server/services/access.ts`
    - `src/server/services/audit.ts` (update with break-glass events)
  - **Step Dependencies**: Step 20
  - **User Instructions**: Limit DB access in prod; review DPA with sub-processors.

## Internationalization & UX polish
- [x] Step 31: i18n scaffolding (en/pl)
  - **Task**: Minimal i18n for public intake and system notices.
  - **Files**:
    - `src/i18n/config.ts`
    - `src/i18n/en.json`
    - `src/i18n/pl.json`
    - wrappers in `app/layout.tsx`
  - **Step Dependencies**: Step 14–17
  - **User Instructions**: Translate strings as needed.

- [ ] Step 32: Microinteractions (Framer Motion) & accessibility pass
  - **Task**: Add subtle animations (receipt reveal, success toasts) and run an A11y checklist.
  - **Files**:
    - `components/report/receipt-modal.tsx` (enhance)
    - `components/ui/animated-*`
  - **Step Dependencies**: Step 16
  - **User Instructions**: Use Lighthouse/AXE to verify WCAG 2.2 AA.

## Testing Strategy
- [x] Step 33: Unit tests (Vitest) for utils
  - **Task**: Tests for crypto, ids, validation.
  - **Files**:
    - `vitest.config.ts`
    - `lib/crypto/encryption.test.ts`
    - `lib/validation/report.test.ts`
    - `lib/ids.test.ts`
  - **Step Dependencies**: Steps 10, 14
  - **User Instructions**: `npm i -D vitest @testing-library/react @testing-library/jest-dom`.

- [x] Step 34: Integration tests for API routes
  - **Task**: Spin up test DB; test report creation, inbox auth, message post; mock Clerk.
  - **Files**:
    - `tests/api/reports.spec.ts`
    - `tests/api/inbox.spec.ts`
    - `tests/setup/test-db.ts`
  - **Step Dependencies**: Steps 15, 17
  - **User Instructions**: Provide `TEST_DATABASE_URL`; run migrations before tests.

- [ ] Step 35: E2E tests (Playwright)
  - **Task**: Happy-path: submit report → save receipt → unlock inbox → handler acknowledges → feedback.
  - **Files**:
    - `playwright.config.ts`
    - `tests/e2e/reporting.spec.ts`
    - `tests/e2e/fixtures.ts`
  - **Step Dependencies**: Steps 14–22
  - **User Instructions**: `npm i -D @playwright/test`; run `npx playwright install`.

## Seed, Fixtures, and Docs
- [ ] Step 36: Seed scripts & fixtures
  - **Task**: Seed org, members, categories; sample reports for demos.
  - **Files**:
    - `scripts/seed.ts`
    - `src/server/db/fixtures.ts`
  - **Step Dependencies**: Step 6–9
  - **User Instructions**: `npm run seed` with dev DB.

- [ ] Step 37: DevOps & deployment configuration
  - **Task**: Vercel project settings, runtime envs, cron configs, image domains, build commands.
  - **Files**:
    - `vercel.json`
    - `README.md`: env table, setup steps, runbook
  - **Step Dependencies**: All previous
  - **User Instructions**: Add envs in Vercel; set cron for `/api/cron/sla` and `/api/cron/snapshot`; connect custom domain.

- [ ] Step 38: DPIA checklist & “legal pack” stubs
  - **Task**: Add markdown docs for DPIA, retention policy, incident response; link from settings.
  - **Files**:
    - `docs/dpia.md`
    - `docs/retention.md`
    - `docs/incident-response.md`
  - **Step Dependencies**: Step 25–26
  - **User Instructions**: Review with counsel; adapt to your org.

