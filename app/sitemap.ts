import type { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://qverse-stream.vercel.app"
  return [
    { url: base, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${base}/browse`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/genres`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/schedule`, lastModified: new Date(), changeFrequency: "daily", priority: 0.7 },
    { url: `${base}/search`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/dmca`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ]
}
