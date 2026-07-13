import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Fallback placeholders prevent a throw during SSR/static build when .env.local isn't set.
  // The client makes no network requests at instantiation, so placeholders are safe here.
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key'
  )
}
