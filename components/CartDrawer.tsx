'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, totalPrice } =
    useCartStore()

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted || !isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Drawer — slides in from the right (start side in Hebrew) */}
      <aside
        role="dialog"
        aria-label="סל קניות"
        className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 flex flex-col shadow-2xl animate-slide-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <ShoppingBag size={20} className="text-blue-500" />
            סל קניות
            {items.length > 0 && (
              <span className="text-sm font-normal text-gray-400">
                ({items.reduce((s, i) => s + i.quantity, 0)} פריטים)
              </span>
            )}
          </h2>
          <button
            onClick={closeCart}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="סגור סל"
          >
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-300 pb-20">
              <ShoppingBag size={56} className="mb-4 opacity-40" />
              <p className="text-base font-medium text-gray-400">הסל ריק</p>
              <button
                onClick={closeCart}
                className="mt-4 text-sm text-blue-600 hover:underline"
              >
                המשך קניות
              </button>
            </div>
          ) : (
            items.map(item => (
              <div key={item.product.id} className="flex gap-3 items-start">
                {/* Thumbnail */}
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0 border">
                  <img
                    src={item.product.image_url || '/placeholder.svg'}
                    onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg' }}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug">
                    {item.product.name}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    ₪{item.product.price.toFixed(2)} ליחידה
                  </p>

                  <div className="flex items-center gap-3 mt-2">
                    {/* Quantity stepper */}
                    <div className="flex items-center border rounded-lg overflow-hidden text-gray-700">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="px-2.5 py-1.5 hover:bg-gray-100 transition-colors"
                        aria-label="הפחת כמות"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="px-3 text-sm font-semibold select-none">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="px-2.5 py-1.5 hover:bg-gray-100 transition-colors"
                        aria-label="הוסף כמות"
                      >
                        <Plus size={13} />
                      </button>
                    </div>

                    <button
                      onClick={() => removeItem(item.product.id)}
                      className="text-gray-300 hover:text-red-400 transition-colors"
                      aria-label="הסר מוצר"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Line total */}
                <p className="text-sm font-bold text-gray-900 flex-shrink-0">
                  ₪{(item.product.price * item.quantity).toFixed(2)}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-5 py-5 border-t bg-gray-50 space-y-3">
            <div className="flex justify-between text-base">
              <span className="text-gray-600 font-medium">סה״כ</span>
              <span className="font-bold text-xl text-gray-900">
                ₪{totalPrice().toFixed(2)}
              </span>
            </div>
            <Link
              href="/checkout"
              onClick={closeCart}
              className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl transition-colors text-base"
            >
              המשך לתשלום
            </Link>
            <button
              onClick={closeCart}
              className="block w-full text-center text-sm text-gray-400 hover:text-gray-600 py-1"
            >
              המשך קניות
            </button>
          </div>
        )}
      </aside>
    </>
  )
}
