import PricingTable from "@/components/pricing-table"

export const metadata = {
  title: "Pricing – AuraDeploy",
  description: "Simple pricing for Minecraft auto-hosting",
}

export default function PricingPage() {
  return (
    <>
      <section className="mx-auto max-w-4xl px-4 py-10 text-center">
        <h1 className="text-4xl font-semibold">Pricing</h1>
        <p className="text-muted-foreground mt-2">Transparent plans to fit every server.</p>
      </section>
      <PricingTable />
    </>
  )
}
