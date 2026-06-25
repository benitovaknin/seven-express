'use client'

import { useState, useMemo } from 'react'
import type { Product, Category } from '@/types'
import ProductCard from './ProductCard'
import CategoryFilter from './CategoryFilter'

interface Props {
  products: Product[]
  categories: Category[]
}

export default function ProductGrid({ products, categories }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const filtered = useMemo(() => {
    if (!selectedCategory) return products
    const subIds = categories
      .filter(c => c.parent_id === selectedCategory)
      .map(c => c.id)
    const ids = [selectedCategory, ...subIds]
    return products.filter(p => ids.includes(p.category_id))
  }, [products, categories, selectedCategory])

  const selectedName =
    categories.find(c => c.id === selectedCategory)?.name ?? 'כל המוצרים'

  return (
    <div id="categories-section">
      {/* Category grid on top */}
      <CategoryFilter
        categories={categories}
        selected={selectedCategory}
        onSelect={setSelectedCategory}
      />

      {/* Results header */}
      <div className="flex items-baseline justify-between mb-5">
        <span className="text-sm text-gray-400">{filtered.length} מוצרים</span>
        <h2 className="text-xl font-bold text-gray-900">{selectedName}</h2>
      </div>

      {/* Product grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-24 text-gray-300">
          <p className="text-5xl mb-4">🛒</p>
          <p className="font-medium text-gray-500">אין מוצרים בקטגוריה זו.</p>
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
