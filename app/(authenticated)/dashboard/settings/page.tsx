import { auth } from "@clerk/nextjs/server"
import { db } from "@/db"
import { reportCategories } from "@/db/schema/reportCategories"
import { organizations } from "@/db/schema/organizations"
import { eq } from "drizzle-orm"
import { updateOrgSettings } from "@/src/server/services/settings"
import { addCategory, setCategoryActive } from "@/actions/categories"
import { Button } from "tweakcn/ui/button"

export default async function SettingsPage() {
  const { orgId: clerkOrgId } = await auth()
  if (!clerkOrgId) return null
  const { getDbOrgIdForClerkOrg } = await import("@/src/server/orgs")
  const orgId = await getDbOrgIdForClerkOrg(clerkOrgId)

  const categories = await db.query.reportCategories.findMany({ where: eq(reportCategories.orgId, orgId) })
  const org = await db.query.organizations.findFirst({ where: eq(organizations.id, orgId) })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Organization</h2>
        <form action={async (formData: FormData) => {
          "use server"
          const name = String(formData.get("name") || "").trim()
          const locale = String(formData.get("locale") || "pl-PL")
          const retention = Number(formData.get("retentionDays") || 365)
          const anonymousAllowed = !!formData.get("anonymousAllowed")
          const ackDays = Number(formData.get("ackDays") || 7)
          const feedbackMonths = Number(formData.get("feedbackMonths") || 3)
          await updateOrgSettings(orgId, { name, locale, retentionDays: retention, anonymousAllowed, ackDays, feedbackMonths })
        }} className="rounded border p-4 grid gap-3 text-sm">
          <div className="grid gap-1">
            <label className="text-muted-foreground">Name</label>
            <input name="name" defaultValue={org?.name || ""} className="rounded border px-2 py-1" />
          </div>
          <div className="grid gap-1">
            <label className="text-muted-foreground">Default language</label>
            <select name="locale" defaultValue={org?.locale || "pl-PL"} className="rounded border px-2 py-1 max-w-xs">
              <option value="en-US">English</option>
              <option value="pl-PL">Polski</option>
            </select>
          </div>
          <div className="grid gap-1 max-w-xs">
            <label className="text-muted-foreground">Retention (days)</label>
            <input type="number" name="retentionDays" defaultValue={org?.retentionDays || 365} className="rounded border px-2 py-1" />
          </div>
          <div className="grid gap-1 max-w-xs">
            <label className="text-muted-foreground">Acknowledge window (days)</label>
            <input type="number" name="ackDays" defaultValue={(org as any)?.ackDays ?? 7} className="rounded border px-2 py-1" />
          </div>
          <div className="grid gap-1 max-w-xs">
            <label className="text-muted-foreground">Feedback window (months)</label>
            <input type="number" name="feedbackMonths" defaultValue={(org as any)?.feedbackMonths ?? 3} className="rounded border px-2 py-1" />
          </div>
          <div className="flex items-center gap-2">
            <input id="anonymousAllowed" type="checkbox" name="anonymousAllowed" defaultChecked={org?.anonymousAllowed ?? true} className="rounded border" />
            <label htmlFor="anonymousAllowed" className="text-sm">Allow anonymous reports</label>
          </div>
          <div>
            <Button type="submit" className="px-3 py-2 text-sm" variant="primary" size="sm">
              Save
            </Button>
          </div>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Policy Documents</h2>
        <p className="text-sm text-muted-foreground">Templates to review with your compliance team.</p>
        <ul className="list-disc pl-5 text-sm space-y-1">
          <li><a className="text-primary underline" href="/docs/dpia" target="_blank" rel="noreferrer">DPIA Template</a></li>
          <li><a className="text-primary underline" href="/docs/retention" target="_blank" rel="noreferrer">Data Retention Policy</a></li>
          <li><a className="text-primary underline" href="/docs/incident-response" target="_blank" rel="noreferrer">Incident Response Plan</a></li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Categories</h2>
        <details className="rounded border p-4">
          <summary className="cursor-pointer text-sm font-medium">Add category</summary>
          <div className="mt-3">
            <form action={addCategory} className="flex gap-2 items-end">
              <div className="grid gap-1">
                <label className="text-xs text-muted-foreground">Name</label>
                <input name="name" className="rounded border px-2 py-1" placeholder="Category name" />
              </div>
              <Button type="submit" className="px-3 py-1 text-sm" variant="primary" size="sm">
                Save
              </Button>
            </form>
          </div>
        </details>
        <div className="rounded border">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-2">Name</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2 w-28"></th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="p-2">{c.name}</td>
                  <td className="p-2">{c.active ? "Active" : "Inactive"}</td>
                  <td className="p-2">
                    <form action={async () => { "use server"; await setCategoryActive(c.id, !c.active) }}>
                      <Button type="submit" className="px-2 py-1 text-xs" variant="outline" size="sm">
                        {c.active ? "Deactivate" : "Activate"}
                      </Button>
                    </form>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td className="p-4 text-muted-foreground" colSpan={3}>No categories yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}





