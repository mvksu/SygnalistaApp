import { auth } from "@clerk/nextjs/server"
import { db } from "@/db"
import { reportCategories } from "@/db/schema/reportCategories"
import { eq } from "drizzle-orm"
import { addCategory, setCategoryActive } from "@/actions/categories"
import Link from "next/link"
import { Button } from "tweakcn/ui/button"

export default async function CategoriesPage() {
	const { orgId: clerkOrgId } = await auth()
	if (!clerkOrgId) return null
	const { getDbOrgIdForClerkOrg } = await import("@/src/server/orgs")
	const orgId = await getDbOrgIdForClerkOrg(clerkOrgId)

	const categories = await db.query.reportCategories.findMany({ where: eq(reportCategories.orgId, orgId) })

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-semibold">Categories</h1>
				{/* Add button triggers dialog via details/summary for zero JS overhead */}
				<details className="relative">
					<summary className="cursor-pointer rounded bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">Add</summary>
					<div className="absolute right-0 z-10 mt-2 w-80 rounded border bg-background p-4 shadow">
						<form action={addCategory} className="space-y-3">
							<div className="grid gap-1">
								<label className="text-xs text-muted-foreground">Name</label>
								<input name="name" className="rounded border px-2 py-1" placeholder="Category name" />
							</div>
                    <div className="flex justify-end gap-2">
                        <Link href="/dashboard/categories" className="rounded border px-3 py-1 text-sm">Cancel</Link>
                        <Button type="submit" className="px-3 py-1 text-sm" variant="primary" size="sm">
                            Save
                        </Button>
                    </div>
						</form>
					</div>
				</details>
			</div>

			<div className="rounded border">
				<table className="w-full text-sm">
					<thead className="bg-muted">
						<tr>
							<th className="p-2 text-left">Name</th>
							<th className="p-2 text-left">Status</th>
							<th className="p-2 text-left w-28"></th>
						</tr>
					</thead>
					<tbody>
						{categories.map(c => (
							<tr key={c.id} className="border-t">
								<td className="p-2">{c.name}</td>
								<td className="p-2">{c.active ? "Active" : "Inactive"}</td>
								<td className="p-2">
									<form action={async (formData) => { 'use server'; await setCategoryActive(c.id, !c.active) }}>
                                                                                <Button type="submit" className="px-2 py-1 text-xs" variant="outline" size="sm">{c.active ? "Deactivate" : "Activate"}</Button>
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
		</div>
	)
}


