import { Collection, ContactMessage, DeliveryCommune, Order, Product, Review } from './types'

export const shippingByCommune: Record<string, number> = {
  Cocody: 5000,
  Plateau: 4500,
  Marcory: 3500,
  DeuxPlateaux: 4000,
  Zone4: 3000,
  Yopougon: 6000
}

export const initialDeliveryCommunes: DeliveryCommune[] = Object.entries(shippingByCommune).map(([nom, prixLivraison], index) => ({
  id: `COM-${index + 1}`,
  nom,
  prixLivraison,
  estActive: true,
  createdAt: new Date('2026-07-01T00:00:00.000Z').toISOString(),
  updatedAt: new Date('2026-07-01T00:00:00.000Z').toISOString()
}))

export const initialCollections: Collection[] = []
export const initialProducts: Product[] = []
export const initialOrders: Order[] = []
export const initialReviews: Review[] = []
export const initialMessages: ContactMessage[] = []
