"use client"

import type * as React from "react"
import { Toaster as SonnerToaster } from "sonner"

// Re-export toast so consumers can `import { toast } from "@/components/ui/sonner"`
export { toast } from "sonner"

// Named Toaster export compatible with shadcn usage
export function Toaster(props: React.ComponentProps<typeof SonnerToaster>) {
  return (
    <SonnerToaster
      position="top-center"
      richColors
      closeButton
      toastOptions={{
        // Accessible, subtle defaults
        style: { fontSize: "0.95rem", lineHeight: 1.45 },
      }}
      {...props}
    />
  )
}

// Default export for flexibility in import style
export default Toaster
