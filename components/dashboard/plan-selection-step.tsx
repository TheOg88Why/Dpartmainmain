"use client"

import type React from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Zap, Crown, Rocket } from "lucide-react"
import { cn } from "@/lib/utils"

export type Plan = {
  id: "free" | "standard" | "pro"
  name: string
  price: string
  ram: string
  cpu: string
  features: string[]
  icon: React.ReactNode
  popular?: boolean
}

const plans: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    ram: "1GB RAM",
    cpu: "1 vCPU",
    features: ["Basic Minecraft server", "10 max players", "Community support", "Basic backups"],
    icon: <Zap className="h-5 w-5" />,
  },
  {
    id: "standard",
    name: "Standard",
    price: "$9",
    ram: "4GB RAM",
    cpu: "2 vCPU",
    features: ["Enhanced performance", "50 max players", "Priority support", "Daily backups", "Plugin support"],
    icon: <Crown className="h-5 w-5" />,
    popular: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$19",
    ram: "8GB RAM",
    cpu: "4 vCPU",
    features: [
      "Maximum performance",
      "Unlimited players",
      "24/7 support",
      "Hourly backups",
      "Advanced plugins",
      "Custom domains",
    ],
    icon: <Rocket className="h-5 w-5" />,
  },
]

interface PlanSelectionStepProps {
  selectedPlan: Plan | null
  onPlanSelect: (plan: Plan) => void
  onNext: () => void
  onCancel: () => void
}

export default function PlanSelectionStep({ selectedPlan, onPlanSelect, onNext, onCancel }: PlanSelectionStepProps) {
  return (
    <div className="p-3 sm:p-6 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl sm:text-2xl font-semibold">Choose Your Plan</h2>
        <p className="text-muted-foreground">Select the perfect plan for your Minecraft server</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {plans.map((plan, index) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card
              className={cn(
                "relative cursor-pointer transition-all duration-200 hover:shadow-lg",
                selectedPlan?.id === plan.id ? "ring-2 ring-primary shadow-lg" : "hover:shadow-md",
                plan.popular && "border-primary",
              )}
              onClick={() => onPlanSelect(plan)}
            >
              {plan.popular && (
                <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                  Most Popular
                </Badge>
              )}

              <CardHeader className="text-center pb-4">
                <div className="flex items-center justify-center mb-2">
                  <div
                    className={cn(
                      "p-2 rounded-full",
                      selectedPlan?.id === plan.id ? "bg-primary text-primary-foreground" : "bg-muted",
                    )}
                  >
                    {plan.icon}
                  </div>
                </div>
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <div className="space-y-1">
                  <div className="text-2xl font-bold">
                    {plan.price}
                    <span className="text-sm font-normal text-muted-foreground">/mo</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {plan.ram} • {plan.cpu}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <ul className="space-y-2">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {selectedPlan?.id === plan.id && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center justify-center pt-2"
                  >
                    <div className="flex items-center gap-2 text-primary font-medium text-sm">
                      <Check className="h-4 w-4" />
                      Selected
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-4">
        <div className="text-sm text-muted-foreground">Step 1 of 4</div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onCancel} size="sm">
            Cancel
          </Button>
          <Button onClick={onNext} disabled={!selectedPlan} size="sm" className="bg-primary text-primary-foreground">
            Continue
          </Button>
        </div>
      </div>
    </div>
  )
}
