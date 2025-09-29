"use client"

import RegisterForm from "@/components/register-form"
import { motion } from "framer-motion"

export default function RegisterClientPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <h1 className="text-3xl font-semibold">Create Account</h1>
        <p className="text-muted-foreground mt-2">Start deploying servers in minutes.</p>
      </motion.div>
      <div className="mt-8">
        <RegisterForm />
      </div>
    </section>
  )
}
