"use client"

import * as React from "react"
import Link from "next/link"
import { Tv, Mail, Lock, Loader2, ChevronLeft, ChevronRight, Film, Users, Bookmark, Sparkles } from "lucide-react"
import { toast } from "sonner"

import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { login, signup } from "@/app/actions/auth"
import { createClient } from "@/lib/supabase"

const MOVIE_SLIDES = [
  {
    title: "Interstellar",
    backdrop: "https://images.metahub.space/background/medium/tt0816692/img",
    quote: "Love is the one thing that transcends time and space.",
    author: "Joseph Cooper — Interstellar (2014)"
  },
  {
    title: "Inception",
    backdrop: "https://images.metahub.space/background/medium/tt1375666/img",
    quote: "An idea is like a virus. Resilient. Highly contagious.",
    author: "Dom Cobb — Inception (2010)"
  },
  {
    title: "Oppenheimer",
    backdrop: "https://images.metahub.space/background/medium/tt1535108/img",
    quote: "Now I am become Death, the destroyer of worlds.",
    author: "J. Robert Oppenheimer (2023)"
  },
  {
    title: "The Dark Knight",
    backdrop: "https://images.metahub.space/background/medium/tt0468569/img",
    quote: "It's not who I am underneath, but what I do that defines me.",
    author: "Bruce Wayne — The Dark Knight (2008)"
  },
  {
    title: "Dune: Part Two",
    backdrop: "https://images.metahub.space/background/medium/tt15239678/img",
    quote: "May thy knife chip and shatter.",
    author: "Paul Atreides — Dune (2024)"
  }
]

export default function LoginPage() {
  const [isLogin, setIsLogin] = React.useState(true)
  const [loading, setLoading] = React.useState(false)
  const [currentSlide, setCurrentSlide] = React.useState(0)
  const [transitioning, setTransitioning] = React.useState(false)
  const router = useRouter()

  const changeSlide = React.useCallback((newIndex: number) => {
    if (transitioning) return
    setTransitioning(true)
    setTimeout(() => {
      setCurrentSlide(newIndex)
      setTransitioning(false)
    }, 300)
  }, [transitioning])

  const nextSlide = React.useCallback(() => {
    changeSlide((currentSlide + 1) % MOVIE_SLIDES.length)
  }, [changeSlide, currentSlide])

  const prevSlide = React.useCallback(() => {
    changeSlide((currentSlide - 1 + MOVIE_SLIDES.length) % MOVIE_SLIDES.length)
  }, [changeSlide, currentSlide])

  // Auto-rotate movie backdrops every 6 seconds
  React.useEffect(() => {
    const timer = setInterval(() => {
      nextSlide()
    }, 6000)
    return () => clearInterval(timer)
  }, [nextSlide])

  const activeSlide = MOVIE_SLIDES[currentSlide]

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    
    const formData = new FormData(e.currentTarget)
    const result = isLogin ? await login(formData) : await signup(formData)

    if (result?.error) {
      toast.error(result.error)
      setLoading(false)
    } else if (result?.success) {
      if (!isLogin) {
        toast.success("Account created! Check your email to confirm if needed.")
      }
      router.push("/")
      router.refresh()
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      if (error) throw error
    } catch (e) {
      toast.error((e as Error).message)
      setLoading(false)
    }
  }

  return (
    <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      {/* Left Banner: Cinematic Movie Backdrops (No Anime) */}
      <div className="relative hidden h-full flex-col bg-slate-950 p-10 text-white lg:flex dark:border-r overflow-hidden select-none">
        {/* Background Image Layer */}
        <div
          className={`absolute inset-0 bg-cover bg-center transition-all duration-700 transform scale-105 ${
            transitioning ? "opacity-0 scale-100" : "opacity-35 scale-105"
          }`}
          style={{ backgroundImage: `url('${activeSlide.backdrop}')` }}
        />
        
        {/* Gradient Mesh Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-purple-950/40 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-slate-950/80" />

        {/* Top Logo */}
        <div className="relative z-20 flex items-center gap-3 text-2xl font-bold tracking-tight">
          <div className="p-2.5 rounded-xl bg-purple-500/20 backdrop-blur-md border border-purple-500/30 shadow-lg shadow-purple-500/20">
            <Tv className="w-7 h-7 text-purple-400" />
          </div>
          <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent text-3xl font-extrabold">
            Qverse
          </span>
        </div>

        {/* Navigation Controls */}
        <div className="relative z-20 flex items-center gap-2 ml-auto -mt-8">
          <Button
            variant="outline"
            size="icon"
            onClick={prevSlide}
            className="w-8 h-8 rounded-full border-white/20 bg-black/40 hover:bg-white/20 backdrop-blur-md text-white"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={nextSlide}
            className="w-8 h-8 rounded-full border-white/20 bg-black/40 hover:bg-white/20 backdrop-blur-md text-white"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Feature Highlights Grid */}
        <div className="relative z-20 my-auto grid grid-cols-2 gap-4 max-w-lg">
          <div className="p-4 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 flex items-start gap-3">
            <Film className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-white">All-in-One Streaming</h4>
              <p className="text-xs text-slate-400">Stream Movies & Series free</p>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 flex items-start gap-3">
            <Users className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-white">Watch Parties</h4>
              <p className="text-xs text-slate-400">Watch together in sync</p>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 flex items-start gap-3">
            <Bookmark className="w-5 h-5 text-pink-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-white">Watchlist & Tracking</h4>
              <p className="text-xs text-slate-400">Auto-save watch history</p>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-white">AI Qbot</h4>
              <p className="text-xs text-slate-400">Smart movie assistant</p>
            </div>
          </div>
        </div>

        {/* Cinematic Movie Quote */}
        <div className="relative z-20 mt-auto space-y-4">
          <div
            className={`transition-all duration-500 transform ${
              transitioning ? "translate-y-2 opacity-0" : "translate-y-0 opacity-100"
            }`}
          >
            <blockquote className="space-y-2 bg-black/50 backdrop-blur-md p-5 rounded-2xl border border-white/10 shadow-2xl">
              <p className="text-base font-medium leading-relaxed italic text-slate-100">
                &quot;{activeSlide.quote}&quot;
              </p>
              <footer className="text-xs font-semibold text-purple-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                {activeSlide.author}
              </footer>
            </blockquote>
          </div>

          {/* Slide Indicator Dots */}
          <div className="flex items-center gap-2 pt-1">
            {MOVIE_SLIDES.map((slide, idx) => (
              <button
                key={slide.title}
                onClick={() => changeSlide(idx)}
                title={slide.title}
                className={`h-2 rounded-full transition-all duration-300 ${
                  currentSlide === idx ? "w-8 bg-purple-400 shadow-md shadow-purple-500/50" : "w-2 bg-white/30 hover:bg-white/60"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Right Form Section */}
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              {isLogin ? "Welcome back" : "Create an account"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isLogin ? "Enter your email to sign in to your account" : "Enter your email below to create your account"}
            </p>
          </div>
          <div className="grid gap-6">
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      placeholder="name@example.com"
                      type="email"
                      autoCapitalize="none"
                      autoComplete="email"
                      autoCorrect="off"
                      required
                      className="pl-9 bg-secondary/50"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Password"
                      required
                      minLength={6}
                      className="pl-9 bg-secondary/50"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isLogin ? "Sign In" : "Sign Up"}
                </Button>
              </div>
            </form>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <Button 
              variant="outline" 
              type="button" 
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-secondary/50 flex items-center justify-center gap-2 border-white/10"
            >
              <svg className="h-4 w-4" aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
              </svg>
              Google
            </Button>

            <Button 
              variant="outline" 
              type="button" 
              onClick={() => setIsLogin(!isLogin)}
              className="w-full bg-secondary/50"
              disabled={loading}
            >
              {isLogin ? "Need an account? Sign Up" : "Already have an account? Sign In"}
            </Button>
          </div>
          <p className="px-8 text-center text-sm text-muted-foreground">
            By clicking continue, you agree to our{" "}
            <Link href="/terms" className="underline underline-offset-4 hover:text-primary">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline underline-offset-4 hover:text-primary">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
