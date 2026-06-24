'use client'

import Link from 'next/link'
import { ShoppingCart, LogOut, User, Package, Settings } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export default function Navbar() {
  const openCart = useCartStore(state => state.openCart)
  const [itemCount, setItemCount] = useState(0)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const unsub = useCartStore.subscribe(state => {
      setItemCount(state.items.reduce((s, i) => s + i.quantity, 0))
    })
    const current = useCartStore.getState()
    setItemCount(current.items.reduce((s, i) => s + i.quantity, 0))
    return unsub
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: listener } = supabase.auth.onAuthStateChange((_, session) =>
      setUser(session?.user ?? null)
    )
    return () => listener.subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-28 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <img
            src="/logo.png"
            alt="Seven Express"
            className="h-24 w-auto object-contain"
            onError={(e) => {
              const t = e.target as HTMLImageElement
              t.style.display = 'none'
              t.nextElementSibling?.classList.remove('hidden')
            }}
          />
          <span className="hidden text-gray-900 font-extrabold text-xl tracking-tight">
            Seven Express
          </span>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {user ? (
            <>
              <span className="hidden sm:block text-sm text-gray-400 ms-1 px-2">
                {user.email}
              </span>
              <Link
                href="/orders"
                className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-blue-600 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Package size={16} /> הזמנות
              </Link>
              {user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL && (
                <Link
                  href="/admin"
                  className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-blue-600 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Settings size={16} /> ניהול
                </Link>
              )}
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-red-500 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">התנתק</span>
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-blue-600 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <User size={16} />
                <span className="hidden sm:inline">התחברות</span>
              </Link>
              <Link
                href="/register"
                className="text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                הרשמה
              </Link>
            </>
          )}

          {/* Cart */}
          <button
            onClick={openCart}
            className="relative p-2.5 rounded-xl hover:bg-gray-100 transition-colors ms-1"
            aria-label={`סל קניות, ${itemCount} פריטים`}
          >
            <ShoppingCart size={22} className="text-gray-700" />
            {itemCount > 0 && (
              <span className="absolute -top-0.5 -start-0.5 bg-red-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center leading-none">
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
