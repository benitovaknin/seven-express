'use client'

import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import { X, Download, Upload, CheckCircle2, AlertCircle, Loader2, FileSpreadsheet } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Category } from '@/types'

interface ImportRow {
  name: string
  description: string
  price: number
  stock_quantity: number
  category_name: string
  image_url: string
  _error?: string
}

interface Props {
  categories: Category[]
  onClose: () => void
  onDone: () => void
}

const HEADERS = ['שם מוצר', 'תיאור', 'מחיר', 'מלאי', 'קטגוריה', 'קישור תמונה']
const EXAMPLE = ['פיצה מרגריטה', 'פיצה טרייה עם גבינה', '45', '20', 'פיצות', '']

export default function ImportModal({ categories, onClose, onDone }: Props) {
  const [step, setStep] = useState<'start' | 'preview' | 'done'>('start')
  const [rows, setRows] = useState<ImportRow[]>([])
  const [importing, setImporting] = useState(false)
  const [imported, setImported] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  function downloadTemplate() {
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet([HEADERS, EXAMPLE])
    ws['!cols'] = [
      { wch: 22 }, { wch: 30 }, { wch: 10 },
      { wch: 10 }, { wch: 18 }, { wch: 45 },
    ]
    // Style header row bold (xlsx community edition supports limited styling)
    XLSX.utils.book_append_sheet(wb, ws, 'מוצרים')
    XLSX.writeFile(wb, 'תבנית_מוצרים.xlsx')
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const buffer = await file.arrayBuffer()
    const wb = XLSX.read(buffer, { type: 'array' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const raw = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '' })

    const parsed: ImportRow[] = raw.map((r, i) => {
      const name = (r['שם מוצר'] ?? r['name'] ?? '').toString().trim()
      const priceRaw = (r['מחיר'] ?? r['price'] ?? '').toString().replace(/[^\d.]/g, '')
      const price = parseFloat(priceRaw)
      const stock = parseInt((r['מלאי'] ?? r['stock_quantity'] ?? '0').toString()) || 0

      let error = ''
      if (!name) error = 'שם מוצר חסר'
      else if (isNaN(price) || price <= 0) error = 'מחיר לא תקין'

      return {
        name,
        description: (r['תיאור'] ?? r['description'] ?? '').toString().trim(),
        price: isNaN(price) ? 0 : price,
        stock_quantity: stock,
        category_name: (r['קטגוריה'] ?? r['category'] ?? '').toString().trim(),
        image_url: (r['קישור תמונה'] ?? r['image_url'] ?? '').toString().trim(),
        _error: error,
      }
    }).filter(r => r.name || r._error)

    setRows(parsed)
    setStep('preview')
  }

  async function handleImport() {
    const valid = rows.filter(r => !r._error)
    if (valid.length === 0) return
    setImporting(true)

    const catMap = Object.fromEntries(categories.map(c => [c.name.trim(), c.id]))
    let count = 0

    for (const row of valid) {
      const category_id = catMap[row.category_name] ?? null
      await supabase.from('products').insert({
        name: row.name,
        description: row.description || null,
        price: row.price,
        stock_quantity: row.stock_quantity,
        category_id,
        image_url: row.image_url || null,
        is_active: true,
      })
      count++
      setImported(count)
    }

    setImporting(false)
    setStep('done')
    onDone()
  }

  const validCount = rows.filter(r => !r._error).length
  const errorCount = rows.filter(r => r._error).length

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <div className="flex items-center gap-2">
              <FileSpreadsheet size={20} className="text-blue-500" />
              <h2 className="font-bold text-base">ייבוא מוצרים מאקסל</h2>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">

            {/* ── Step 1: Start ── */}
            {step === 'start' && (
              <div className="p-6 space-y-6">
                {/* Step 1 */}
                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 mb-1">הורד את תבנית האקסל</p>
                    <p className="text-sm text-gray-500 mb-3">מלא את פרטי המוצרים לפי עמודות התבנית ושמור.</p>
                    <button
                      onClick={downloadTemplate}
                      className="flex items-center gap-2 border border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                    >
                      <Download size={16} /> הורד תבנית (xlsx)
                    </button>
                  </div>
                </div>

                {/* Column explanation */}
                <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1.5">
                  <p className="font-semibold text-gray-700 mb-2">עמודות בתבנית:</p>
                  {[
                    ['שם מוצר', 'חובה — שם המוצר'],
                    ['תיאור', 'אופציונלי — תיאור קצר'],
                    ['מחיר', 'חובה — מספר (לדוגמה: 29.90)'],
                    ['מלאי', 'אופציונלי — כמות (ברירת מחדל: 0)'],
                    ['קטגוריה', 'אופציונלי — חייב להתאים לשם קטגוריה קיימת'],
                    ['קישור תמונה', 'אופציונלי — URL של תמונה'],
                  ].map(([col, desc]) => (
                    <div key={col} className="flex gap-2">
                      <code className="text-xs bg-white border border-gray-200 px-2 py-0.5 rounded font-medium text-gray-700 w-28 flex-shrink-0">{col}</code>
                      <span className="text-gray-500">{desc}</span>
                    </div>
                  ))}
                </div>

                {/* Step 2 */}
                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 mb-1">העלה את הקובץ המלא</p>
                    <p className="text-sm text-gray-500 mb-3">קובץ xlsx או csv — עד 500 מוצרים בבת אחת.</p>
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                    >
                      <Upload size={16} /> בחר קובץ
                    </button>
                    <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} />
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 2: Preview ── */}
            {step === 'preview' && (
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3 flex-wrap">
                  {validCount > 0 && (
                    <span className="flex items-center gap-1.5 text-sm bg-blue-50 text-blue-700 font-semibold px-3 py-1.5 rounded-full">
                      <CheckCircle2 size={15} /> {validCount} מוצרים תקינים
                    </span>
                  )}
                  {errorCount > 0 && (
                    <span className="flex items-center gap-1.5 text-sm bg-red-50 text-red-600 font-semibold px-3 py-1.5 rounded-full">
                      <AlertCircle size={15} /> {errorCount} שורות עם שגיאה
                    </span>
                  )}
                </div>

                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="text-right px-4 py-2.5 font-semibold text-gray-500 text-xs">#</th>
                        <th className="text-right px-4 py-2.5 font-semibold text-gray-500 text-xs">שם מוצר</th>
                        <th className="text-right px-4 py-2.5 font-semibold text-gray-500 text-xs hidden sm:table-cell">מחיר</th>
                        <th className="text-right px-4 py-2.5 font-semibold text-gray-500 text-xs hidden sm:table-cell">מלאי</th>
                        <th className="text-right px-4 py-2.5 font-semibold text-gray-500 text-xs hidden sm:table-cell">קטגוריה</th>
                        <th className="px-4 py-2.5" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {rows.map((row, i) => (
                        <tr key={i} className={row._error ? 'bg-red-50/50' : 'hover:bg-gray-50/50'}>
                          <td className="px-4 py-2.5 text-gray-400 text-xs">{i + 1}</td>
                          <td className="px-4 py-2.5 font-medium text-gray-900">
                            {row.name || <span className="text-red-400 italic">ריק</span>}
                          </td>
                          <td className="px-4 py-2.5 text-gray-700 hidden sm:table-cell">
                            {row.price > 0 ? `₪${row.price.toFixed(2)}` : <span className="text-red-400">—</span>}
                          </td>
                          <td className="px-4 py-2.5 text-gray-500 hidden sm:table-cell">{row.stock_quantity}</td>
                          <td className="px-4 py-2.5 hidden sm:table-cell">
                            {row.category_name ? (
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                categories.some(c => c.name === row.category_name)
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'bg-amber-50 text-amber-600'
                              }`}>
                                {row.category_name}
                                {!categories.some(c => c.name === row.category_name) && ' ⚠'}
                              </span>
                            ) : <span className="text-gray-300">—</span>}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            {row._error
                              ? <span className="text-xs text-red-500">{row._error}</span>
                              : <CheckCircle2 size={15} className="text-green-400 mr-auto" />
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {importing && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Loader2 size={16} className="animate-spin text-blue-500" />
                    מייבא {imported} מתוך {validCount}…
                  </div>
                )}
              </div>
            )}

            {/* ── Step 3: Done ── */}
            {step === 'done' && (
              <div className="p-10 text-center">
                <CheckCircle2 size={56} className="mx-auto text-blue-500 mb-4" />
                <h3 className="text-xl font-bold mb-2">הייבוא הושלם!</h3>
                <p className="text-gray-500">יובאו {imported} מוצרים בהצלחה.</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t flex gap-3 justify-end">
            {step === 'start' && (
              <button onClick={onClose} className="px-4 py-2.5 rounded-xl border text-gray-500 hover:bg-gray-50 transition-colors text-sm">
                סגור
              </button>
            )}
            {step === 'preview' && (
              <>
                <button onClick={() => { setStep('start'); setRows([]) }} className="px-4 py-2.5 rounded-xl border text-gray-500 hover:bg-gray-50 transition-colors text-sm">
                  חזור
                </button>
                <button
                  onClick={handleImport}
                  disabled={importing || validCount === 0}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
                >
                  {importing
                    ? <><Loader2 size={15} className="animate-spin" /> מייבא…</>
                    : <><CheckCircle2 size={15} /> ייבא {validCount} מוצרים</>
                  }
                </button>
              </>
            )}
            {step === 'done' && (
              <button onClick={onClose} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm">
                סגור
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
