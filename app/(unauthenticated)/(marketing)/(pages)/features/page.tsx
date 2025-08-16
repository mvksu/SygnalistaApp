export default function FeaturesPage() {
  return (
    <main className="min-h-screen">
      <section className="bg-background border-b">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Features</h1>
            <p className="text-muted-foreground mt-4 text-lg">
              Everything you need to run a trustworthy, compliant internal reporting channel.
            </p>
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Secure Intake Portal",
                body:
                  "Public form with attachments, CAPTCHA, and anonymous‑friendly defaults. Generates a receipt code and passphrase for a private inbox.",
              },
              {
                title: "Two‑Way Secure Inbox",
                body:
                  "Threaded messaging between reporters and handlers. Identities protected; all messages encrypted at rest.",
              },
              {
                title: "SLA Timers & Banners",
                body:
                  "Automated timers for 7‑day acknowledgement and 3‑month feedback, with visible status chips and reminders.",
              },
              {
                title: "Register & Audit Trail",
                body:
                  "Tamper‑evident register, monthly snapshots with checksums, and full audit events for inspections.",
              },
              {
                title: "Org Settings & Policy Pack",
                body:
                  "Configure categories, retention days, anonymous toggle, locales, and download procedure templates.",
              },
              {
                title: "Multi‑Tenancy & Roles",
                body:
                  "Clerk Organizations with Admin/Handler/Auditor roles and least‑privilege access.",
              },
              {
                title: "File Uploads with AV",
                body:
                  "S3‑compatible storage, presigned uploads, and antivirus scanning pipeline.",
              },
              {
                title: "Payments & Plans",
                body:
                  "Stripe subscriptions (Basic/Pro/Business). Feature gates enforced in UI and API.",
              },
              {
                title: "Internationalization & A11y",
                body:
                  "Multilingual UI and accessibility best practices so everyone can report confidently.",
              },
            ].map(({ title, body }) => (
              <div key={title} className="rounded-lg border bg-background p-6">
                <div className="text-base font-semibold">{title}</div>
                <p className="text-muted-foreground mt-2 text-sm leading-6">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Insights-like panel */}
      <section>
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-accent/20 px-6 py-14 lg:px-8">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-gradient-to-br from-background/40 to-transparent blur-2xl" />
            <div className="absolute -right-24 top-10 h-[28rem] w-[28rem] rounded-full bg-gradient-to-tr from-background/30 to-transparent blur-3xl" />
            <div className="absolute left-1/2 top-0 h-[22rem] w-[22rem] -translate-x-1/2 rounded-full bg-gradient-to-b from-background/50 to-transparent blur-3xl" />
          </div>

          <div className="relative z-10 text-center">
            <h2 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl">
              Empower Your People to Speak Up
            </h2>
            <p className="text-muted-foreground mx-auto mt-3 max-w-3xl">
              Give employees a safe, anonymous way to report misconduct—stay compliant, reduce
              turnover, and protect your reputation.
            </p>
          </div>

          <div className="relative z-10 mt-10 grid grid-cols-1 items-start gap-10 text-center sm:grid-cols-3">
            <div className="space-y-2">
              <div className="text-4xl font-bold tracking-tight sm:text-5xl">20%</div>
              <p className="text-muted-foreground mx-auto max-w-xs text-sm">
                Reduction in employee turnover after adopting anonymous reporting
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold tracking-tight sm:text-5xl">4x</div>
              <p className="text-muted-foreground mx-auto max-w-xs text-sm">
                More issues reported and innovative ideas shared
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold tracking-tight sm:text-5xl">10×</div>
              <p className="text-muted-foreground mx-auto max-w-xs text-sm">
                More effective at detecting misconduct and fraud early
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
          <div className="grid gap-8 md:grid-cols-2">
            <div className="rounded-lg border bg-background p-6">
              <h2 className="text-xl font-semibold">Security & Privacy</h2>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>• Field‑level encryption (AES‑GCM) for sensitive text</li>
                <li>• Per‑organization envelope keys and rotation hooks</li>
                <li>• AV scanning for files; metadata minimization in public flows</li>
                <li>• Strict roles and detailed audit logging</li>
              </ul>
            </div>
            <div className="rounded-lg border bg-background p-6">
              <h2 className="text-xl font-semibold">Compliance & Operations</h2>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>• SLA timers for EU directive deadlines (7 days / 3 months)</li>
                <li>• Register and monthly snapshots with checksums</li>
                <li>• Policy pack with procedures and privacy notices</li>
                <li>• Reporting and export options for inspections</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t">
        <div className="mx-auto max-w-7xl px-6 py-14 text-center lg:px-8">
          <h2 className="text-2xl font-semibold">Start with the intake portal</h2>
          <p className="text-muted-foreground mx-auto mt-2 max-w-2xl">
            Submit a demo report and receive a one‑time receipt + passphrase to access a private inbox.
          </p>
          <div className="mt-6 flex items-center justify-center gap-4">
            <a href="/report" className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
              Try it now
            </a>
            <a href="/contact" className="rounded-md border px-5 py-2.5 text-sm font-semibold">
              Talk to us
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}

