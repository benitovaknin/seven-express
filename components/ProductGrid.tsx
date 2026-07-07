'use client'

import { useState, useMemo } from 'react'
import type { Product, Category } from '@/types'
import ProductCard from './ProductCard'
import CategoryFilter from './CategoryFilter'
import { Search, X } from 'lucide-react'

interface Props {
  products: Product[]
  categories: Category[]
}

export default function ProductGrid({ products, categories }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    let result = products
    if (selectedCategory) {
      const subIds = categories
        .filter(c => c.parent_id === selectedCategory)
        .map(c => c.id)
      const ids = [selectedCategory, ...subIds]
      result = result.filter(p => ids.includes(p.category_id))
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.description ?? '').toLowerCase().includes(q)
      )
    }
    return result
  }, [products, categories, selectedCategory, search])

  const selectedName = search.trim()
    ? `תוצאות עבור "${search}"`
    : categories.find(c => c.id === selectedCategory)?.name ?? 'כל המוצרים'

  return (
    <div id="categories-section">
      {/* Search bar */}
      <div className="relative mb-4">
        <Search size={18} className="absolute top-1/2 -translate-y-1/2 end-3.5 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="חיפוש מוצר..."
          className="w-full border border-gray-200 rounded-xl px-4 pe-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute top-1/2 -translate-y-1/2 start-3 text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Category grid on top */}
      {!search && (
        <CategoryFilter
          categories={categories}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />
      )}

      {/* Results header */}
      <div className="flex items-baseline justify-between mb-5">
        <span className="text-sm text-gray-400">{filtered.length} מוצרים</span>
        <h2 className="text-xl font-bold text-gray-900">{selectedName}</h2>
      </div>

      {/* Product grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-24 text-gray-300">
          <p className="text-5xl mb-4">🔍</p>
          <p className="font-medium text-gray-500">{search ? 'לא נמצאו מוצרים.' : 'אין מוצרים בקטגוריה זו.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filtered.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
