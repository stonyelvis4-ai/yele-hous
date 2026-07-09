export type Category = 'Vetements' | 'Sacs' | 'Parfums' | 'Accessoires'
export type OrderStatus = 'En attente' | 'Livree' | 'Annulee'

export interface Collection {
  id: string
  name: string
  slug: string
  description: string
  image: string
  video?: string
  isFeatured?: boolean
  deletedAt?: string
}

export interface Product {
  id: string
  name: string
  category: Category
  collectionId?: string
  price: number
  compareAtPrice?: number
  description: string
  material: string
  colors: string[]
  sizes: string[]
  stock: number
  isBestSeller?: boolean
  image: string
  images: string[]
  video?: string
  deletedAt?: string
}

export interface CartItem {
  productId: string
  name: string
  price: number
  color: string
  size: string
  quantity: number
  image: string
}

export interface Order {
  id: string
  customerName: string
  phone: string
  commune: string
  notes: string
  items: CartItem[]
  subtotal: number
  shipping: number
  total: number
  status: OrderStatus
  createdAt: string
}

export interface Review {
  id: string
  author: string
  rating: number
  title: string
  body: string
  createdAt: string
  deletedAt?: string
}

export interface ContactMessage {
  id: string
  name: string
  phone: string
  topic: string
  message: string
  isRead: boolean
  createdAt: string
}

export interface DashboardStat {
  label: string
  value: string
  helper: string
}

export type ShippingRates = Record<string, number>
