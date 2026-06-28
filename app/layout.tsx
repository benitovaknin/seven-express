import type { Metadata } from 'next'
import { Heebo } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'

const heebo = Heebo({ subsets: ['hebrew', 'latin'] })

export const metadata: Metadata = {
  title: 'גרינשופ — מוצרים בריאים',
  description: 'חטיפים בריאים, חלבון ומשקאות.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body className={`${heebo.className} bg-gray-50 min-h-screen`}>
        <Navbar />
        {children}
      </body>
    </html>
  )
}
