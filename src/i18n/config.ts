import { headers } from "next/headers"

export const supportedLocales = ["en", "pl"] as const
export type Locale = (typeof supportedLocales)[number]

export async function detectLocale(): Promise<"en" | "pl"> {
  try {
    const accept =  (await headers()).get("accept-language") || "en"
    if (accept.toLowerCase().startsWith("pl")) return "pl"
  } catch {}
  return "en"
}

export async function getDictionary(locale: Locale): Promise<Record<string, string>> {
  switch (locale) {
    case "pl":
      return (await import("./pl.json")).default as Record<string, string>
    default:
      return (await import("./en.json")).default as Record<string, string>
  }
}





