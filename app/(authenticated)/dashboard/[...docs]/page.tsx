import fs from "node:fs/promises"
import path from "node:path"
import { auth } from "@clerk/nextjs/server"

export default async function DocPage({ params }: { params: Promise<{ docs: string[] }> }) {
  const { orgId } = await auth()
  if (!orgId) return null
  const { docs } = await params
  const slug = (docs || []).join("/")
  const file = slug === "docs/dpia" ? "docs/dpia.md"
    : slug === "docs/retention" ? "docs/retention.md"
    : slug === "docs/incident-response" ? "docs/incident-response.md"
    : null
  if (!file) return null
  const abs = path.join(process.cwd(), file)
  const content = await fs.readFile(abs, "utf8").catch(() => "")
  return (
    <div className="prose max-w-3xl">
      <pre className="whitespace-pre-wrap text-sm">{content}</pre>
    </div>
  )
}


