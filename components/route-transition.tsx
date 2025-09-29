"use client"

import { AnimatePresence, motion } from "framer-motion"
import { usePathname } from "next/navigation"
import type React from "react"

export default function RouteTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.main
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="min-h-[calc(100svh-56px)]"
        onAnimationComplete={() => {
          console.log("[v0] Route transition completed for:", pathname)
        }}
      >
        {children}
      </motion.main>
    </AnimatePresence>
  )
}
