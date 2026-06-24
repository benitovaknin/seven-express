'use client'

import Link from 'next/link'
import { ShoppingCart, Tag } from 'lucide-react'

export default function HeroBanner() {
  return (
    <section
      className="relative overflow-hidden rounded-none md:rounded-2xl mb-8"
      style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #1d4ed8 100%)' }}
    >
      {/* Background decoration circles */}
      <div className="absolute -top-20 -start-20 w-72 h-72 bg-white/5 rounded-full" />
      <div className="absolute -bottom-16 -end-16 w-96 h-96 bg-white/5 rounded-full" />
      <div className="absolute top-10 end-1/3 w-32 h-32 bg-red-600/20 rounded-full" />

      <div className="relative max-w-7xl mx-auto px-6 py-12 md:py-16 flex flex-col md:flex-row items-center gap-8">

        {/* Right side — text (RTL: text is on the right) */}
        <div className="flex-1 text-right order-1 md:order-2 z-10">
          {/* Heading */}
          <div className="mb-3">
            <div className="inline-block">
              <div className="text-4xl md:text-5xl font-extrabold text-white whitespace-nowrap leading-tight">
                Seven Express
              </div>
              <div className="text-sm md:text-base font-bold text-black uppercase tracking-[0.38em] text-center">
                MARKET BUSINESS
              </div>
            </div>
            <div className="text-2xl md:text-3xl font-bold text-blue-200 mt-1">
              החנות המהירה שלך
            </div>
          </div>

          {/* Description */}
          <p className="text-blue-100 text-base md:text-lg leading-relaxed mb-8 max-w-md ms-auto">
            מגוון עצום של מוצרים במחירים מיוחדים.
            <br />
            הכל במקום אחד, בקליק אחד.
          </p>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3 justify-end flex-wrap">
            <Link
              href="#products"
              onClick={(e) => {
                e.preventDefault()
                document.querySelector('main')?.scrollTo({ top: 300, behavior: 'smooth' })
                window.scrollTo({ top: 300, behavior: 'smooth' })
              }}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg hover:shadow-red-900/30 active:scale-95"
            >
              <ShoppingCart size={18} />
              התחל לקנות
            </Link>
            <Link
              href="/register"
              className="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white font-semibold px-6 py-3 rounded-xl border border-white/30 transition-all backdrop-blur-sm"
            >
              הרשמה חינם
            </Link>
          </div>
        </div>

        {/* Left side — image (RTL: image is on the left) */}
        <div className="flex-1 order-2 md:order-1 relative flex items-center justify-center">
          {/* Main image box */}
          <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-2xl overflow-hidden border-4 border-white/20 shadow-2xl">
            <img
              src="/hero.png"
              alt="Seven Express"
              className="w-full h-full object-contain bg-black"
              onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png' }}
            />
          </div>

          {/* Floating badge — bottom */}
          <div className="absolute bottom-0 start-0 md:-bottom-3 md:-start-3 bg-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Tag size={16} className="text-blue-600" />
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-gray-900">מחירים מיוחדים</p>
              <p className="text-[11px] text-gray-400">עסקים ופרטיים</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
