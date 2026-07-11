import { CartItem, CartValidationResult, Collection, ContactMessage, DeliveryCommune, Order, OrderStatus, Product, Review, ShippingRates } from '../types'

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api'

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {})
    },
    ...init
  })

  if (!response.ok) {
    let message = `API request failed for ${path}`

    try {
      const payload = (await response.json()) as { error?: string; message?: string }
      message = payload.error ?? payload.message ?? message
    } catch {
      // Keep the default message when the response body is empty or invalid.
    }

    throw new ApiError(message, response.status)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

export function fetchPublicBootstrap() {
  return request<{
    collections: Collection[]
    products: Product[]
    reviews: Review[]
    deliveryCommunes: DeliveryCommune[]
    shippingRates: ShippingRates
  }>('/public/bootstrap')
}

export function fetchPublicProduct(id: string) {
  return request<Product>(`/public/products/${id}`)
}

export function fetchAdminBootstrap() {
  return request<{
    collections: Collection[]
    products: Product[]
    orders: Order[]
    reviews: Review[]
    messages: ContactMessage[]
    deliveryCommunes: DeliveryCommune[]
    shippingRates: ShippingRates
    trash: {
      collections: Collection[]
      products: Product[]
      reviews: Review[]
    }
  }>('/admin/bootstrap')
}

export function authenticateAdmin(email: string, password: string) {
  return request<{ id: string; email: string; fullName?: string }>('/admin/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  })
}

export function verifyAdminSession() {
  return request<{ id: string; email: string; fullName?: string }>('/admin/session')
}

export function logoutAdminSession() {
  return request<void>('/admin/logout', { method: 'POST' })
}

export function changeAdminPassword(currentPassword: string, nextPassword: string) {
  return request<{ success: true }>('/admin/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, nextPassword })
  })
}

export function updateShippingRates(shippingRates: ShippingRates) {
  return request<ShippingRates>('/settings/shipping', {
    method: 'PUT',
    body: JSON.stringify({ shippingRates })
  })
}

export function createDeliveryCommune(commune: Pick<DeliveryCommune, 'id' | 'nom' | 'prixLivraison' | 'estActive'>) {
  return request<DeliveryCommune>('/delivery-communes', {
    method: 'POST',
    body: JSON.stringify(commune)
  })
}

export function updateDeliveryCommune(commune: Pick<DeliveryCommune, 'id' | 'nom' | 'prixLivraison' | 'estActive'>) {
  return request<DeliveryCommune>(`/delivery-communes/${commune.id}`, {
    method: 'PUT',
    body: JSON.stringify(commune)
  })
}

export function updateDeliveryCommuneStatus(id: string, estActive: boolean) {
  return request<DeliveryCommune>(`/delivery-communes/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ estActive })
  })
}

export function deleteDeliveryCommune(id: string) {
  return request<void>(`/delivery-communes/${id}`, { method: 'DELETE' })
}

export function validateCart(items: CartItem[], commune?: string) {
  return request<CartValidationResult>('/cart/validate', {
    method: 'POST',
    body: JSON.stringify({ items, commune })
  })
}

export function createCollection(collection: Collection) {
  return request<Collection>('/collections', { method: 'POST', body: JSON.stringify(collection) })
}

export function updateCollection(collection: Collection) {
  return request<Collection>(`/collections/${collection.id}`, { method: 'PUT', body: JSON.stringify(collection) })
}

export function deleteCollection(id: string) {
  return request<Collection>(`/collections/${id}`, { method: 'DELETE' })
}

export function restoreCollection(id: string) {
  return request<Collection>(`/collections/${id}/restore`, { method: 'POST' })
}

export function createProduct(product: Product) {
  return request<Product>('/products', { method: 'POST', body: JSON.stringify(product) })
}

export function updateProduct(product: Product) {
  return request<Product>(`/products/${product.id}`, { method: 'PUT', body: JSON.stringify(product) })
}

export function deleteProduct(id: string) {
  return request<Product>(`/products/${id}`, { method: 'DELETE' })
}

export function restoreProduct(id: string) {
  return request<Product>(`/products/${id}/restore`, { method: 'POST' })
}

export function createOrder(order: Order) {
  return request<Order>('/orders', { method: 'POST', body: JSON.stringify(order) })
}

export function updateOrderStatus(id: string, status: OrderStatus) {
  return request<Order>(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
}

export function createReview(review: Review) {
  return request<Review>('/reviews', { method: 'POST', body: JSON.stringify(review) })
}

export function deleteReview(id: string) {
  return request<Review>(`/reviews/${id}`, { method: 'DELETE' })
}

export function restoreReview(id: string) {
  return request<Review>(`/reviews/${id}/restore`, { method: 'POST' })
}

export function createMessage(message: ContactMessage) {
  return request<ContactMessage>('/messages', { method: 'POST', body: JSON.stringify(message) })
}

export function updateMessage(id: string, isRead: boolean) {
  return request<ContactMessage>(`/messages/${id}`, { method: 'PATCH', body: JSON.stringify({ isRead }) })
}
