import { auth } from "@clerk/nextjs/server"
import { db } from "@/db"
import { reportCategories } from "@/db/schema/reportCategories"
import { organizations } from "@/db/schema/organizations"
import { eq } from "drizzle-orm"
import { updateOrgSettings } from "@/src/server/services/settings"
import { addCategory, setCategoryActive } from "@/actions/categories"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"


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

        <form
          action={async (formData: FormData) => {
            "use server"
            const name = String(formData.get("name") || "").trim()
            const locale = String(formData.get("locale") || "pl-PL")
            const retention = Number(formData.get("retentionDays") || 365)
            const anonymousAllowed = !!formData.get("anonymousAllowed")
            const ackDays = Number(formData.get("ackDays") || 7)
            const feedbackMonths = Number(formData.get("feedbackMonths") || 3)
            await updateOrgSettings(orgId, {
              name,
              locale,
              retentionDays: retention,
              anonymousAllowed,
              ackDays,
              feedbackMonths,
            })
          }}
        >
          <Card className="grid gap-3 text-sm">
            <CardContent className="grid gap-3">
              <div className="grid gap-1">
                <Label className="text-muted-foreground">Name</Label>
                <Input name="name" defaultValue={org?.name || ""} />
              </div>
              <div className="grid gap-1">
                <Label className="text-muted-foreground">Default language</Label>
                <Select name="locale" defaultValue={org?.locale || "pl-PL"}>
                  <SelectTrigger className="max-w-xs">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en-US">English</SelectItem>
                    <SelectItem value="pl-PL">Polski</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1 max-w-xs">
                <Label className="text-muted-foreground">Retention (days)</Label>
                <Input
                  type="number"
                  name="retentionDays"
                  defaultValue={org?.retentionDays || 365}
                />
              </div>
              <div className="grid gap-1 max-w-xs">
                <Label className="text-muted-foreground">Acknowledge window (days)</Label>
                <Input
                  type="number"
                  name="ackDays"
                  defaultValue={(org as any)?.ackDays ?? 7}
                />
              </div>
              <div className="grid gap-1 max-w-xs">
                <Label className="text-muted-foreground">Feedback window (months)</Label>
                <Input
                  type="number"
                  name="feedbackMonths"
                  defaultValue={(org as any)?.feedbackMonths ?? 3}
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="anonymousAllowed"
                  name="anonymousAllowed"
                  defaultChecked={org?.anonymousAllowed ?? true}
                />
                <Label htmlFor="anonymousAllowed" className="text-sm">
                  Allow anonymous reports
                </Label>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit">Save</Button>
            </CardFooter>
          </Card>
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
        <Card>
          <details className="p-4">
            <summary className="cursor-pointer text-sm font-medium">Add category</summary>
            <form action={addCategory} className="mt-3 flex items-end gap-2">
              <div className="grid gap-1">
                <Label className="text-xs text-muted-foreground">Name</Label>
                <Input name="name" placeholder="Category name" />
              </div>

              <Button type="submit" className="px-3 py-1 text-sm" variant="primary" size="sm">

                Save
              </Button>
            </form>
          </details>
        </Card>
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





