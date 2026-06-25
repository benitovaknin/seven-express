'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Product, Category } from '@/types'
import {
  Pencil, X, ArrowLeft, Upload, Loader2,
  Plus, Check, ImageIcon, Trash2, PackageOpen, Link2,
  Tag, ShoppingBag, FileSpreadsheet, ClipboardList, ChevronDown, ChevronUp,
} from 'lucide-react'
import ImportModal from '@/components/ImportModal'

/* ─── Product form ─── */
interface ProductForm {
  name: string; description: string; price: string
  stock_quantity: string; category_id: string; image_url: string
}
const EMPTY_PRODUCT: ProductForm = {
  name: '', description: '', price: '', stock_quantity: '0', category_id: '', image_url: '',
}

/* ─── Category form ─── */
interface CatForm { name: string; slug: string; sort_order: string; parent_id: string }
const EMPTY_CAT: CatForm = { name: '', slug: '', sort_order: '0', parent_id: '' }

function toSlug(str: string) {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') || `cat-${Date.now()}`
}

interface OrderItem { id: string; quantity: number; unit_price: number; product: { name: string } }
interface Order {
  id: string; created_at: string; status: string; total_amount: number
  delivery_name: string; delivery_phone: string; delivery_city: string
  delivery_address: string; notes: string | null
  order_items?: OrderItem[]
}

export default function AdminPage() {
  const [section, setSection] = useState<'products' | 'categories' | 'orders'>('products')

  /* products */
  const [products, setProducts] = useState<Product[]>([])
  const [editingProduct, setEditingProduct] = useState<string | 'new' | null>(null)
  const [productForm, setProductForm] = useState<ProductForm>(EMPTY_PRODUCT)
  const [imagePreview, setImagePreview] = useState('')
  const [urlInput, setUrlInput] = useState('')
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [imageTab, setImageTab] = useState<'upload' | 'url'>('upload')

  /* categories */
  const [categories, setCategories] = useState<Category[]>([])
  const [editingCat, setEditingCat] = useState<string | 'new' | null>(null)
  const [catForm, setCatForm] = useState<CatForm>(EMPTY_CAT)

  /* orders */
  const [orders, setOrders] = useState<Order[]>([])
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)

  /* shared */
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showImport, setShowImport] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login?next=/admin'); return }
    const admins = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',').map(e => e.trim()) ?? []
    if (admins.length > 0 && !admins.includes(user.email ?? '')) {
      router.push('/'); return
    }
    await loadAll()
    setLoading(false)
  }

  async function loadAll() {
    const [{ data: prods }, { data: cats }, { data: ords }] = await Promise.all([
      supabase.from('products').select('*, category:categories(*)').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('orders').select('*, order_items(*, product:products(name))').order('created_at', { ascending: false }),
    ])
    setProducts(prods ?? [])
    setCategories(cats ?? [])
    setOrders(ords ?? [])
  }

  async function updateOrderStatus(orderId: string, status: string) {
    await supabase.from('orders').update({ status }).eq('id', orderId)
    await loadAll()
  }

  /* ──────────── Product helpers ──────────── */
  function openNewProduct() {
    setEditingProduct('new')
    setProductForm(EMPTY_PRODUCT)
    setImagePreview(''); setUrlInput(''); setImageTab('upload')
  }
  function openEditProduct(p: Product) {
    setEditingProduct(p.id)
    setProductForm({
      name: p.name, description: p.description ?? '',
      price: p.price.toString(), stock_quantity: p.stock_quantity.toString(),
      category_id: p.category_id ?? '', image_url: p.image_url ?? '',
    })
    setImagePreview(p.image_url ?? '')
    setUrlInput(p.image_url ?? '')
    setImageTab(p.image_url ? 'url' : 'upload')
  }
  function closeProduct() {
    setEditingProduct(null); setProductForm(EMPTY_PRODUCT)
    setImagePreview(''); setUrlInput('')
  }

  async function uploadFile(file: File) {
    const reader = new FileReader()
    reader.onload = (ev) => setImagePreview(ev.target?.result as string)
    reader.readAsDataURL(file)
    setUploading(true)
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('photos').upload(path, file, { upsert: true })
    if (error) { alert('העלאה נכשלה: ' + error.message); setUploading(false); return }
    const { data } = supabase.storage.from('photos').getPublicUrl(path)
    setProductForm(f => ({ ...f, image_url: data.publicUrl }))
    setImagePreview(data.publicUrl); setUrlInput(data.publicUrl)
    setUploading(false)
  }

  function toPublicUrl(url: string) {
    return url.replace('/object/sign/', '/object/public/').split('?')[0]
  }
  function confirmUrl() {
    const url = toPublicUrl(urlInput.trim())
    setUrlInput(url); setProductForm(f => ({ ...f, image_url: url })); setImagePreview(url)
  }

  async function saveProduct() {
    if (!productForm.name || !productForm.price) return
    setSaving(true)
    const payload = {
      name: productForm.name.trim(),
      description: productForm.description.trim() || null,
      price: parseFloat(productForm.price),
      stock_quantity: parseInt(productForm.stock_quantity) || 0,
      category_id: productForm.category_id || null,
      image_url: productForm.image_url || null,
    }
    const { error } = editingProduct === 'new'
      ? await supabase.from('products').insert({ ...payload, is_active: true })
      : await supabase.from('products').update(payload).eq('id', editingProduct!)
    if (error) alert('שמירה נכשלה: ' + error.message)
    else { await loadAll(); closeProduct() }
    setSaving(false)
  }

  async function deleteProduct(id: string, name: string) {
    if (!confirm(`למחוק את "${name}"?`)) return
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) { alert('מחיקה נכשלה: ' + error.message); return }
    await loadAll(); closeProduct()
  }

  /* ──────────── Category helpers ──────────── */
  function openNewCat() {
    setEditingCat('new')
    setCatForm({ name: '', slug: '', sort_order: String(categories.length), parent_id: '' })
  }
  function openEditCat(c: Category) {
    setEditingCat(c.id)
    setCatForm({ name: c.name, slug: c.slug, sort_order: String(c.sort_order), parent_id: c.parent_id ?? '' })
  }
  function closeCat() { setEditingCat(null); setCatForm(EMPTY_CAT) }

  async function saveCat() {
    if (!catForm.name) return
    setSaving(true)
    const slug = catForm.slug.trim() || toSlug(catForm.name)
    const payload = {
      name: catForm.name.trim(),
      slug,
      sort_order: parseInt(catForm.sort_order) || 0,
      parent_id: catForm.parent_id || null,
    }
    const { error } = editingCat === 'new'
      ? await supabase.from('categories').insert(payload)
      : await supabase.from('categories').update(payload).eq('id', editingCat!)
    if (error) alert('שמירה נכשלה: ' + error.message)
    else { await loadAll(); closeCat() }
    setSaving(false)
  }

  async function deleteCat(id: string, name: string) {
    if (!confirm(`למחוק את הקטגוריה "${name}"?\nכל המוצרים בקטגוריה זו יישארו ללא קטגוריה.`)) return
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) { alert('מחיקה נכשלה: ' + error.message); return }
    await loadAll(); closeCat()
  }

  const setP = (f: keyof ProductForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setProductForm(prev => ({ ...prev, [f]: e.target.value }))

  const inputCls = 'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition'

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="animate-spin text-blue-500" size={36} />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-gray-400 hover:text-gray-700 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-lg font-bold text-gray-900">ניהול חנות</h1>
        </div>
        <div className="flex items-center gap-2">
          {section === 'products' && (
            <button
              onClick={() => setShowImport(true)}
              className="flex items-center gap-2 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              <FileSpreadsheet size={16} /> ייבוא מאקסל
            </button>
          )}
          <button
            onClick={section === 'products' ? openNewProduct : openNewCat}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            <Plus size={16} />
            {section === 'products' ? 'הוסף מוצר' : 'הוסף קטגוריה'}
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b px-6">
        <div className="flex gap-0 max-w-5xl mx-auto">
          {([['products', <ShoppingBag size={15} />, 'מוצרים'], ['categories', <Tag size={15} />, 'קטגוריות'], ['orders', <ClipboardList size={15} />, 'הזמנות']] as const).map(([key, icon, label]) => (
            <button
              key={key}
              onClick={() => setSection(key)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold border-b-2 transition-colors ${
                section === key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {icon} {label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                section === key ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {key === 'products' ? products.length : key === 'categories' ? categories.length : orders.length}
              </span>
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-8">

        {/* ── Products ── */}
        {section === 'products' && (
          products.length === 0 ? (
            <div className="text-center py-24">
              <PackageOpen size={56} className="mx-auto mb-4 text-gray-200" />
              <p className="text-gray-400 font-medium">אין מוצרים — לחץ "הוסף מוצר" למעלה.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3.5 w-full">מוצר</th>
                    <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3.5 whitespace-nowrap">מחיר</th>
                    <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3.5 hidden sm:table-cell whitespace-nowrap">מלאי</th>
                    <th className="px-5 py-3.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {products.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100">
                            {p.image_url
                              ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).src = '/placeholder.svg' }} />
                              : <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon size={18} /></div>
                            }
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{p.name}</p>
                            {p.description && <p className="text-xs text-gray-400 truncate max-w-xs">{p.description}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm font-bold text-blue-600 whitespace-nowrap">₪{p.price.toFixed(2)}</td>
                      <td className="px-5 py-3.5 hidden sm:table-cell">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          p.stock_quantity === 0 ? 'bg-red-50 text-red-500'
                          : p.stock_quantity < 10 ? 'bg-amber-50 text-amber-600'
                          : 'bg-green-50 text-green-600'
                        }`}>
                          {p.stock_quantity === 0 ? 'אזל המלאי' : `נותרו ${p.stock_quantity}`}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button onClick={() => openEditProduct(p)} className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors mr-auto">
                          <Pencil size={14} /> עריכה
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* ── Categories ── */}
        {section === 'categories' && (
          categories.length === 0 ? (
            <div className="text-center py-24">
              <Tag size={56} className="mx-auto mb-4 text-gray-200" />
              <p className="text-gray-400 font-medium">אין קטגוריות — לחץ "הוסף קטגוריה" למעלה.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3.5">שם הקטגוריה</th>
                    <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3.5 hidden sm:table-cell">מזהה (slug)</th>
                    <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3.5 hidden sm:table-cell">סדר</th>
                    <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3.5">מוצרים</th>
                    <th className="px-5 py-3.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {categories.filter(c => !c.parent_id).map(parent => {
                    const subs = categories.filter(c => c.parent_id === parent.id)
                    const count = products.filter(p => p.category_id === parent.id).length
                    return (
                      <>
                        <tr key={parent.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                                <Tag size={14} className="text-blue-500" />
                              </div>
                              <span className="text-sm font-semibold text-gray-900">{parent.name}</span>
                              {subs.length > 0 && (
                                <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{subs.length} תתי-קטגוריות</span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-4 hidden sm:table-cell">
                            <code className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-lg">{parent.slug}</code>
                          </td>
                          <td className="px-5 py-4 hidden sm:table-cell">
                            <span className="text-sm text-gray-500">{parent.sort_order}</span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-sm font-semibold text-gray-700">{count}</span>
                            <span className="text-xs text-gray-400 me-1"> מוצרים</span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <button onClick={() => openEditCat(parent)} className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors mr-auto">
                              <Pencil size={14} /> עריכה
                            </button>
                          </td>
                        </tr>
                        {subs.map(sub => {
                          const subCount = products.filter(p => p.category_id === sub.id).length
                          return (
                            <tr key={sub.id} className="hover:bg-gray-50/40 transition-colors bg-gray-50/30">
                              <td className="px-5 py-3">
                                <div className="flex items-center gap-2 pe-4 border-e-2 border-gray-200 ms-6">
                                  <div className="w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0">
                                    <Tag size={11} className="text-gray-400" />
                                  </div>
                                  <span className="text-sm text-gray-600">{sub.name}</span>
                                </div>
                              </td>
                              <td className="px-5 py-3 hidden sm:table-cell">
                                <code className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-lg">{sub.slug}</code>
                              </td>
                              <td className="px-5 py-3 hidden sm:table-cell">
                                <span className="text-sm text-gray-400">{sub.sort_order}</span>
                              </td>
                              <td className="px-5 py-3">
                                <span className="text-sm text-gray-600">{subCount}</span>
                                <span className="text-xs text-gray-400 me-1"> מוצרים</span>
                              </td>
                              <td className="px-5 py-3 text-right">
                                <button onClick={() => openEditCat(sub)} className="flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors mr-auto">
                                  <Pencil size={13} /> עריכה
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )
        )}
        {/* ── Orders ── */}
        {section === 'orders' && (
          orders.length === 0 ? (
            <div className="text-center py-24">
              <ClipboardList size={56} className="mx-auto mb-4 text-gray-200" />
              <p className="text-gray-400 font-medium">אין הזמנות עדיין.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map(order => {
                const isExpanded = expandedOrder === order.id
                const statusMap: Record<string, { label: string; cls: string }> = {
                  pending: { label: 'ממתינה', cls: 'bg-amber-50 text-amber-600' },
                  confirmed: { label: 'אושרה', cls: 'bg-blue-50 text-blue-600' },
                  delivered: { label: 'נמסרה', cls: 'bg-green-50 text-green-600' },
                  cancelled: { label: 'בוטלה', cls: 'bg-red-50 text-red-400' },
                }
                const s = statusMap[order.status] ?? { label: order.status, cls: 'bg-gray-100 text-gray-500' }
                return (
                  <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50/50" onClick={() => setExpandedOrder(isExpanded ? null : order.id)}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-sm font-bold text-gray-700">#{order.id.slice(0,8).toUpperCase()}</span>
                          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>
                          <span className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString('he-IL', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-0.5">{order.delivery_name} · {order.delivery_phone} · {order.delivery_city}</p>
                      </div>
                      <div className="text-left flex-shrink-0">
                        <p className="font-bold text-blue-600">₪{order.total_amount.toFixed(2)}</p>
                      </div>
                      {isExpanded ? <ChevronUp size={16} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />}
                    </div>

                    {isExpanded && (
                      <div className="border-t border-gray-100 px-5 py-4 space-y-4">
                        <div className="grid sm:grid-cols-2 gap-3 text-sm">
                          <div><span className="text-gray-400">כתובת: </span><span className="font-medium">{order.delivery_address}, {order.delivery_city}</span></div>
                          <div><span className="text-gray-400">טלפון: </span><span className="font-medium">{order.delivery_phone}</span></div>
                          {order.notes && <div className="sm:col-span-2"><span className="text-gray-400">הערות: </span><span className="font-medium">{order.notes}</span></div>}
                        </div>

                        {order.order_items && order.order_items.length > 0 && (
                          <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                            {order.order_items.map(item => (
                              <div key={item.id} className="flex justify-between text-sm">
                                <span className="text-gray-700">{item.product?.name ?? 'מוצר'} <span className="text-gray-400">×{item.quantity}</span></span>
                                <span className="font-semibold">₪{(item.unit_price * item.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex gap-2 flex-wrap">
                          {['pending','confirmed','delivered','cancelled'].map(st => (
                            <button key={st} onClick={() => updateOrderStatus(order.id, st)}
                              className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${order.status === st ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-500 hover:border-blue-400 hover:text-blue-600'}`}>
                              {statusMap[st]?.label ?? st}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )
        )}

      </main>

      {/* ═══════════ Product Modal ═══════════ */}
      {editingProduct && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={closeProduct} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[92vh] overflow-y-auto flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white rounded-t-2xl z-10">
                <h2 className="font-bold text-base">{editingProduct === 'new' ? 'הוספת מוצר חדש' : 'עריכת מוצר'}</h2>
                <button onClick={closeProduct} className="p-2 rounded-full hover:bg-gray-100"><X size={18} /></button>
              </div>

              <div className="p-6 space-y-5 flex-1">
                {/* Image tabs */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">תמונה</label>
                  <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-3">
                    {(['upload', 'url'] as const).map(tab => (
                      <button key={tab} type="button" onClick={() => setImageTab(tab)}
                        className={`flex-1 flex items-center justify-center gap-1.5 text-sm py-2 rounded-lg font-medium transition-colors ${imageTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
                        {tab === 'upload' ? <><Upload size={14} /> העלאת קובץ</> : <><Link2 size={14} /> הדבקת קישור</>}
                      </button>
                    ))}
                  </div>

                  {imageTab === 'upload' ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f?.type.startsWith('image/')) uploadFile(f) }}
                      className={`relative h-44 rounded-xl border-2 border-dashed transition-colors cursor-pointer overflow-hidden flex items-center justify-center group ${dragOver ? 'border-green-400 bg-blue-50' : 'border-gray-200 hover:border-green-400 bg-gray-50'}`}
                    >
                      {imagePreview ? (
                        <>
                          <img src={imagePreview} alt="תצוגה מקדימה" className="w-full h-full object-cover" onError={() => setImagePreview('')} />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-sm font-semibold flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-lg">
                              <Upload size={14} /> החלף תמונה
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="text-center select-none pointer-events-none">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 ${dragOver ? 'bg-blue-100' : 'bg-gray-100'}`}>
                            <Upload size={24} className={dragOver ? 'text-blue-500' : 'text-gray-400'} />
                          </div>
                          <p className="text-sm font-semibold text-gray-600">{dragOver ? 'שחרר כאן' : 'גרור תמונה לכאן'}</p>
                          <p className="text-xs mt-1 text-gray-400">או לחץ לבחירת קובץ</p>
                          <p className="text-xs mt-0.5 text-gray-300">JPG · PNG · WEBP</p>
                        </div>
                      )}
                      {uploading && (
                        <div className="absolute inset-0 bg-white/85 flex items-center justify-center gap-2">
                          <Loader2 size={24} className="animate-spin text-blue-500" />
                          <span className="text-sm font-medium text-gray-600">מעלה תמונה…</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <input type="url" value={urlInput} onChange={e => setUrlInput(e.target.value)}
                          onPaste={e => { const raw = e.clipboardData.getData('text').trim(); const url = toPublicUrl(raw); setUrlInput(url); setTimeout(() => { setProductForm(f => ({ ...f, image_url: url })); setImagePreview(url) }, 0) }}
                          className={inputCls + ' flex-1'} placeholder="https://example.com/image.jpg" />
                        <button type="button" onClick={confirmUrl} className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors whitespace-nowrap">אישור</button>
                      </div>
                      {imagePreview && (
                        <div className="h-36 rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
                          <img src={imagePreview} alt="תצוגה מקדימה" className="w-full h-full object-cover" onError={() => setImagePreview('')} />
                        </div>
                      )}
                      {urlInput && !imagePreview && <p className="text-xs text-red-400">הקישור לא תקין או שהתמונה לא נטענת</p>}
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f) }} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">שם המוצר <span className="text-red-400">*</span></label>
                  <input value={productForm.name} onChange={setP('name')} className={inputCls} placeholder="לדוגמה: חטיף שקדים" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">תיאור</label>
                  <textarea value={productForm.description} onChange={setP('description')} rows={2} className={inputCls} placeholder="תיאור קצר של המוצר" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">מחיר (₪) <span className="text-red-400">*</span></label>
                    <input type="number" step="0.01" min="0" value={productForm.price} onChange={setP('price')} className={inputCls} placeholder="0.00" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">מלאי</label>
                    <input type="number" min="0" value={productForm.stock_quantity} onChange={setP('stock_quantity')} className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">קטגוריה</label>
                  <select value={productForm.category_id} onChange={setP('category_id')} className={inputCls}>
                    <option value="">— ללא קטגוריה —</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="px-6 py-4 border-t flex gap-3 sticky bottom-0 bg-white rounded-b-2xl">
                <button onClick={saveProduct} disabled={saving || uploading || !productForm.name || !productForm.price}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-2.5 rounded-xl transition-colors">
                  {saving ? <><Loader2 size={16} className="animate-spin" /> שומר…</> : <><Check size={16} /> {editingProduct === 'new' ? 'הוסף מוצר' : 'שמור שינויים'}</>}
                </button>
                {editingProduct !== 'new' && (
                  <button onClick={() => deleteProduct(editingProduct!, productForm.name)}
                    className="px-4 py-2.5 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors border border-transparent hover:border-red-100">
                    <Trash2 size={18} />
                  </button>
                )}
                <button onClick={closeProduct} className="px-4 py-2.5 rounded-xl border text-gray-500 hover:bg-gray-50 transition-colors">ביטול</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ═══════════ Import Modal ═══════════ */}
      {showImport && (
        <ImportModal
          categories={categories}
          onClose={() => setShowImport(false)}
          onDone={() => { loadAll(); setShowImport(false) }}
        />
      )}

      {/* ═══════════ Category Modal ═══════════ */}
      {editingCat && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={closeCat} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <h2 className="font-bold text-base">{editingCat === 'new' ? 'הוספת קטגוריה' : 'עריכת קטגוריה'}</h2>
                <button onClick={closeCat} className="p-2 rounded-full hover:bg-gray-100"><X size={18} /></button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">שם הקטגוריה <span className="text-red-400">*</span></label>
                  <input
                    value={catForm.name}
                    onChange={e => {
                      const name = e.target.value
                      setCatForm(f => ({
                        ...f, name,
                        slug: f.slug || toSlug(name),
                      }))
                    }}
                    className={inputCls}
                    placeholder="לדוגמה: חטיפים בריאים"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    מזהה (slug)
                    <span className="text-gray-400 font-normal text-xs me-2"> — לשימוש פנימי</span>
                  </label>
                  <input
                    value={catForm.slug}
                    onChange={e => setCatForm(f => ({ ...f, slug: e.target.value }))}
                    className={inputCls + ' font-mono text-xs'}
                    placeholder="healthy-snacks"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">קטגוריית אב</label>
                  <select
                    value={catForm.parent_id}
                    onChange={e => setCatForm(f => ({ ...f, parent_id: e.target.value }))}
                    className={inputCls}
                  >
                    <option value="">— קטגוריה ראשית (ללא אב) —</option>
                    {categories
                      .filter(c => !c.parent_id && c.id !== editingCat)
                      .map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                    }
                  </select>
                  <p className="text-xs text-gray-400 mt-1">בחר קטגוריה אב כדי להפוך את זו לתת-קטגוריה</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">סדר תצוגה</label>
                  <input
                    type="number" min="0"
                    value={catForm.sort_order}
                    onChange={e => setCatForm(f => ({ ...f, sort_order: e.target.value }))}
                    className={inputCls}
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-400 mt-1">מספר נמוך = מופיע ראשון בסרגל הקטגוריות</p>
                </div>
              </div>

              <div className="px-6 py-4 border-t flex gap-3">
                <button onClick={saveCat} disabled={saving || !catForm.name}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-2.5 rounded-xl transition-colors">
                  {saving ? <><Loader2 size={16} className="animate-spin" /> שומר…</> : <><Check size={16} /> {editingCat === 'new' ? 'הוסף קטגוריה' : 'שמור'}</>}
                </button>
                {editingCat !== 'new' && (
                  <button onClick={() => deleteCat(editingCat!, catForm.name)}
                    className="px-4 py-2.5 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors border border-transparent hover:border-red-100">
                    <Trash2 size={18} />
                  </button>
                )}
                <button onClick={closeCat} className="px-4 py-2.5 rounded-xl border text-gray-500 hover:bg-gray-50 transition-colors">ביטול</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
