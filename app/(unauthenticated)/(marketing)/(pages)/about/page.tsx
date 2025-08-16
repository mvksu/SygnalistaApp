export default function AboutPage() {
  return (
    <main className="min-h-screen">
      <section className="bg-background border-b">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">About Signalista</h1>
            <p className="text-muted-foreground mt-4 text-lg">
              A modern, compliant whistleblowing platform designed for Polish/EU organizations. Secure intake, two-way inbox,
              SLA reminders, register and audit trail — everything you need to run an internal reporting channel with confidence.
            </p>
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-lg border p-6">
              <div className="text-xs uppercase text-muted-foreground">Mission</div>
              <h2 className="mt-2 text-xl font-semibold">Build trust through confidentiality</h2>
              <p className="text-muted-foreground mt-2">
                We help companies make it safe and simple to speak up. Signalista focuses on anonymity, clarity,
                and verifiable deadlines so your team can handle reports quickly and responsibly.
              </p>
            </div>
            <div className="rounded-lg border p-6">
              <div className="text-xs uppercase text-muted-foreground">Compliance</div>
              <h2 className="mt-2 text-xl font-semibold">Aligned to EU Directive & Polish law</h2>
              <p className="text-muted-foreground mt-2">
                Core flows match legal expectations: acknowledgement within 7 days, feedback within 3 months, and a
                tamper-evident register of cases and actions. Anonymous intake is supported by default.
              </p>
            </div>
            <div className="rounded-lg border p-6">
              <div className="text-xs uppercase text-muted-foreground">Security</div>
              <h2 className="mt-2 text-xl font-semibold">Encryption and least-privilege access</h2>
              <p className="text-muted-foreground mt-2">
                Field-level encryption for sensitive text, per-organization envelope keys, AV scans for files,
                strict roles, and audit logs for every critical action.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-semibold">What you get</h2>
            <p className="text-muted-foreground mt-2">
              Practical tools to meet legal obligations and build a culture of trust.
            </p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Secure Intake Portal",
                body:
                  "Public web form with attachments, CAPTCHA, and anonymous-friendly defaults. Generates receipt code + passphrase.",
              },
              {
                title: "Two‑Way Secure Inbox",
                body:
                  "Threaded conversations between reporters and handlers without exposing identities.",
              },
              {
                title: "SLA Timers",
                body:
                  "Automated due dates and banners for 7‑day acknowledgement and 3‑month feedback.",
              },
              {
                title: "Register & Audit Trail",
                body:
                  "Tamper‑evident register, monthly snapshots, and detailed audit events for inspections.",
              },
              {
                title: "Org Settings & Policy Pack",
                body:
                  "Categories, retention, anonymous toggle, and downloadable policy templates for your procedures.",
              },
              {
                title: "Multi‑Tenancy & Billing",
                body:
                  "Clerk Organizations for roles, Stripe subscriptions, and plan‑based feature gates.",
              },
            ].map(({ title, body }) => (
              <div key={title} className="rounded-lg border bg-background p-5">
                <div className="font-semibold">{title}</div>
                <p className="text-muted-foreground mt-2 text-sm leading-6">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
          <div className="grid gap-8 md:grid-cols-2">
            <div className="rounded-lg border p-6">
              <h3 className="text-xl font-semibold">Designed for real‑world operations</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>• Clear roles: Admin, Handler, Auditor</li>
                <li>• No‑leak UI: handler identities hidden from reporters</li>
                <li>• AV scanning pipeline for file uploads</li>
                <li>• Data residency and export options for audits</li>
              </ul>
            </div>
            <div className="rounded-lg border p-6">
              <h3 className="text-xl font-semibold">Technology choices you can trust</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>• Next.js + React for a fast, accessible UI</li>
                <li>• Postgres + Drizzle for a reliable, typed data layer</li>
                <li>• Clerk for organizations, roles, and 2FA enforcement</li>
                <li>• Stripe for subscriptions and plan management</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t">
        <div className="mx-auto max-w-7xl px-6 py-14 text-center lg:px-8">
          <h2 className="text-2xl font-semibold">Ready to see it in action?</h2>
          <p className="text-muted-foreground mx-auto mt-2 max-w-2xl">
            Try the intake flow and receive a receipt + passphrase. You’ll be able to unlock a secure inbox and continue the conversation.
          </p>
          <div className="mt-6 flex items-center justify-center gap-4">
            <a href="/report" className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
              Submit a report
            </a>
            <a href="/contact" className="rounded-md border px-5 py-2.5 text-sm font-semibold">
              Contact sales
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}

