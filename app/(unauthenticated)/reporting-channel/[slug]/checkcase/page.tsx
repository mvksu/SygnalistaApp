import ClientCheckCase from "./client-checkcase"

export default async function CheckCasePage({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params // ✅ Next 15 requires awaiting
  return <ClientCheckCase slug={slug}  />
}
