import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { type CookieOptions, createServerClient } from '@supabase/ssr'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.delete({ name, ...options })
          },
        },
      }
    )
    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      if (sessionData?.user) {
        const user = sessionData.user
        const profiles = user.user_metadata?.profiles as any[]
        if (profiles && Array.isArray(profiles)) {
          let updated = false
          const cleanedProfiles = profiles.map(p => {
            let avatar = p.avatar_url
            let banner = p.banner_url
            if (avatar && avatar.startsWith("data:")) {
              avatar = "local_file"
              updated = true
            }
            if (banner && banner.startsWith("data:")) {
              banner = "local_file"
              updated = true
            }
            return { ...p, avatar_url: avatar, banner_url: banner }
          })

          if (updated) {
            await supabase.auth.updateUser({
              data: {
                ...user.user_metadata,
                profiles: cleanedProfiles
              }
            })
          }
        }
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=Could not authenticate user`)
}
