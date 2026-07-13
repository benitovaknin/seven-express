export interface Category {
  id: string
  name: string
  slug: string
  image_url?: string
  sort_order: number
  parent_id?: string | null
  subcategories?: Category[]
}

export interface Product {
  id: string
  name: string
  description?: string
  price: number
  image_url?: string
  category_id: string
  category?: Category
  stock_quantity: number
  is_active: boolean
}

export interface CartItem {
  product: Product
  quantity: number
}

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'

export interface Order {
  id: string
  user_id: string
  status: OrderStatus
  total_amount: number
  delivery_name: string
  delivery_phone: string
  delivery_address: string
  delivery_city: string
  notes?: string
  created_at: string
  order_items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  product?: Product
  quantity: number
  unit_price: number
}
