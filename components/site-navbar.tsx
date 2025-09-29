"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/auth-provider"
import { motion, useScroll, useTransform } from "framer-motion"
import Image from "next/image"
import { useState } from "react"
import LogoutConfirmationDialog from "@/components/logout-confirmation-dialog"
import { useRouter } from "next/navigation"

const links = [
  { href: "/", label: "Home" },
  { href: "/pricing", label: "Pricing" },
  { href: "/dashboard", label: "Dashboard" },
]

export default function SiteNavbar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const router = useRouter()
  const { scrollY } = useScroll()
  const bgOpacity = useTransform(scrollY, [0, 80], [0, 1])
  const bgColor = useTransform(bgOpacity, (o) => `hsl(var(--background) / ${o})`)

  const [showLogoutDialog, setShowLogoutDialog] = useState(false)

  const handleLogout = () => {
    setShowLogoutDialog(true)
  }

  const confirmLogout = () => {
    logout()
    setShowLogoutDialog(false)
    router.push("/login")
  }

  return (
    <>
      <motion.header
        style={{ backgroundColor: bgColor }}
        className="sticky top-0 z-50 border-b backdrop-blur"
        aria-label="Main navigation"
      >
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/placeholder-logo.svg" alt="AuraDeploy logo" width={24} height={24} />
            <span className="font-semibold">AuraDeploy</span>
          </Link>
          <div className="hidden items-center gap-6 md:flex">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn("text-sm hover:text-primary transition-colors", pathname === l.href && "text-primary")}
              >
                {l.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <span className="hidden text-sm md:inline">Hi{user?.username ? `, ${user.username}` : ""}</span>
                <Button variant="outline" onClick={handleLogout} aria-label="Logout">
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost">Login</Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-primary text-primary-foreground hover:opacity-90">Register</Button>
                </Link>
              </>
            )}
          </div>
        </nav>
      </motion.header>

      <LogoutConfirmationDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog} onConfirm={confirmLogout} />
    </>
  )
}
