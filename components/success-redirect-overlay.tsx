"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle, Loader2 } from "lucide-react"

interface SuccessRedirectOverlayProps {
  show: boolean
  message?: string
  onComplete?: () => void
}

export default function SuccessRedirectOverlay({
  show,
  message = "Redirecting to Dashboard...",
  onComplete,
}: SuccessRedirectOverlayProps) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!show) return

    // Play success sound
    const audio = new Audio("https://files.catbox.moe/xprsrr.mp3")
    audio.volume = 0.5
    audio.play().catch(console.error)

    // Animate progress bar
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(() => onComplete?.(), 200)
          return 100
        }
        return prev + 2
      })
    }, 50)

    return () => {
      clearInterval(interval)
      setProgress(0)
    }
  }, [show, onComplete])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="bg-background rounded-lg border p-8 shadow-lg max-w-sm w-full mx-4"
          >
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20"
              >
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </motion.div>

              <h3 className="text-lg font-semibold mb-2">Success!</h3>
              <p className="text-muted-foreground text-sm mb-6">{message}</p>

              {/* Progress bar */}
              <div className="w-full bg-muted rounded-full h-2 mb-4">
                <motion.div
                  className="bg-primary h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>

              {/* Loading spinner */}
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Please wait...</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
