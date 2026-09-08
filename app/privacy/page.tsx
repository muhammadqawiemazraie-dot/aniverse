import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Read Qverse's Privacy Policy.",
}

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl min-h-[70vh]">
      <div className="mb-10">
        <h1 className="text-4xl font-black mb-3">Privacy Policy</h1>
        <p className="text-muted-foreground text-sm">Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
      </div>
      <div className="prose prose-invert max-w-none space-y-8 text-muted-foreground leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">1. Information We Collect</h2>
          <p>Qverse collects minimal data. When you create an account, we store your email address and preferences via Supabase. We also store your watchlist and viewing history locally in your browser via localStorage.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">2. How We Use Your Information</h2>
          <p>Your data is used solely to provide and improve the Qverse experience — such as remembering your watchlist, preferred server, and viewing history. We do not sell or share your data with third parties.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">3. Third-Party Services</h2>
          <p>Qverse embeds content from third-party video providers. These providers may collect their own data per their own privacy policies. We also use the Cinemeta API to fetch metadata.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">4. Cookies</h2>
          <p>We use minimal cookies for authentication (via Supabase sessions) and theme preferences. No advertising or tracking cookies are used.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">5. Data Retention</h2>
          <p>Account data is retained as long as your account is active. You may request deletion of your account and associated data at any time by contacting us.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">6. Contact</h2>
          <p>If you have any questions about this Privacy Policy, please reach out via our community chat on the site.</p>
        </section>
      </div>
      <div className="mt-12 pt-8 border-t border-border/40 flex gap-4 text-sm">
        <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>
        <Link href="/dmca" className="text-primary hover:underline">DMCA Policy</Link>
      </div>
    </div>
  )
}
