'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, ClipboardList, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'

interface OrderItem {
  id: string; quantity: number; unit_price: number
  product: { name: string; image_url: string | null }
}
interface Order {
  id: string; created_at: string; status: string; total_amount: number
  delivery_name: string; delivery_phone: string; delivery_city: string
  delivery_address: string; notes: string | null
  order_items: OrderItem[]
}

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  pending:   { label: 'ממתינה לאישור', cls: 'bg-amber-50 text-amber-600' },
  confirmed: { label: 'אושרה',         cls: 'bg-blue-50 text-blue-600' },
  delivered: { label: 'נמסרה',         cls: 'bg-green-50 text-green-600' },
  cancelled: { label: 'בוטלה',         cls: 'bg-red-50 text-red-400' },
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login?next=/orders'); return }
      supabase
        .from('orders')
        .select('*, order_items(*, product:products(name, image_url))')
        .eq('user_id', data.user.id)
        .order('created_at', { ascending: false })
        .then(({ data: ords }) => {
          setOrders((ords as Order[]) ?? [])
          setLoading(false)
        })
    })
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="animate-spin text-blue-500" size={36} />
    </div>
  )

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft size={16} /> חזרה לחנות
      </Link>

      <h1 className="text-2xl font-bold mb-6 text-gray-900">ההזמנות שלי</h1>

      {orders.length === 0 ? (
        <div className="text-center py-24">
          <ClipboardList size={56} className="mx-auto mb-4 text-gray-200" />
          <p className="text-gray-400 font-medium">אין לך הזמנות עדיין.</p>
          <Link href="/" className="mt-4 inline-block text-blue-600 hover:underline text-sm">התחל לקנות</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => {
            const isOpen = expanded === order.id
            const s = STATUS_MAP[order.status] ?? { label: order.status, cls: 'bg-gray-100 text-gray-500' }
            return (
              <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div
                  className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50/50"
                  onClick={() => setExpanded(isOpen ? null : order.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-bold text-gray-700">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </span>
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${s.cls}`}>
                        {s.label}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(order.created_at).toLocaleDateString('he-IL', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {order.order_items.length} פריטים
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-left">
                    <p className="font-bold text-blue-600">₪{order.total_amount.toFixed(2)}</p>
                  </div>
                  {isOpen
                    ? <ChevronUp size={16} className="text-gray-400 flex-shrink-0" />
                    : <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />
                  }
                </div>

                {isOpen && (
                  <div className="border-t border-gray-100 px-5 py-4 space-y-4">
                    <div className="grid sm:grid-cols-2 gap-2 text-sm">
                      <div><span className="text-gray-400">כתובת: </span><span className="font-medium">{order.delivery_address}, {order.delivery_city}</span></div>
                      <div><span className="text-gray-400">טלפון: </span><span className="font-medium">{order.delivery_phone}</span></div>
                      {order.notes && (
                        <div className="sm:col-span-2"><span className="text-gray-400">הערות: </span><span className="font-medium">{order.notes}</span></div>
                      )}
                    </div>

                    <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                      {order.order_items.map(item => (
                        <div key={item.id} className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg overflow-hidden bg-white border flex-shrink-0">
                            <img
                              src={item.product?.image_url || '/placeholder.svg'}
                              alt={item.product?.name}
                              className="w-full h-full object-cover"
                              onError={e => { (e.target as HTMLImageElement).src = '/placeholder.svg' }}
                            />
                          </div>
                          <span className="flex-1 text-sm text-gray-700">
                            {item.product?.name} <span className="text-gray-400">×{item.quantity}</span>
                          </span>
                          <span className="text-sm font-semibold">
                            ₪{(item.unit_price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
