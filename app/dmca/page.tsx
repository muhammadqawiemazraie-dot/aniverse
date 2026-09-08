import type { Metadata } from "next"
import Link from "next/link"
import { ShieldAlert } from "lucide-react"

export const metadata: Metadata = {
  title: "DMCA Policy",
  description: "Read Qverse's DMCA takedown policy.",
}

export default function DmcaPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl min-h-[70vh]">
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
            <ShieldAlert className="w-6 h-6 text-yellow-400" />
          </div>
          <h1 className="text-4xl font-black">DMCA Policy</h1>
        </div>
        <p className="text-muted-foreground text-sm">Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
      </div>

      <div className="mb-8 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-sm text-yellow-200/80 leading-relaxed">
        ⚠️ <strong>Important:</strong> Qverse does not host, store, or distribute any media content. We are a content aggregator that embeds streams from third-party providers.
      </div>

      <div className="prose prose-invert max-w-none space-y-8 text-muted-foreground leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">Our Position</h2>
          <p>Qverse operates as a search and discovery platform. All video content is hosted and served by third-party embed providers. Qverse itself does not upload, host, or cache any video files.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">Filing a DMCA Takedown</h2>
          <p>If you believe that content accessible through Qverse infringes your copyright, please be aware that the content is hosted by a third-party provider, not by Qverse. Your DMCA notice should be directed to the actual host of the content.</p>
          <p className="mt-3">However, if you wish to request that we remove a link or embed from our platform, please include the following in your request:</p>
          <ul className="mt-3 space-y-2 list-disc list-inside">
            <li>Your name and contact information</li>
            <li>A description of the copyrighted work</li>
            <li>The specific URL on Qverse that contains the infringing link</li>
            <li>A statement that you have a good faith belief that the use is unauthorized</li>
            <li>A statement, under penalty of perjury, that you are the copyright owner or authorized to act on their behalf</li>
            <li>Your physical or electronic signature</li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">Counter-Notification</h2>
          <p>If you believe your content was removed in error, you may submit a counter-notification with your contact details and a statement explaining why the removal was incorrect.</p>
        </section>
      </div>
      <div className="mt-12 pt-8 border-t border-border/40 flex gap-4 text-sm">
        <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>
        <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
      </div>
    </div>
  )
}
