import { Collection, ContactMessage, Order, Product, Review } from './types'

export const shippingByCommune: Record<string, number> = {
  Cocody: 5000,
  Plateau: 4500,
  Marcory: 3500,
  DeuxPlateaux: 4000,
  Zone4: 3000,
  Yopougon: 6000
}

export const initialCollections: Collection[] = [
  {
    id: 'col-abidjan-soiree',
    name: 'Abidjan Soiree',
    slug: 'abidjan-soiree',
    description: 'Silhouettes de nuit, satin couture et eclat editorial pour les grands rendez-vous.',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80',
    video: '',
    isFeatured: true
  },
  {
    id: 'col-essentiels-maison',
    name: 'Essentiels Maison',
    slug: 'essentiels-maison',
    description: 'Pieces signatures a porter, offrir et recomposer au fil des saisons.',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80',
    video: ''
  },
  {
    id: 'col-parfums-ivoire',
    name: 'Parfums d Ivoire',
    slug: 'parfums-d-ivoire',
    description: 'Une selection de sillages solaires, bois precieux et nectar haute presence.',
    image: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=1200&q=80',
    video: '',
    isFeatured: true
  }
]

export const initialProducts: Product[] = [
  {
    id: 'robe-lagune',
    name: 'Robe Lagune Noire',
    category: 'Vetements',
    collectionId: 'col-abidjan-soiree',
    price: 185000,
    compareAtPrice: 220000,
    description: "Une robe colonne satinee a la ligne nette, pensee pour les soirees d'Abidjan.",
    material: 'Satin duchesse et soie legere',
    colors: ['Noir minuit', 'Rose poudree'],
    sizes: ['XS', 'S', 'M', 'L'],
    stock: 8,
    isBestSeller: true,
    image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=80',
    images: ['https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=80'],
    video: ''
  },
  {
    id: 'sac-ebene',
    name: 'Sac Ebene Signature',
    category: 'Sacs',
    collectionId: 'col-essentiels-maison',
    price: 245000,
    description: 'Un sac structure en cuir graine avec poignee sculpturale et doublure bordeaux.',
    material: 'Cuir pleine fleur',
    colors: ['Ebene', 'Ivoire fume'],
    sizes: ['Unique'],
    stock: 5,
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1200&q=80',
    images: ['https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1200&q=80'],
    video: ''
  },
  {
    id: 'parfum-soleil',
    name: "Extrait Soleil d'Eburnie",
    category: 'Parfums',
    collectionId: 'col-parfums-ivoire',
    price: 95000,
    description: 'Tubereuse, poivre rose et bois ambres dans un sillage intimiste.',
    material: 'Extrait 50ml',
    colors: ['Flacon or rose'],
    sizes: ['50ml', '100ml'],
    stock: 19,
    isBestSeller: true,
    image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=1200&q=80',
    images: ['https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=1200&q=80'],
    video: ''
  },
  {
    id: 'manchette-bahia',
    name: 'Manchette Bahia',
    category: 'Accessoires',
    collectionId: 'col-essentiels-maison',
    price: 65000,
    description: 'Une manchette polie, large et lumineuse, pour rehausser une silhouette minimaliste.',
    material: 'Laiton plaque or',
    colors: ['Or champagne', 'Prune laquee'],
    sizes: ['Unique'],
    stock: 12,
    image: 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=1200&q=80',
    images: ['https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=1200&q=80'],
    video: ''
  }
]

export const initialOrders: Order[] = [
  {
    id: 'CMD-2401',
    customerName: 'Awa Kone',
    phone: '2250700001111',
    commune: 'Cocody',
    notes: 'Livraison en soiree',
    items: [
      {
        productId: 'robe-lagune',
        name: 'Robe Lagune Noire',
        price: 185000,
        color: 'Noir minuit',
        size: 'M',
        quantity: 1,
        image: initialProducts[0].image
      }
    ],
    subtotal: 185000,
    shipping: 5000,
    total: 190000,
    status: 'Livree',
    createdAt: '2026-07-01T15:30:00.000Z'
  },
  {
    id: 'CMD-2402',
    customerName: 'Nadia Traore',
    phone: '2250500002222',
    commune: 'Zone4',
    notes: 'Cadeau anniversaire',
    items: [
      {
        productId: 'parfum-soleil',
        name: "Extrait Soleil d'Eburnie",
        price: 95000,
        color: 'Flacon or rose',
        size: '100ml',
        quantity: 1,
        image: initialProducts[2].image
      }
    ],
    subtotal: 95000,
    shipping: 3000,
    total: 98000,
    status: 'En attente',
    createdAt: '2026-07-02T10:00:00.000Z'
  }
]

export const initialReviews: Review[] = [
  {
    id: 'AV-001',
    author: 'Ines D.',
    rating: 5,
    title: 'Adresse rare',
    body: 'La finition est impeccable et la conciergerie repond avec beaucoup de justesse.',
    createdAt: '2026-06-30T11:00:00.000Z'
  },
  {
    id: 'AV-002',
    author: 'Mariam B.',
    rating: 4,
    title: 'Tres belle experience',
    body: 'Le parfum est somptueux, et le suivi WhatsApp donne vraiment une sensation sur-mesure.',
    createdAt: '2026-07-01T09:10:00.000Z'
  }
]

export const initialMessages: ContactMessage[] = [
  {
    id: 'MSG-101',
    name: 'Fatou S.',
    phone: '2250100003333',
    topic: 'Privatisation showroom',
    message: 'Bonjour, je souhaite connaitre vos disponibilites pour une visite privee samedi.',
    isRead: false,
    createdAt: '2026-07-02T18:15:00.000Z'
  }
]
