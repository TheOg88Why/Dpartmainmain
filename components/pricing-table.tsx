"use client"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { motion } from "framer-motion"
import { useState } from "react"
import Link from "next/link"
import { useAuth } from "@/components/auth-provider"

const PLANS = [
  { name: "Free", ram: "1 GB RAM", monthly: 0, yearly: 0, cta: "Choose Plan" },
  { name: "Pro", ram: "4 GB RAM", monthly: 12, yearly: 120, cta: "Choose Plan", featured: true },
  { name: "Elite", ram: "8 GB RAM", monthly: 24, yearly: 240, cta: "Choose Plan" },
]

export default function PricingTable() {
  const [yearly, setYearly] = useState(false)
  const { user } = useAuth()
  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-6 flex items-center justify-center gap-3">
        <span className="text-sm">Monthly</span>
        <Switch checked={yearly} onCheckedChange={setYearly} aria-label="Toggle yearly pricing" />
        <span className="text-sm">Yearly</span>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((p, i) => (
          <motion.div
            key={p.name}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
          >
            <Card className={p.featured ? "border-primary" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {p.name}
                  <span className="text-xs text-muted-foreground">{p.ram}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold">{yearly ? `$${p.yearly}/yr` : `$${p.monthly}/mo`}</div>
              </CardContent>
              <CardFooter>
                <Link href={user ? "/dashboard" : "/register"} className="w-full">
                  <Button className="w-full bg-primary text-primary-foreground hover:opacity-90">{p.cta}</Button>
                </Link>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
