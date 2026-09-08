import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Read Qverse's Terms of Service.",
}

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl min-h-[70vh]">
      <div className="mb-10">
        <h1 className="text-4xl font-black mb-3">Terms of Service</h1>
        <p className="text-muted-foreground text-sm">Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
      </div>
      <div className="prose prose-invert max-w-none space-y-8 text-muted-foreground leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">1. Acceptance of Terms</h2>
          <p>By accessing and using Qverse, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">2. Description of Service</h2>
          <p>Qverse is a content aggregator that embeds third-party video players. We do not host, upload, or distribute any media content directly. All content is sourced from external providers via publicly available embed APIs.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">3. User Responsibilities</h2>
          <p>You agree to use this service for lawful purposes only. You must not attempt to circumvent, disable, or interfere with any security features of the service.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">4. Disclaimer of Warranties</h2>
          <p>Qverse is provided on an &quot;as is&quot; basis without warranties of any kind. We do not guarantee the availability, accuracy, or legality of content provided by third-party embed sources.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">5. Limitation of Liability</h2>
          <p>Qverse shall not be liable for any indirect, incidental, special, or consequential damages resulting from your use or inability to use the service.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">6. Changes to Terms</h2>
          <p>We reserve the right to modify these terms at any time. Continued use of the service after changes constitutes acceptance of the new terms.</p>
        </section>
      </div>
      <div className="mt-12 pt-8 border-t border-border/40 flex gap-4 text-sm">
        <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
        <Link href="/dmca" className="text-primary hover:underline">DMCA Policy</Link>
      </div>
    </div>
  )
}
