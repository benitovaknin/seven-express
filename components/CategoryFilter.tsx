'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { Category } from '@/types'

interface Props {
  categories: Category[]
  selected: string | null
  onSelect: (id: string | null) => void
}

const COLORS = [
  'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200',
  'bg-sky-100 text-sky-700 border-sky-200 hover:bg-sky-200',
  'bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200',
  'bg-green-100 text-green-700 border-green-200 hover:bg-green-200',
  'bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200',
  'bg-pink-100 text-pink-700 border-pink-200 hover:bg-pink-200',
  'bg-teal-100 text-teal-700 border-teal-200 hover:bg-teal-200',
  'bg-red-100 text-red-700 border-red-200 hover:bg-red-200',
  'bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-200',
  'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200',
]

const ACTIVE_COLORS = [
  'bg-orange-500 text-white border-orange-500',
  'bg-sky-500 text-white border-sky-500',
  'bg-yellow-500 text-white border-yellow-500',
  'bg-green-500 text-white border-green-500',
  'bg-purple-500 text-white border-purple-500',
  'bg-pink-500 text-white border-pink-500',
  'bg-teal-500 text-white border-teal-500',
  'bg-red-500 text-white border-red-500',
  'bg-indigo-500 text-white border-indigo-500',
  'bg-amber-500 text-white border-amber-500',
]

export default function CategoryFilter({ categories, selected, onSelect }: Props) {
  const parents = categories.filter(c => !c.parent_id)
  const [expandedParent, setExpandedParent] = useState<string | null>(null)

  function handleParentClick(id: string) {
    const subs = categories.filter(c => c.parent_id === id)
    if (subs.length > 0) {
      setExpandedParent(prev => prev === id ? null : id)
      onSelect(id)
    } else {
      onSelect(id)
      setExpandedParent(null)
    }
  }

  const activeSubs = expandedParent
    ? categories.filter(c => c.parent_id === expandedParent)
    : selected
      ? categories.filter(c => c.parent_id === selected)
      : []

  return (
    <div className="mb-8">
      <div className="flex items-center justify-end mb-3">
        <span className="text-sm font-semibold text-gray-500">:סינון לפי קטגוריה</span>
      </div>

      {/* Parent categories grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2">
        {/* All products */}
        <button
          onClick={() => { onSelect(null); setExpandedParent(null) }}
          className={`flex flex-col items-center justify-center gap-1 px-2 py-3 rounded-xl border text-sm font-semibold transition-all ${
            selected === null
              ? 'bg-gray-800 text-white border-gray-800'
              : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
          }`}
        >
          <span className="text-lg">🛒</span>
          <span>הכל</span>
        </button>

        {parents.map((cat, i) => {
          const subs = categories.filter(c => c.parent_id === cat.id)
          const isActive = selected === cat.id || subs.some(s => s.id === selected)
          const colorIdx = i % COLORS.length
          return (
            <button
              key={cat.id}
              onClick={() => handleParentClick(cat.id)}
              className={`flex flex-col items-center justify-center gap-1 px-2 py-3 rounded-xl border text-sm font-semibold transition-all relative ${
                isActive ? ACTIVE_COLORS[colorIdx] : COLORS[colorIdx]
              }`}
            >
              <span className="text-lg">🏷️</span>
              <span className="text-center leading-tight">{cat.name}</span>
              {subs.length > 0 && (
                <ChevronDown
                  size={12}
                  className={`absolute bottom-1 left-1/2 -translate-x-1/2 opacity-60 transition-transform ${
                    expandedParent === cat.id ? 'rotate-180' : ''
                  }`}
                />
              )}
            </button>
          )
        })}
      </div>

      {/* Subcategories row */}
      {activeSubs.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-gray-100">
          {activeSubs.map((sub, i) => {
            const parentIdx = parents.findIndex(p => p.id === sub.parent_id) % COLORS.length
            return (
              <button
                key={sub.id}
                onClick={() => onSelect(sub.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  selected === sub.id ? ACTIVE_COLORS[parentIdx] : COLORS[parentIdx]
                }`}
              >
                {sub.name}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
