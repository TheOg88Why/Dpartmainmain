"use client"

import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import Link from "next/link"

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Subtle animated gradient background */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        initial={{ opacity: 0.4 }}
        animate={{ opacity: 0.7 }}
        transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatType: "mirror" }}
        style={{
          background:
            "radial-gradient(60rem 30rem at 20% 10%, color-mix(in oklch, var(--color-primary) 30%, transparent), transparent), radial-gradient(50rem 25rem at 80% 20%, color-mix(in oklch, var(--color-accent) 24%, transparent), transparent)",
        }}
      />
      <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-20 text-center">
        <motion.h1
          className="text-balance text-4xl font-semibold md:text-6xl"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35 }}
        >
          Deploy Minecraft Servers in One Click
        </motion.h1>
        <motion.p
          className="text-pretty text-muted-foreground max-w-2xl"
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35, delay: 0.05 }}
        >
          AuraDeploy makes hosting effortless. Spin up fast, managed Minecraft servers with premium performance and zero
          hassle.
        </motion.p>
        <motion.div
          className="flex flex-wrap items-center justify-center gap-3"
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35, delay: 0.1 }}
        >
          <Link href="/register">
            <Button className="bg-primary text-primary-foreground hover:opacity-90">Get Started</Button>
          </Link>
          <Link href="/pricing">
            <Button variant="outline">View Pricing</Button>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
