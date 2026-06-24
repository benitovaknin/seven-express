'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle2, ShoppingBag } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface FormState {
  name: string
  phone: string
  city: string
  address: string
  notes: string
}

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCartStore()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [orderId, setOrderId] = useState('')
  const [form, setForm] = useState<FormState>({
    name: '', phone: '', city: '', address: '', notes: '',
  })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login?next=/checkout'); return }
      setUser(data.user)
      const name = data.user.user_metadata?.full_name ?? ''
      if (name) setForm(f => ({ ...f, name }))
    })
  }, [])

  const set = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || items.length === 0) return
    setLoading(true)

    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        status: 'pending',
        total_amount: totalPrice(),
        delivery_name: form.name,
        delivery_phone: form.phone,
        delivery_city: form.city,
        delivery_address: form.address,
        notes: form.notes || null,
      })
      .select()
      .single()

    if (error || !order) {
      alert('שליחת ההזמנה נכשלה. נסה שוב.')
      setLoading(false)
      return
    }

    await supabase.from('order_items').insert(
      items.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.price,
      }))
    )

    clearCart()
    setOrderId(order.id.slice(0, 8).toUpperCase())
    setSuccess(true)
    setLoading(false)
  }

  const inputCls =
    'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition'

  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="bg-white rounded-2xl p-10 shadow-sm border border-gray-100">
          <CheckCircle2 className="mx-auto text-blue-500 mb-5" size={64} />
          <h2 className="text-2xl font-bold mb-2">ההזמנה נשלחה!</h2>
          <p className="text-gray-500 mb-1">
            מספר הזמנה: <span className="font-mono font-bold">{orderId}</span>
          </p>
          <p className="text-gray-400 text-sm mb-8">
            ההזמנה שלך ממתינה לאישור. ניצור איתך קשר בקרוב.
          </p>
          <Link
            href="/"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            המשך קניות
          </Link>
        </div>
      </div>
    )
  }

  if (items.length === 0 && !success) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <ShoppingBag size={56} className="mx-auto text-gray-200 mb-4" />
        <p className="text-gray-500 font-medium">הסל ריק.</p>
        <Link href="/" className="mt-4 inline-block text-blue-600 hover:underline text-sm">
          חזרה לחנות
        </Link>
      </div>
    )
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft size={16} /> חזרה לחנות
      </Link>

      <h1 className="text-2xl font-bold mb-8">קופה</h1>

      <div className="grid md:grid-cols-[1fr_360px] gap-8 items-start">
        {/* Delivery form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
            <h2 className="font-semibold text-base text-gray-900">פרטי משלוח</h2>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">שם מלא</label>
                <input required value={form.name} onChange={set('name')} className={inputCls} placeholder="השם שלך" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">טלפון</label>
                <input required type="tel" value={form.phone} onChange={set('phone')} className={inputCls} placeholder="050-000-0000" />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">עיר</label>
                <input required value={form.city} onChange={set('city')} className={inputCls} placeholder="תל אביב" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">רחוב ומספר</label>
                <input required value={form.address} onChange={set('address')} className={inputCls} placeholder="רחוב הרצל 5" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                הערות <span className="text-gray-400 font-normal">(אופציונלי)</span>
              </label>
              <textarea
                value={form.notes}
                onChange={set('notes')}
                rows={3}
                className={inputCls}
                placeholder="הוראות משלוח, קוד כניסה וכו׳"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-4 rounded-xl transition-colors text-base"
          >
            {loading ? 'שולח הזמנה…' : `שלח הזמנה • ₪${totalPrice().toFixed(2)}`}
          </button>
          <p className="text-center text-xs text-gray-400">
            ללא תשלום מקוון — נאשר את ההזמנה ונתאם איתך משלוח.
          </p>
        </form>

        {/* Order summary */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-3 sticky top-24">
          <h2 className="font-semibold text-base text-gray-900 mb-3">סיכום הזמנה</h2>

          {items.map(item => (
            <div key={item.product.id} className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-50 border flex-shrink-0">
                <img
                  src={item.product.image_url || '/placeholder.svg'}
                  alt={item.product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg' }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.product.name}</p>
                <p className="text-xs text-gray-400">×{item.quantity}</p>
              </div>
              <p className="text-sm font-semibold text-gray-900 flex-shrink-0">
                ₪{(item.product.price * item.quantity).toFixed(2)}
              </p>
            </div>
          ))}

          <div className="border-t pt-3 flex justify-between items-center">
            <span className="font-semibold text-gray-700">סה״כ</span>
            <span className="text-xl font-bold text-blue-600">₪{totalPrice().toFixed(2)}</span>
          </div>
        </div>
      </div>
    </main>
  )
}
