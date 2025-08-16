import { auth } from "@clerk/nextjs/server"
import { db } from "@/db"
import { reportCategories } from "@/db/schema/reportCategories"
import { organizations } from "@/db/schema/organizations"
import { eq } from "drizzle-orm"
import { updateOrgSettings } from "@/src/server/services/settings"

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
          await updateOrgSettings(orgId, { name, locale, retentionDays: retention })
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
          <div>
            <button type="submit" className="rounded bg-primary px-3 py-2 text-sm text-primary-foreground">Save</button>
          </div>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Categories</h2>
        <div className="rounded border">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-2">Name</th>
                <th className="text-left p-2">Description</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="p-2">{c.name}</td>
                  <td className="p-2">{c.description || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}





