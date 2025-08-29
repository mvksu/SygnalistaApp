import { NextRequest } from "next/server"
import { generatePresignedDownloadUrl } from "@/lib/storage/supabase"

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const key = url.searchParams.get("key")
  if (!key) {
    return new Response("Missing key", { status: 400 })
  }
  try {
    const signed = await generatePresignedDownloadUrl(key)
    return Response.redirect(signed, 302)
  } catch (e: any) {
    return new Response(e?.message || "Failed to create download", { status: 400 })
  }
}


