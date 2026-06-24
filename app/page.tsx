import { createClient } from '@/lib/supabase/server'
import ProductGrid from '@/components/ProductGrid'
import HeroBanner from '@/components/HeroBanner'
import AboutBanner from '@/components/AboutBanner'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const supabase = await createClient()

  const [{ data: products, error: pError }, { data: categories, error: cError }] =
    await Promise.all([
      supabase
        .from('products')
        .select('*, category:categories(*)')
        .eq('is_active', true)
        .order('created_at', { ascending: false }),
      supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true }),
    ])

  if (pError || cError) {
    return (
      <main className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p className="text-red-500 font-medium">
          לא ניתן לטעון מוצרים — בדוק את משתני הסביבה של Supabase.
        </p>
        <p className="text-sm text-gray-400 mt-2">
          העתק את <code>.env.local.example</code> ל־<code>.env.local</code> ומלא את הפרטים.
        </p>
      </main>
    )
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-6">
      <HeroBanner />
      <AboutBanner />
      <ProductGrid products={products ?? []} categories={categories ?? []} />
    </main>
  )
}
