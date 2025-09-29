"use client"

import { useEffect, useState, useMemo } from "react"
import { motion } from "framer-motion"
import { CheckCircle2, Sparkles } from "lucide-react"

interface SuccessAnimationProps {
  serverName: string
  onComplete: () => void
}

export default function SuccessAnimation({ serverName, onComplete }: SuccessAnimationProps) {
  const [showRedirect, setShowRedirect] = useState(false)

  // Simple particle field for confetti without external libs
  const particles = useMemo(() => {
    const count = 80
    return Array.from({ length: count }).map((_, i) => {
      const left = Math.random() * 100 // vw percent
      const delay = Math.random() * 0.8 // seconds
      const duration = 1.2 + Math.random() * 1.6 // seconds
      const size = 6 + Math.floor(Math.random() * 8) // px
      const rotate = (Math.random() - 0.5) * 360
      const drift = (Math.random() - 0.5) * 60 // px lateral
      const colors = ["bg-primary", "bg-accent", "bg-muted"]
      const color = colors[i % colors.length]
      return { left, delay, duration, size, rotate, drift, color, key: `p-${i}` }
    })
  }, [])

  useEffect(() => {
    // Show redirect message after 1 second
    const redirectTimer = setTimeout(() => {
      setShowRedirect(true)
    }, 1000)

    // Complete after 3 seconds
    const completeTimer = setTimeout(() => {
      onComplete()
    }, 3000)

    return () => {
      clearTimeout(redirectTimer)
      clearTimeout(completeTimer)
    }
  }, [onComplete])

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center relative">
      {/* Confetti particles (decorative) */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {particles.map((p) => (
          <motion.div
            key={p.key}
            initial={{ y: -20, x: 0, opacity: 0, rotate: 0 }}
            animate={{ y: 480, x: p.drift, opacity: [0, 1, 1, 0], rotate: p.rotate }}
            transition={{ duration: p.duration, delay: p.delay, ease: "easeOut" }}
            className={`absolute top-0 ${p.color} rounded-sm shadow-sm`}
            style={{ left: `${p.left}%`, width: p.size, height: p.size }}
          />
        ))}
      </div>

      <div className="text-center space-y-6 p-8">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="relative"
        >
          <CheckCircle2 className="h-20 w-20 text-green-500 mx-auto" />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="absolute -top-2 -right-2"
          >
            <Sparkles className="h-8 w-8 text-yellow-500" />
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-2"
        >
          <h2 className="text-2xl font-bold text-green-600">Server Created Successfully!</h2>
          <p className="text-muted-foreground">
            <span className="font-medium">{serverName}</span> is now being deployed
          </p>
        </motion.div>

        {showRedirect && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <div className="flex items-center justify-center gap-2 text-primary">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full"
              />
              <span className="font-medium">Redirecting to Server Management...</span>
            </div>
            <div className="w-48 h-1 bg-muted rounded-full mx-auto overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 2, ease: "easeInOut" }}
                className="h-full bg-primary rounded-full"
              />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
