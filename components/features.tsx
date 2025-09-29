"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { motion } from "framer-motion"
import { Cpu, ServerCog, Zap } from "lucide-react"

const data = [
  { icon: Zap, title: "One-Click Deploy", desc: "Provision optimized servers instantly with sensible defaults." },
  { icon: Cpu, title: "Premium Performance", desc: "Low-latency infra with generous RAM and solid CPU profiles." },
  { icon: ServerCog, title: "Simple Control", desc: "Start, stop, and scale from a clean, intuitive dashboard." },
]

export default function Features() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <div className="grid gap-4 md:grid-cols-3">
        {data.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
          >
            <Card className="h-full border-border/60">
              <CardHeader>
                <f.icon className="text-primary" />
                <CardTitle className="mt-2">{f.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">{f.desc}</CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
