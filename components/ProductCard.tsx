'use client'

import { useState } from 'react'
import { ShoppingCart, Plus, Minus, Check } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import type { Product } from '@/types'

export default function ProductCard({ product }: { product: Product }) {
  const { addItem, items, updateQuantity, removeItem } = useCartStore()
  const [imgSrc, setImgSrc] = useState(product.image_url || '/placeholder.svg')
  const [added, setAdded] = useState(false)

  const cartItem = items.find(i => i.product.id === product.id)
  const qty = cartItem?.quantity ?? 0
  const outOfStock = product.stock_quantity === 0

  function handleAdd() {
    if (outOfStock) return
    addItem(product)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  function increment() { addItem(product) }
  function decrement() {
    if (qty <= 1) removeItem(product.id)
    else updateQuantity(product.id, qty - 1)
  }

  const categoryName = (product as any).category?.name as string | undefined

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col">
      {/* Image */}
      <div className="relative bg-gray-50 aspect-square overflow-hidden">
        <img
          src={imgSrc}
          alt={product.name}
          onError={() => setImgSrc('/placeholder.svg')}
          className="w-full h-full object-contain p-3"
        />
        {outOfStock && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="text-sm font-bold text-gray-400">אזל המלאי</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 p-3 gap-2">
        <h3 className="text-sm font-bold text-gray-900 leading-snug line-clamp-2 min-h-[2.5rem]">
          {product.name}
        </h3>

        {product.description && (
          <p className="text-xs text-gray-400 line-clamp-1">{product.description}</p>
        )}

        <div className="mt-auto pt-2 border-t border-gray-100">
          <p className="text-base font-extrabold text-gray-900 mb-2">
            ₪{product.price.toFixed(2)}
          </p>

          {qty > 0 ? (
            <div className="flex items-center justify-between bg-green-500 rounded-xl overflow-hidden h-9">
              <button
                onClick={increment}
                className="w-9 h-9 flex items-center justify-center text-white hover:bg-green-600 transition-colors"
              >
                <Plus size={16} />
              </button>
              <span className="text-white font-bold text-sm">{qty}</span>
              <button
                onClick={decrement}
                className="w-9 h-9 flex items-center justify-center text-white hover:bg-green-600 transition-colors"
              >
                <Minus size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleAdd}
              disabled={outOfStock}
              className={`w-full h-9 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
                outOfStock
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : added
                  ? 'bg-green-500 text-white'
                  : 'bg-green-500 hover:bg-green-600 text-white active:scale-95'
              }`}
            >
              {added
                ? <><Check size={15} /> נוסף</>
                : <><ShoppingCart size={15} /> הוסף לסל</>
              }
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
