import Hero from "@/components/hero"
import Features from "@/components/features"
import PricingTable from "@/components/pricing-table"
import Footer from "@/components/footer"

export const metadata = {
  title: "AuraDeploy – One Click Minecraft Hosting",
  description: "Deploy Minecraft servers in one click with AuraDeploy",
}

export default function Page() {
  return (
    <>
      <Hero />
      <Features />
      {/* Testimonials placeholder */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="rounded-lg border p-8 text-center">
          <p className="text-muted-foreground">Testimonials coming soon.</p>
        </div>
      </section>
      <PricingTable />
      <Footer />
    </>
  )
}
