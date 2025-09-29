import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "../components/ui/sonner"
import SiteNavbar from "@/components/site-navbar"
import RouteTransition from "@/components/route-transition"
import { AuthProvider } from "@/components/auth-provider"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "AuraDeploy – Minecraft Auto-Host",
  description: "Deploy Minecraft servers in one click. Minimal, premium, and fast.",
  generator: "v0.app",
  metadataBase: new URL("https://auradeploy.example.com"),
  openGraph: {
    title: "AuraDeploy – Minecraft Auto-Host",
    description: "Deploy Minecraft servers in one click.",
    url: "https://auradeploy.example.com",
    siteName: "AuraDeploy",
  },
  twitter: {
    card: "summary_large_image",
    title: "AuraDeploy – Minecraft Auto-Host",
    description: "Deploy Minecraft servers in one click.",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
      <body className={`font-sans`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <AuthProvider>
            <SiteNavbar />
            <Suspense>
              <RouteTransition>{children}</RouteTransition>
            </Suspense>
            <Toaster richColors />
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
