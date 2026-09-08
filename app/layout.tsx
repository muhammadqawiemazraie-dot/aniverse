import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { FloatingChat } from "@/components/floating-chat";
import { BackToTop } from "@/components/back-to-top";
import { Toaster } from "sonner";
import { Suspense } from "react";
import { TopProgressBar } from "@/components/top-progress-bar";
import { ParticleBackground } from "@/components/particle-background";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";
import { ResumeBanner } from "@/components/resume-banner";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://qverse-stream.vercel.app"),
  title: {
    default: "Qverse - Stream Movies, Series & Anime",
    template: "%s — Qverse",
  },
  description: "Discover, track, and stream the latest Movies, TV Series, and Anime — all in one place.",
  keywords: ["anime", "movies", "series", "streaming", "watch free"],
  openGraph: {
    title: "Qverse - Stream Movies, Series & Anime",
    description: "Discover, track, and stream the latest Movies, TV Series, and Anime — all in one place.",
    url: "https://qverse-stream.vercel.app",
    siteName: "Qverse",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-banner.png",
        width: 1200,
        height: 630,
        alt: "Qverse - Stream Movies, Series & Anime",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Qverse",
    description: "Discover, track, and stream the latest Movies, TV Series, and Anime — all in one place.",
    images: ["/og-banner.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Qverse",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var preset = localStorage.getItem('aniverse_theme_preset') || 'sakura';
                  var color = localStorage.getItem('aniverse_primary_color');
                  var fg = localStorage.getItem('aniverse_primary_fg_color');
                  
                  if (preset === 'custom' && color) {
                    document.documentElement.style.setProperty('--primary', color);
                    document.documentElement.style.setProperty('--ring', color);
                    document.documentElement.style.setProperty('--sidebar-primary', color);
                    document.documentElement.style.setProperty('--sidebar-ring', color);
                    if (fg) {
                      document.documentElement.style.setProperty('--primary-foreground', fg);
                      document.documentElement.style.setProperty('--sidebar-primary-foreground', fg);
                    }
                  } else {
                    var presets = {
                      sakura: { light: 'oklch(0.55 0.2 320)', dark: 'oklch(0.65 0.25 320)', fg: 'oklch(0.98 0 0)' },
                      ocean: { light: 'oklch(0.55 0.18 240)', dark: 'oklch(0.65 0.2 240)', fg: 'oklch(0.98 0 0)' },
                      emerald: { light: 'oklch(0.55 0.18 140)', dark: 'oklch(0.68 0.22 140)', fg: 'oklch(0.12 0.02 270)' },
                      violet: { light: 'oklch(0.55 0.2 290)', dark: 'oklch(0.65 0.25 290)', fg: 'oklch(0.98 0 0)' },
                      amber: { light: 'oklch(0.6 0.18 60)', dark: 'oklch(0.68 0.2 60)', fg: 'oklch(0.12 0.02 270)' },
                      crimson: { light: 'oklch(0.52 0.2 25)', dark: 'oklch(0.6 0.22 25)', fg: 'oklch(0.98 0 0)' }
                    };
                    var p = presets[preset] || presets.sakura;
                    var isDark = document.documentElement.classList.contains('dark') || 
                                 (!document.documentElement.classList.contains('light') && 
                                  window.matchMedia('(prefers-color-scheme: dark)').matches);
                    var c = isDark ? p.dark : p.light;
                    document.documentElement.style.setProperty('--primary', c);
                    document.documentElement.style.setProperty('--ring', c);
                    document.documentElement.style.setProperty('--sidebar-primary', c);
                    document.documentElement.style.setProperty('--sidebar-ring', c);
                    document.documentElement.style.setProperty('--primary-foreground', p.fg);
                    document.documentElement.style.setProperty('--sidebar-primary-foreground', p.fg);
                  }
                } catch (e) {}
              })();
            `
          }}
        />
        <link rel="manifest" href="/manifest.json" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function(err) {
                    console.error('ServiceWorker registration failed: ', err);
                  });
                });
              }
            `
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
            <ParticleBackground />
          </div>
          <Navbar />
          <Suspense fallback={null}><TopProgressBar /></Suspense>
          <main className="flex-1 pt-16">
            {children}
          </main>
          <Footer />
          <FloatingChat />
          <BackToTop />
          <PwaInstallPrompt />
          <ResumeBanner />
          <Toaster richColors position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
