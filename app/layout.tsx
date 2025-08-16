import { CheckoutRedirect } from "@/components/payments/checkout-redirect"
import { TooltipProvider } from "@/components/ui/tooltip"
import { TailwindIndicator } from "@/components/utility/tailwind-indicator"
import { ClerkProvider } from "@clerk/nextjs"
import type { Metadata } from "next"
import { detectLocale, getDictionary, type Locale } from "@/src/i18n/config"
import { ThemeProvider } from "next-themes"
import { Geist, Geist_Mono } from "next/font/google"
import { Toaster } from "sonner"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"]
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"]
})

export const metadata: Metadata = {
  title: "Signalista",
  description: "Confidential whistleblowing platform for Polish/EU compliance."
}

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  // Detect locale on server and load dictionary (basic example)
  const locale: Locale = detectLocale()
  const dict = await getDictionary(locale)
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            <TooltipProvider>
              {children}
              <CheckoutRedirect />

              <TailwindIndicator />
              <Toaster />
            </TooltipProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
