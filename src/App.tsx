import { AnimatePresence, motion } from 'motion/react'
import {
  ArrowRight,
  BadgePercent,
  Box,
  MapPin,
  ClipboardList,
  Filter,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircleMore,
  ChevronDown,
  Eye,
  EyeOff,
  PackagePlus,
  Phone,
  Plus,
  Minus,
  Search,
  Send,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Star,
  Trash2,
  User,
  X
} from 'lucide-react'
import { ChangeEvent, FormEvent, SyntheticEvent, Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatedBadge } from './components/motion/AnimatedBadge'
import { SmartMedia } from './components/SmartMedia'
import { CollectionCardMotion } from './components/motion/CollectionCardMotion'
import { CartDrawer } from './components/motion/CartDrawer'
import { AnimatedModal } from './components/motion/AnimatedModal'
import { PageTransition } from './components/motion/PageTransition'
import { ProductCardMotion } from './components/motion/ProductCardMotion'
import { RevealSection } from './components/motion/RevealSection'
import { ToastNotification } from './components/motion/ToastNotification'
import {
  ApiError,
  changeAdminPassword as changeAdminPasswordRequest,
  createCollection as createCollectionRequest,
  createMessage as createMessageRequest,
  createOrder as createOrderRequest,
  createProduct as createProductRequest,
  createReview as createReviewRequest,
  deleteCollection as deleteCollectionRequest,
  deleteProduct as deleteProductRequest,
  deleteReview as deleteReviewRequest,
  fetchAdminBootstrap,
  fetchPublicBootstrap,
  restoreCollection as restoreCollectionRequest,
  restoreProduct as restoreProductRequest,
  restoreReview as restoreReviewRequest,
  updateShippingRates as updateShippingRatesRequest,
  updateCollection as updateCollectionRequest,
  updateMessage as updateMessageRequest,
  updateOrderStatus as updateOrderStatusRequest,
  updateProduct as updateProductRequest,
  verifyAdminSession
} from './lib/api'
import { initialCollections, initialMessages, initialOrders, initialProducts, initialReviews, shippingByCommune } from './data'
import { useLocalStorage } from './hooks/useLocalStorage'
import { getAdminSession, isAdminAuthenticated, loginAdmin, logoutAdmin, syncAdminSession } from './lib/auth'
import { CartItem, Category, Collection, ContactMessage, Order, OrderStatus, Product, Review, ShippingRates } from './types'
import { collectionFallbackImage, productFallbackImage } from './lib/imageFallbacks'
import { currency, datetime } from './utils/format'
import { buildWhatsAppUrl } from './utils/whatsapp'

const categories: Array<Category | 'Tous'> = ['Tous', 'Vetements', 'Sacs', 'Parfums', 'Accessoires']

const AdminDashboardSection = lazy(async () => {
  const module = await import('./components/admin/AdminDashboardSection')
  return { default: module.AdminDashboardSection }
})

const AdminOrdersSection = lazy(async () => {
  const module = await import('./components/admin/AdminOrdersSection')
  return { default: module.AdminOrdersSection }
})

const AdminProductsSection = lazy(async () => {
  const module = await import('./components/admin/AdminProductsSection')
  return { default: module.AdminProductsSection }
})

const AdminReviewsSection = lazy(async () => {
  const module = await import('./components/admin/AdminReviewsSection')
  return { default: module.AdminReviewsSection }
})

const AdminMessagesSection = lazy(async () => {
  const module = await import('./components/admin/AdminMessagesSection')
  return { default: module.AdminMessagesSection }
})

const AdminTrashSection = lazy(async () => {
  const module = await import('./components/admin/AdminTrashSection')
  return { default: module.AdminTrashSection }
})

const AdminSettingsSection = lazy(async () => {
  const module = await import('./components/admin/AdminSettingsSection')
  return { default: module.AdminSettingsSection }
})

const publicNavItems = [
  { id: 'accueil', label: 'ACCUEIL' },
  { id: 'boutique', label: 'LA BOUTIQUE' },
  { id: 'avis', label: 'AVIS CLIENT' },
  { id: 'contact', label: 'A PROPOS & CONTACT' }
] as const

const adminColorOptions = [
  'Noir',
  'Ivoire',
  'Rose poudree',
  'Rouge',
  'Prune',
  'Or',
  'Champagne',
  'Ebene',
  'Blanc',
  'Bleu nuit',
  'Vert emeraude',
  'Argent'
] as const

const adminLinks = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/orders', label: 'Commandes', icon: ClipboardList },
  { path: '/admin/products', label: 'Catalogue', icon: PackagePlus },
  { path: '/admin/reviews', label: 'Avis', icon: Filter },
  { path: '/admin/messages', label: 'Messages', icon: MessageCircleMore },
  { path: '/admin/trash', label: 'Corbeille', icon: Trash2 },
  { path: '/admin/settings', label: 'Parametres', icon: Settings }
] as const

const protectedAdminPaths = ['/admin/dashboard', '/admin/orders', '/admin/products', '/admin/reviews', '/admin/messages', '/admin/trash', '/admin/settings'] as const

type PublicNavId = (typeof publicNavItems)[number]['id']
type AdminPath = (typeof protectedAdminPaths)[number]

const MAX_PRODUCT_IMAGE_DIMENSION = 1600
const MAX_PRODUCT_IMAGE_BYTES = 1_600_000
const MAX_MEDIA_VIDEO_BYTES = 12_000_000

const emptyProductForm: Omit<Product, 'id'> = {
  name: '',
  category: 'Vetements',
  collectionId: '',
  price: 0,
  compareAtPrice: 0,
  description: '',
  material: '',
  colors: [''],
  sizes: [''],
  stock: 0,
  isBestSeller: false,
  image: '',
  images: [],
  video: ''
}

const emptyReview = { author: '', rating: 5, title: '', body: '' }
const emptyMessage = { name: '', phone: '', topic: '', message: '' }
const emptyCollectionForm: Omit<Collection, 'id'> = {
  name: '',
  slug: '',
  description: '',
  image: '',
  video: '',
  isFeatured: false
}
const emptyAdminLoginForm = { email: '', password: '' }
const emptyToast = { title: '', message: '' }
const emptyPasswordForm = { currentPassword: '', nextPassword: '', confirmPassword: '' }
const emptyGalleryImageInput = ''
const PUBLIC_BOOTSTRAP_CACHE_KEY = 'yele-public-bootstrap-cache-v2'

type PublicBootstrapCache = {
  collections: Collection[]
  products: Product[]
  reviews: Review[]
  shippingRates: ShippingRates
}

function readPublicBootstrapCache(): PublicBootstrapCache | null {
  if (typeof window === 'undefined') return null

  const stored = window.localStorage.getItem(PUBLIC_BOOTSTRAP_CACHE_KEY)
  if (!stored) return null

  try {
    return JSON.parse(stored) as PublicBootstrapCache
  } catch {
    return null
  }
}

function writePublicBootstrapCache(value: PublicBootstrapCache) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(PUBLIC_BOOTSTRAP_CACHE_KEY, JSON.stringify(value))
}

function dataUrlByteSize(dataUrl: string) {
  const base64 = dataUrl.split(',')[1] ?? ''
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0
  return Math.ceil((base64.length * 3) / 4) - padding
}

function uniqueImageList(items: string[]) {
  const normalized = items.map((item) => item.trim()).filter(Boolean)
  return normalized.filter((item, index) => normalized.indexOf(item) === index)
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      if (!result) {
        reject(new Error('Could not read the selected file.'))
        return
      }
      resolve(result)
    }
    reader.onerror = () => reject(reader.error ?? new Error('Could not read the selected file.'))
    reader.readAsDataURL(file)
  })
}

function loadImageElement(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Could not decode the selected image.'))
    image.src = source
  })
}

async function optimizeProductImageFile(file: File) {
  const originalDataUrl = await fileToDataUrl(file)
  const image = await loadImageElement(originalDataUrl)
  const scale = Math.min(1, MAX_PRODUCT_IMAGE_DIMENSION / Math.max(image.width, image.height))
  const width = Math.max(1, Math.round(image.width * scale))
  const height = Math.max(1, Math.round(image.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')

  if (!context) return originalDataUrl

  context.drawImage(image, 0, 0, width, height)

  const qualities = [0.86, 0.76, 0.66, 0.56]
  let candidate = canvas.toDataURL('image/jpeg', qualities[0])

  for (const quality of qualities) {
    const nextCandidate = canvas.toDataURL('image/jpeg', quality)
    candidate = nextCandidate
    if (dataUrlByteSize(nextCandidate) <= MAX_PRODUCT_IMAGE_BYTES) {
      return nextCandidate
    }
  }

  return candidate
}

async function readVideoFile(file: File) {
  if (file.size > MAX_MEDIA_VIDEO_BYTES) {
    throw new Error('Video file too large')
  }

  return fileToDataUrl(file)
}

function scoreForProduct(product: Product) {
  const map: Record<string, number> = {
    'robe-lagune': 4.9,
    'sac-ebene': 4.8,
    'parfum-soleil': 5,
    'manchette-bahia': 4.7
  }

  return map[product.id] ?? 4.8
}

function swatchColor(name: string) {
  const key = name.toLowerCase()
  if (key.includes('noir')) return '#111111'
  if (key.includes('rose')) return '#d93f98'
  if (key.includes('or')) return '#a66a2c'
  if (key.includes('champagne')) return '#d3b683'
  if (key.includes('prune')) return '#6e35b7'
  if (key.includes('ivoire')) return '#e8dcc8'
  if (key.includes('ebene')) return '#2b2230'
  return '#4b4b4b'
}

function categoryLabel(category: Category) {
  if (category === 'Vetements') return 'VETEMENTS'
  if (category === 'Sacs') return 'SACS'
  if (category === 'Parfums') return 'PARFUMS'
  return 'ACCESSOIRES'
}

function categoryCopy(category: Category) {
  if (category === 'Vetements') {
    return {
      kicker: 'NOUVELLE COLLECTION',
      title: 'Vetements & Robes',
      body: 'Robes imperiales en satin fluide et tailleurs couture.'
    }
  }

  if (category === 'Sacs') {
    return {
      kicker: 'MAROQUINERIE FINE',
      title: 'Sacs & Minaudieres',
      body: 'Cabas Saffiano et pochettes ornees de cristaux scintillants.'
    }
  }

  if (category === 'Parfums') {
    return {
      kicker: 'ELIXIRS DE NUIT',
      title: 'Haute Parfumerie',
      body: 'Oud majestueux et nectars solaires a longue tenue.'
    }
  }

  return {
    kicker: 'PLACAGE OR 18K',
    title: 'Bijoux & Accessoires',
    body: 'Creoles torsadees massives et lunettes Cat-Eye glamour.'
  }
}

function applyImageFallback(event: SyntheticEvent<HTMLImageElement>, fallbackSrc: string) {
  const target = event.currentTarget
  if (target.src === fallbackSrc) return
  target.src = fallbackSrc
}

function defaultProductName(category: Category) {
  if (category === 'Vetements') return 'Nouvel article couture'
  if (category === 'Sacs') return 'Nouveau sac signature'
  if (category === 'Parfums') return 'Nouveau parfum signature'
  return 'Nouvel accessoire signature'
}

function currentPathname() {
  return window.location.pathname || '/'
}

function isProtectedAdminPath(path: string): path is AdminPath {
  return protectedAdminPaths.includes(path as AdminPath)
}

function adminHeading(path: AdminPath) {
  switch (path) {
    case '/admin/orders':
      return {
        kicker: 'BACK OFFICE',
        title: 'Gestion des Commandes',
        copy: 'Suivez les commandes, mettez a jour leur statut et ouvrez la conversation WhatsApp du client.'
      }
    case '/admin/products':
      return {
        kicker: 'BACK OFFICE',
        title: 'Catalogue Premium',
        copy: 'Ajoutez, modifiez ou retirez les pieces de la Maison sans jamais exposer l administration a la vitrine.'
      }
    case '/admin/reviews':
      return {
        kicker: 'BACK OFFICE',
        title: 'Moderation des Avis',
        copy: 'Gardez une parole client fiable et preservez l image de marque de Yele House.'
      }
    case '/admin/messages':
      return {
        kicker: 'BACK OFFICE',
        title: 'Messagerie Conciergerie',
        copy: 'Recevez les demandes entrantes, marquez-les comme lues et repondez en un clic.'
      }
    case '/admin/settings':
      return {
        kicker: 'BACK OFFICE',
        title: 'Parametres Admin',
        copy: 'Pilotez l acces, la session active et les points de controle du back-office prive.'
      }
    case '/admin/trash':
      return {
        kicker: 'BACK OFFICE',
        title: 'Corbeille Admin',
        copy: 'Retrouvez ici les produits, collections et avis supprimes, puis restaurez-les en un clic.'
      }
    default:
      return {
        kicker: 'BACK OFFICE',
        title: 'Tableau de Bord Admin',
        copy: 'Votre espace prive pilote les commandes, le catalogue, les avis et les messages de conciergerie.'
      }
  }
}

export default function App() {
  const cachedPublicBootstrap = readPublicBootstrapCache()
  const [collections, setCollections] = useState<Collection[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [deletedCollections, setDeletedCollections] = useState<Collection[]>([])
  const [deletedProducts, setDeletedProducts] = useState<Product[]>([])
  const [deletedReviews, setDeletedReviews] = useState<Review[]>([])
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [shippingRates, setShippingRates] = useState<ShippingRates>(shippingByCommune)
  const [cart, setCart] = useLocalStorage<CartItem[]>('yele-cart', [])

  const [path, setPath] = useState(currentPathname)
  const [activeNav, setActiveNav] = useState<PublicNavId>('accueil')
  const [pendingSection, setPendingSection] = useState<PublicNavId | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [category, setCategory] = useState<Category | 'Tous'>('Tous')
  const [search, setSearch] = useState('')
  const [selectedOptions, setSelectedOptions] = useState<Record<string, { color: string; size: string; image?: string }>>({})
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [orderForm, setOrderForm] = useState({
    customerName: '',
    phone: '',
    commune: Object.keys(shippingByCommune)[0],
    addressLine: '',
    deliveryNotes: ''
  })
  const [reviewForm, setReviewForm] = useState(emptyReview)
  const [contactForm, setContactForm] = useState(emptyMessage)
  const [reviewFilter, setReviewFilter] = useState(0)
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [editingCollectionId, setEditingCollectionId] = useState<string | null>(null)
  const [productForm, setProductForm] = useState<Omit<Product, 'id'>>(emptyProductForm)
  const [collectionForm, setCollectionForm] = useState<Omit<Collection, 'id'>>(emptyCollectionForm)
  const [orderStatusFilter, setOrderStatusFilter] = useState<OrderStatus | 'Tous'>('Tous')
  const [loginForm, setLoginForm] = useState(emptyAdminLoginForm)
  const [loginError, setLoginError] = useState('')
  const [showAdminPassword, setShowAdminPassword] = useState(false)
  const [settingsPasswordForm, setSettingsPasswordForm] = useState(emptyPasswordForm)
  const [settingsPasswordError, setSettingsPasswordError] = useState('')
  const [settingsPasswordSuccess, setSettingsPasswordSuccess] = useState('')
  const [shippingForm, setShippingForm] = useState<ShippingRates>(shippingByCommune)
  const [shippingSettingsMessage, setShippingSettingsMessage] = useState('')
  const [productSuccessMessage, setProductSuccessMessage] = useState('')
  const [collectionSuccessMessage, setCollectionSuccessMessage] = useState('')
  const [showSettingsPasswords, setShowSettingsPasswords] = useState({
    current: false,
    next: false,
    confirm: false
  })
  const [toast, setToast] = useState(emptyToast)
  const [previewProductId, setPreviewProductId] = useState<string | null>(null)
  const [adminCustomColor, setAdminCustomColor] = useState('')
  const [adminGalleryImageInput, setAdminGalleryImageInput] = useState(emptyGalleryImageInput)
  const [adminColorsOpen, setAdminColorsOpen] = useState(false)
  const [isDatabaseReady, setIsDatabaseReady] = useState(false)
  const [adminAuthResolved, setAdminAuthResolved] = useState(false)
  const [isPublicBootstrapResolved, setIsPublicBootstrapResolved] = useState(false)
  const galleryInputRef = useRef<HTMLInputElement | null>(null)
  const cameraInputRef = useRef<HTMLInputElement | null>(null)
  const galleryVideoInputRef = useRef<HTMLInputElement | null>(null)
  const cameraVideoInputRef = useRef<HTMLInputElement | null>(null)
  const collectionGalleryInputRef = useRef<HTMLInputElement | null>(null)
  const collectionCameraInputRef = useRef<HTMLInputElement | null>(null)
  const collectionGalleryVideoInputRef = useRef<HTMLInputElement | null>(null)
  const collectionCameraVideoInputRef = useRef<HTMLInputElement | null>(null)
  const communeOptions = useMemo(() => Object.keys(shippingRates), [shippingRates])

  useEffect(() => {
    const handlePopState = () => setPath(currentPathname())
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    if (!productSuccessMessage) return

    const timeout = window.setTimeout(() => {
      setProductSuccessMessage('')
    }, 4500)

    return () => window.clearTimeout(timeout)
  }, [productSuccessMessage])

  useEffect(() => {
    if (!collectionSuccessMessage) return

    const timeout = window.setTimeout(() => {
      setCollectionSuccessMessage('')
    }, 4500)

    return () => window.clearTimeout(timeout)
  }, [collectionSuccessMessage])

  useEffect(() => {
    let ignore = false

    const load = async () => {
      try {
        const isAdminView = path.startsWith('/admin') && path !== '/admin/login'
        if (isAdminView && (!adminAuthResolved || !isAdminAuthenticated())) return
        if (isAdminView) {
          const bootstrap = await fetchAdminBootstrap()
          if (ignore) return
          setCollections(bootstrap.collections)
          setProducts(bootstrap.products)
          setOrders(bootstrap.orders)
          setReviews(bootstrap.reviews)
          setDeletedCollections(bootstrap.trash.collections)
          setDeletedProducts(bootstrap.trash.products)
          setDeletedReviews(bootstrap.trash.reviews)
          setMessages(bootstrap.messages)
          setShippingRates(bootstrap.shippingRates)
          setShippingForm(bootstrap.shippingRates)
        } else {
          const bootstrap = await fetchPublicBootstrap()
          if (ignore) return
          setCollections(bootstrap.collections)
          setProducts(bootstrap.products)
          setReviews(bootstrap.reviews)
          setDeletedCollections([])
          setDeletedProducts([])
          setDeletedReviews([])
          setShippingRates(bootstrap.shippingRates)
          writePublicBootstrapCache({
            collections: bootstrap.collections,
            products: bootstrap.products,
            reviews: bootstrap.reviews,
            shippingRates: bootstrap.shippingRates
          })
          setIsPublicBootstrapResolved(true)
        }
        setIsDatabaseReady(true)
      } catch (error) {
        console.error(error)
        if (ignore) return
        setIsDatabaseReady(false)
        const isAdminPath = path.startsWith('/admin')
        if (!path.startsWith('/admin')) {
          const fallbackBootstrap = readPublicBootstrapCache()

          if (fallbackBootstrap) {
            setCollections(fallbackBootstrap.collections)
            setProducts(fallbackBootstrap.products)
            setReviews(fallbackBootstrap.reviews)
            setShippingRates(fallbackBootstrap.shippingRates)
            setShippingForm(fallbackBootstrap.shippingRates)
          } else {
            setCollections(initialCollections)
            setProducts(initialProducts)
            setReviews(initialReviews)
            setShippingRates(shippingByCommune)
            setShippingForm(shippingByCommune)
          }

          setDeletedCollections([])
          setDeletedProducts([])
          setDeletedReviews([])
          setIsPublicBootstrapResolved(true)
        } else {
          setOrders(initialOrders)
          setMessages(initialMessages)
        }
        if (isAdminPath) {
          showToast('Mode local actif', 'La base ou la session admin n est pas joignable. L interface garde les donnees de demo.')
        }
      }
    }

    void load()

    return () => {
      ignore = true
    }
  }, [adminAuthResolved, path])

  useEffect(() => {
    let ignore = false

    const resolveAdminSession = async () => {
      if (!path.startsWith('/admin')) {
        if (!ignore) setAdminAuthResolved(true)
        return
      }

      if (!ignore) setAdminAuthResolved(false)
      const authenticated = await syncAdminSession()
      if (ignore) return

      setAdminAuthResolved(true)

      if (path === '/admin/login') {
        if (authenticated) {
          navigate('/admin/dashboard', { replace: true })
        }
        return
      }

      if (path === '/admin') {
        navigate(authenticated ? '/admin/dashboard' : '/admin/login', { replace: true })
        return
      }

      if (!isProtectedAdminPath(path)) {
        navigate(authenticated ? '/admin/dashboard' : '/admin/login', { replace: true })
        return
      }

      if (!authenticated) {
        setLoginError('Votre session admin a expire. Merci de vous reconnecter.')
        navigate('/admin/login', { replace: true })
      }
    }

    void resolveAdminSession()

    return () => {
      ignore = true
    }
  }, [path])

  const navigate = (nextPath: string, options?: { replace?: boolean }) => {
    const replace = options?.replace ?? false

    if (replace) {
      window.history.replaceState({}, '', nextPath)
    } else if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath)
    }

    setPath(currentPathname())
    window.scrollTo(0, 0)
  }

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [path])

  useEffect(() => {
    if (!toast.title) return

    const timeout = window.setTimeout(() => {
      setToast(emptyToast)
    }, 2600)

    return () => window.clearTimeout(timeout)
  }, [toast])

  useEffect(() => {
    if (path !== '/' || !pendingSection) return

    requestAnimationFrame(() => {
      document.getElementById(pendingSection)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setActiveNav(pendingSection)
      setPendingSection(null)
    })
  }, [path, pendingSection])

  useEffect(() => {
    if (!communeOptions.length) return
    if (communeOptions.includes(orderForm.commune)) return
    setOrderForm((current) => ({ ...current, commune: communeOptions[0] }))
  }, [communeOptions, orderForm.commune])

  const activeCollections = useMemo(
    () => collections.filter((collection) => !collection.deletedAt),
    [collections]
  )

  const activeProducts = useMemo(
    () =>
      products.filter(
        (product) => !product.deletedAt && (!product.collectionId || activeCollections.some((collection) => collection.id === product.collectionId))
      ),
    [activeCollections, products]
  )

  const activeReviews = useMemo(() => reviews.filter((review) => !review.deletedAt), [reviews])

  const filteredProducts = useMemo(() => {
    return activeProducts.filter((product) => {
      const categoryMatch = category === 'Tous' || product.category === category
      const searchMatch =
        search.trim() === '' ||
        [product.name, product.description, product.material].join(' ').toLowerCase().includes(search.toLowerCase())

      return categoryMatch && searchMatch
    })
  }, [activeProducts, category, search])

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart])
  const shipping = shippingRates[orderForm.commune] ?? 0
  const total = subtotal + shipping

  const averageRating = useMemo(() => {
    if (!activeReviews.length) return 0
    return activeReviews.reduce((sum, review) => sum + review.rating, 0) / activeReviews.length
  }, [activeReviews])

  const pendingOrdersCount = useMemo(
    () => orders.filter((order) => order.status === 'En attente').length,
    [orders]
  )

  const deliveredOrdersCount = useMemo(
    () => orders.filter((order) => order.status === 'Livree').length,
    [orders]
  )

  const unreadMessagesCount = useMemo(
    () => messages.filter((message) => !message.isRead).length,
    [messages]
  )

  const trashItemsCount = useMemo(
    () => deletedCollections.length + deletedProducts.length + deletedReviews.length,
    [deletedCollections.length, deletedProducts.length, deletedReviews.length]
  )

  const stockValue = useMemo(
    () => activeProducts.reduce((sum, product) => sum + product.price * product.stock, 0),
    [activeProducts]
  )

  const dashboardStats = useMemo(() => {
    const revenue = orders.filter((order) => order.status === 'Livree').reduce((sum, order) => sum + order.total, 0)

    return [
      {
        label: "Chiffre d'affaires",
        value: currency.format(revenue),
        helper: 'Sur commandes validees livrees',
        accent: 'success' as const
      },
      {
        label: 'Commandes',
        value: `${orders.length}`,
        helper: `${pendingOrdersCount} en attente  •  ${deliveredOrdersCount} livrees`,
        accent: 'default' as const
      },
      {
        label: 'Valeur stock',
        value: currency.format(stockValue),
        helper: `${products.length} articles references`,
        accent: 'violet' as const
      },
      {
        label: 'Note globale',
        value: `${averageRating.toFixed(1)} /5`,
        helper: `${activeReviews.length} temoignages verifies`,
        accent: 'pink' as const
      }
    ]
  }, [activeReviews.length, averageRating, deliveredOrdersCount, orders, pendingOrdersCount, products, stockValue])

  const recentOrders = useMemo(() => {
    return [...orders]
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
      .slice(0, 5)
  }, [orders])

  const recentCollections = useMemo(() => {
    return [...collections]
      .sort((left, right) => {
        if (Boolean(left.isFeatured) !== Boolean(right.isFeatured)) {
          return left.isFeatured ? -1 : 1
        }

        return left.name.localeCompare(right.name)
      })
      .slice(0, 6)
  }, [collections])

  const visibleOrders = useMemo(() => {
    return orderStatusFilter === 'Tous' ? orders : orders.filter((order) => order.status === orderStatusFilter)
  }, [orderStatusFilter, orders])

  const visibleReviews = useMemo(() => {
    return reviewFilter === 0 ? activeReviews : activeReviews.filter((review) => review.rating === reviewFilter)
  }, [activeReviews, reviewFilter])

  const categoryHighlights = useMemo(() => {
    return [
      activeProducts.find((item) => item.category === 'Vetements'),
      activeProducts.find((item) => item.category === 'Sacs'),
      activeProducts.find((item) => item.category === 'Parfums'),
      activeProducts.find((item) => item.category === 'Accessoires')
    ].filter(Boolean) as Product[]
  }, [activeProducts])

  const featuredCollections = useMemo(() => {
    return activeCollections.filter((collection) => collection.isFeatured).slice(0, 3)
  }, [activeCollections])

  const collectionMap = useMemo(
    () => activeCollections.reduce<Record<string, Collection>>((accumulator, collection) => {
      accumulator[collection.id] = collection
      return accumulator
    }, {}),
    [activeCollections]
  )

  const previewProduct = useMemo(
    () => activeProducts.find((product) => product.id === previewProductId) ?? null,
    [activeProducts, previewProductId]
  )
  const previewSelection = previewProduct
    ? selectedOptions[previewProduct.id] ?? {
        color: previewProduct.colors[0] ?? '',
        size: previewProduct.sizes[0] ?? '',
        image: previewProduct.image
      }
    : null
  const relatedPreviewProducts = useMemo(() => {
    if (!previewProduct) return []

    const differentCategory = activeProducts.filter(
      (product) => product.id !== previewProduct.id && product.category !== previewProduct.category
    )
    const sameCategory = activeProducts.filter(
      (product) => product.id !== previewProduct.id && product.category === previewProduct.category
    )

    return [...differentCategory, ...sameCategory].slice(0, 3)
  }, [activeProducts, previewProduct])

  useEffect(() => {
    const activeProductIds = new Set(activeProducts.map((product) => product.id))
    setCart((current) => current.filter((item) => activeProductIds.has(item.productId)))
  }, [activeProducts, setCart])

  const adminPath: AdminPath = isProtectedAdminPath(path) ? path : '/admin/dashboard'
  const adminMeta = adminHeading(adminPath)
  const currentAdminSession = getAdminSession()

  const goToSection = (id: PublicNavId) => {
    setActiveNav(id)
    setMobileMenuOpen(false)

    if (path !== '/') {
      setPendingSection(id)
      navigate('/')
      return
    }

    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const showToast = (title: string, message: string) => {
    setToast({ title, message })
  }

  const openPreviewProduct = (productId: string) => {
    setPreviewProductId(productId)
  }

  const addToCart = (product: Product) => {
    const selected = selectedOptions[product.id] ?? {
      color: product.colors[0] ?? 'Unique',
      size: product.sizes[0] ?? 'Unique',
      image: product.image
    }

    setCart((current) => {
      const existing = current.find(
        (item) => item.productId === product.id && item.color === selected.color && item.size === selected.size
      )

      if (existing) {
        return current.map((item) =>
          item === existing ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) } : item
        )
      }

      return [
        ...current,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          color: selected.color,
          size: selected.size,
          quantity: 1,
          image: product.image
        }
      ]
    })

    setIsCartOpen(true)
  }

  const addPreviewProductToCart = () => {
    if (!previewProduct) return
    addToCart(previewProduct)
    setPreviewProductId(null)
    showToast('Ajoute au panier', `${previewProduct.name} rejoint votre selection.`)
  }

  const updateCartQuantity = (productId: string, color: string, size: string, delta: number) => {
    setCart((current) =>
      current
        .map((item) =>
          item.productId === productId && item.color === color && item.size === size
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter((item) => item.quantity > 0)
    )
  }

  const removeFromCart = (productId: string, color: string, size: string) => {
    setCart((current) =>
      current.filter((item) => !(item.productId === productId && item.color === color && item.size === size))
    )
  }

  const submitOrder = () => {
    if (!cart.length || !orderForm.customerName.trim() || !orderForm.phone.trim()) return

    const combinedNotes = [orderForm.addressLine.trim(), orderForm.deliveryNotes.trim()].filter(Boolean).join(' | ')

    const nextOrder: Order = {
      id: `CMD-${Date.now().toString().slice(-6)}`,
      customerName: orderForm.customerName.trim(),
      phone: orderForm.phone.trim(),
      commune: orderForm.commune,
      notes: combinedNotes,
      items: cart,
      subtotal,
      shipping,
      total,
      status: 'En attente',
      createdAt: new Date().toISOString()
    }

    void (async () => {
      try {
        const savedOrder = isDatabaseReady ? await createOrderRequest(nextOrder) : nextOrder

        setOrders((current) => [savedOrder, ...current])
        setProducts((current) =>
          current.map((product) => {
            const orderedQty = cart
              .filter((item) => item.productId === product.id)
              .reduce((sum, item) => sum + item.quantity, 0)

            return orderedQty > 0 ? { ...product, stock: Math.max(product.stock - orderedQty, 0) } : product
          })
        )

        window.open(
          buildWhatsAppUrl({
            customerName: savedOrder.customerName,
            phone: savedOrder.phone,
            commune: savedOrder.commune,
            notes: savedOrder.notes,
            items: savedOrder.items,
            subtotal: savedOrder.subtotal,
            shipping: savedOrder.shipping,
            total: savedOrder.total
          }),
          '_blank'
        )

        setCart([])
        setOrderForm({
          customerName: '',
          phone: '',
          commune: communeOptions[0] ?? Object.keys(shippingByCommune)[0],
          addressLine: '',
          deliveryNotes: ''
        })
        showToast('Commande prete', 'Votre message WhatsApp a ete prepare pour la conciergerie.')
      } catch (error) {
        console.error(error)
        showToast('Commande impossible', 'La commande n a pas pu etre enregistree pour le moment.')
      }
    })()
  }

  const submitReview = (event: FormEvent) => {
    event.preventDefault()
    if (!reviewForm.author.trim() || !reviewForm.title.trim() || !reviewForm.body.trim()) return

    const nextReview: Review = {
      id: `AV-${Date.now()}`,
      author: reviewForm.author.trim(),
      rating: reviewForm.rating,
      title: reviewForm.title.trim(),
      body: reviewForm.body.trim(),
      createdAt: new Date().toISOString()
    }

    void (async () => {
      try {
        const savedReview = isDatabaseReady ? await createReviewRequest(nextReview) : nextReview
        setReviews((current) => [savedReview, ...current])
        setReviewForm(emptyReview)
        showToast('Avis publie', 'Merci, votre temoignage enrichit l experience de la Maison.')
      } catch (error) {
        console.error(error)
        showToast('Echec de publication', 'Impossible d enregistrer cet avis pour le moment.')
      }
    })()
  }

  const submitMessage = (event: FormEvent) => {
    event.preventDefault()
    if (!contactForm.name.trim() || !contactForm.phone.trim() || !contactForm.message.trim()) return

    const nextMessage: ContactMessage = {
      id: `MSG-${Date.now()}`,
      name: contactForm.name.trim(),
      phone: contactForm.phone.trim(),
      topic: contactForm.topic.trim() || 'Demande generale',
      message: contactForm.message.trim(),
      isRead: false,
      createdAt: new Date().toISOString()
    }

    void (async () => {
      try {
        const savedMessage = isDatabaseReady ? await createMessageRequest(nextMessage) : nextMessage
        setMessages((current) => [savedMessage, ...current])
        setContactForm(emptyMessage)
        showToast('Message envoye', 'La conciergerie Yele House vous repondra rapidement.')
      } catch (error) {
        console.error(error)
        showToast('Envoi impossible', 'Le message n a pas pu etre enregistre pour le moment.')
      }
    })()
  }

  const saveProduct = (event: FormEvent) => {
    event.preventDefault()
    const isEditingProduct = Boolean(editingProductId)

    const resolvedCategory = productForm.category ?? 'Vetements'
    const fallbackImage = productFallbackImage(resolvedCategory)
    const normalizedName = productForm.name.trim() || defaultProductName(resolvedCategory)
    const normalizedDescription =
      productForm.description.trim() || 'Piece signature de la Maison, prete a etre enrichie depuis le back-office.'
    const normalizedMaterial = productForm.material.trim() || 'Finition signature Yele House'
    const normalizedColors = productForm.colors.map((item) => item.trim()).filter(Boolean)
    const normalizedSizes = productForm.sizes.map((item) => item.trim()).filter(Boolean)

    const normalized: Product = {
      id: editingProductId ?? `PROD-${Date.now()}`,
      ...productForm,
      category: resolvedCategory,
      name: normalizedName,
      description: normalizedDescription,
      material: normalizedMaterial,
      images: uniqueImageList([productForm.image, ...productForm.images]),
      image: productForm.image.trim() || productForm.images[0]?.trim() || fallbackImage,
      video: productForm.video?.trim() || undefined,
      collectionId: productForm.collectionId?.trim() || undefined,
      colors: normalizedColors.length ? normalizedColors : ['Unique'],
      sizes: normalizedSizes.length ? normalizedSizes : ['Unique'],
      compareAtPrice: productForm.compareAtPrice || undefined
    }

    normalized.images = uniqueImageList([normalized.image, ...normalized.images])

    void (async () => {
      try {
        const savedProduct =
          isDatabaseReady && editingProductId
            ? await updateProductRequest(normalized)
            : isDatabaseReady
              ? await createProductRequest(normalized)
              : normalized

        setProducts((current) => {
          if (editingProductId) {
            return current.map((item) => (item.id === editingProductId ? savedProduct : item))
          }

          return [savedProduct, ...current]
        })

        setEditingProductId(null)
        setProductForm(emptyProductForm)
        setAdminCustomColor('')
        setAdminGalleryImageInput(emptyGalleryImageInput)
        setAdminColorsOpen(false)
        setProductSuccessMessage(
          isEditingProduct
            ? `Le produit "${savedProduct.name}" a bien ete mis a jour.`
            : `Le produit "${savedProduct.name}" a bien ete ajoute a la boutique.`
        )
        showToast(isEditingProduct ? 'Produit mis a jour' : 'Produit ajoute', 'Le catalogue premium a ete synchronise.')
      } catch (error) {
        console.error(error)
        setProductSuccessMessage('')
        showToast('Echec de sauvegarde', 'Impossible d enregistrer le produit pour le moment.')
      }
    })()
  }

  const handleProductImageFile = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    if (!files.length) return

    event.target.value = ''

    void (async () => {
      try {
        const optimizedImages = await Promise.all(files.map((file) => optimizeProductImageFile(file)))
        setProductForm((current) => {
          const nextImages = uniqueImageList([current.image, ...current.images, ...optimizedImages])
          return {
            ...current,
            image: current.image || optimizedImages[0] || '',
            images: nextImages
          }
        })
        showToast('Images ajoutees', `${optimizedImages.length} visuel(s) ont ete prepares pour la boutique.`)
      } catch (error) {
        console.error(error)
        showToast('Image indisponible', 'Impossible de preparer une ou plusieurs photos pour le moment.')
      }
    })()
  }

  const handleProductVideoFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    event.target.value = ''

    void (async () => {
      try {
        const encodedVideo = await readVideoFile(file)
        setProductForm((current) => ({ ...current, video: encodedVideo }))
        showToast('Video ajoutee', 'La video du produit a ete preparee pour la vitrine.')
      } catch (error) {
        console.error(error)
        showToast('Video indisponible', 'Impossible de charger cette video. Utilisez un fichier plus leger.')
      }
    })()
  }

  const addGalleryImageFromUrl = () => {
    const nextImage = adminGalleryImageInput.trim()
    if (!nextImage) return

    setProductForm((current) => {
      const nextImages = uniqueImageList([current.image, ...current.images, nextImage])
      return {
        ...current,
        image: current.image || nextImage,
        images: nextImages
      }
    })
    setAdminGalleryImageInput(emptyGalleryImageInput)
  }

  const removeGalleryImage = (imageToRemove: string) => {
    setProductForm((current) => {
      const nextImages = current.images.filter((item) => item !== imageToRemove)
      const nextPrimary = current.image === imageToRemove ? nextImages[0] ?? '' : current.image
      return {
        ...current,
        image: nextPrimary,
        images: nextImages
      }
    })
  }

  const setPrimaryGalleryImage = (imageToPromote: string) => {
    setProductForm((current) => ({
      ...current,
      image: imageToPromote,
      images: uniqueImageList([imageToPromote, ...current.images.filter((item) => item !== imageToPromote)])
    }))
  }

  const handleCollectionImageFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    event.target.value = ''

    void (async () => {
      try {
        const optimizedImage = await optimizeProductImageFile(file)
        setCollectionForm((current) => ({ ...current, image: optimizedImage }))
        showToast('Image ajoutee', 'Le visuel de la tendance a ete optimise puis charge.')
      } catch (error) {
        console.error(error)
        showToast('Image indisponible', 'Impossible de preparer cette photo pour la tendance.')
      }
    })()
  }

  const toggleAdminColor = (color: string) => {
    setProductForm((current) => {
      const exists = current.colors.some((item) => item.trim().toLowerCase() === color.toLowerCase())
      const nextColors = exists
        ? current.colors.filter((item) => item.trim().toLowerCase() !== color.toLowerCase())
        : [...current.colors.filter(Boolean), color]

      return { ...current, colors: nextColors.length ? nextColors : [''] }
    })
  }

  const addCustomAdminColor = () => {
    const normalized = adminCustomColor.trim()
    if (!normalized) return

    setProductForm((current) => {
      const exists = current.colors.some((item) => item.trim().toLowerCase() === normalized.toLowerCase())
      if (exists) return current
      return { ...current, colors: [...current.colors.filter(Boolean), normalized] }
    })

    setAdminCustomColor('')
  }

  const startEditingProduct = (product: Product) => {
    setEditingProductId(product.id)
    setProductSuccessMessage('')
    setProductForm({
      name: product.name,
      category: product.category,
      collectionId: product.collectionId ?? '',
      price: product.price,
      compareAtPrice: product.compareAtPrice ?? 0,
      description: product.description,
      material: product.material,
      colors: product.colors,
      sizes: product.sizes,
      stock: product.stock,
          isBestSeller: !!product.isBestSeller,
          image: product.image,
          images: uniqueImageList([product.image, ...(product.images ?? [])]),
          video: product.video ?? ''
        })
    setAdminCustomColor('')
    setAdminGalleryImageInput(emptyGalleryImageInput)
    setAdminColorsOpen(false)
    navigate('/admin/products')
  }

  const saveCollection = (event: FormEvent) => {
    event.preventDefault()
    const isEditingCollection = Boolean(editingCollectionId)

    const normalized: Collection = {
      id: editingCollectionId ?? `COL-${Date.now()}`,
      ...collectionForm,
      name: collectionForm.name.trim(),
      slug: (collectionForm.slug.trim() || collectionForm.name.trim().toLowerCase().replace(/\s+/g, '-')).replace(
        /[^a-z0-9-]/g,
        ''
      ),
      description: collectionForm.description.trim(),
      image: collectionForm.image.trim() || initialCollections[0].image,
      video: collectionForm.video?.trim() || undefined
    }

    if (!normalized.name || !normalized.slug || !normalized.description) return

    void (async () => {
      try {
        const savedCollection =
          isDatabaseReady && editingCollectionId
            ? await updateCollectionRequest(normalized)
            : isDatabaseReady
              ? await createCollectionRequest(normalized)
              : normalized

        setCollections((current) => {
          if (editingCollectionId) {
            return current.map((item) => (item.id === editingCollectionId ? savedCollection : item))
          }

          return [savedCollection, ...current]
        })

        setEditingCollectionId(null)
        setCollectionForm(emptyCollectionForm)
        setCollectionSuccessMessage(
          isEditingCollection
            ? `La collection "${savedCollection.name}" a bien ete mise a jour.`
            : `La collection "${savedCollection.name}" a bien ete ajoutee a la vitrine.`
        )
        showToast(isEditingCollection ? 'Collection mise a jour' : 'Collection ajoutee', 'La vitrine peut maintenant l utiliser.')
      } catch (error) {
        console.error(error)
        setCollectionSuccessMessage('')
        showToast('Echec de sauvegarde', 'Impossible d enregistrer la collection pour le moment.')
      }
    })()
  }

  const startEditingCollection = (collection: Collection) => {
    setEditingCollectionId(collection.id)
    setCollectionSuccessMessage('')
    setCollectionForm({
      name: collection.name,
      slug: collection.slug,
      description: collection.description,
      image: collection.image,
      video: collection.video ?? '',
      isFeatured: !!collection.isFeatured
    })
    navigate('/admin/products')
  }

  const handleCollectionVideoFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    event.target.value = ''

    void (async () => {
      try {
        const encodedVideo = await readVideoFile(file)
        setCollectionForm((current) => ({ ...current, video: encodedVideo }))
        showToast('Video ajoutee', 'La video de la tendance a ete preparee pour la vitrine.')
      } catch (error) {
        console.error(error)
        showToast('Video indisponible', 'Impossible de charger cette video. Utilisez un fichier plus leger.')
      }
    })()
  }

  const handleAdminLogin = (event: FormEvent) => {
    event.preventDefault()
    void (async () => {
      try {
        const success = await loginAdmin(loginForm.email, loginForm.password)
        if (!success) {
          setLoginError('Identifiants invalides. Verifiez votre email et votre mot de passe.')
          return
        }

        setLoginError('')
        showToast('Connexion reussie', 'Bienvenue dans le back-office prive de Yele House.')
        navigate('/admin/dashboard', { replace: true })
      } catch (error) {
        console.error(error)
        if (error instanceof ApiError) {
          if (error.status === 401) {
            setLoginError('Identifiants invalides. Verifiez votre email et votre mot de passe.')
            return
          }

          setLoginError(error.message)
          return
        }

        setLoginError('Connexion impossible. Verifiez la base admin ou relancez le service API.')
      }
    })()
  }

  const handleAdminLogout = () => {
    void (async () => {
      await logoutAdmin()
      setLoginForm(emptyAdminLoginForm)
      setShowAdminPassword(false)
      showToast('Session fermee', 'Vous avez ete deconnecte du back-office.')
      navigate('/admin/login', { replace: true })
    })()
  }

  const updateAdminOrderStatus = (order: Order, status: OrderStatus) => {
    void (async () => {
      try {
        const updatedOrder = isDatabaseReady ? await updateOrderStatusRequest(order.id, status) : { ...order, status }
        setOrders((current) => current.map((item) => (item.id === order.id ? updatedOrder : item)))
      } catch (error) {
        console.error(error)
        showToast('Mise a jour impossible', 'Le statut de la commande n a pas pu etre modifie.')
      }
    })()
  }

  const deleteAdminReview = (review: Review) => {
    void (async () => {
      try {
        const deletedReview = isDatabaseReady ? await deleteReviewRequest(review.id) : { ...review, deletedAt: new Date().toISOString() }
        setReviews((current) => current.filter((item) => item.id !== review.id))
        setDeletedReviews((current) => [deletedReview, ...current])
        showToast('Avis deplace', 'L avis a ete envoye dans la corbeille.')
      } catch (error) {
        console.error(error)
        showToast('Suppression impossible', 'L avis n a pas pu etre supprime.')
      }
    })()
  }

  const toggleAdminMessageRead = (message: ContactMessage) => {
    void (async () => {
      try {
        const updatedMessage = isDatabaseReady ? await updateMessageRequest(message.id, !message.isRead) : { ...message, isRead: !message.isRead }
        setMessages((current) => current.map((item) => (item.id === message.id ? updatedMessage : item)))
      } catch (error) {
        console.error(error)
        showToast('Mise a jour impossible', 'Le message n a pas pu etre modifie.')
      }
    })()
  }

  const cancelProductEditing = () => {
    setEditingProductId(null)
    setProductForm(emptyProductForm)
    setProductSuccessMessage('')
  }

  const deleteAdminProduct = (product: Product) => {
    void (async () => {
      try {
        const deletedProduct = isDatabaseReady ? await deleteProductRequest(product.id) : { ...product, deletedAt: new Date().toISOString() }
        setProducts((current) => current.filter((item) => item.id !== product.id))
        setDeletedProducts((current) => [deletedProduct, ...current])
        showToast('Produit deplace', 'Le produit a ete envoye dans la corbeille.')
      } catch (error) {
        console.error(error)
        showToast('Suppression impossible', 'Le produit n a pas pu etre retire.')
      }
    })()
  }

  const cancelCollectionEditing = () => {
    setEditingCollectionId(null)
    setCollectionForm(emptyCollectionForm)
    setCollectionSuccessMessage('')
  }

  const deleteAdminCollection = (collection: Collection) => {
    void (async () => {
      try {
        const deletedCollection = isDatabaseReady ? await deleteCollectionRequest(collection.id) : { ...collection, deletedAt: new Date().toISOString() }
        setCollections((current) => current.filter((item) => item.id !== collection.id))
        setDeletedCollections((current) => [deletedCollection, ...current])
        showToast('Collection deplacee', 'La tendance a ete envoyee dans la corbeille.')
      } catch (error) {
        console.error(error)
        showToast('Suppression impossible', 'La collection n a pas pu etre retiree.')
      }
    })()
  }

  const restoreDeletedCollection = (collection: Collection) => {
    void (async () => {
      try {
        const restored = isDatabaseReady ? await restoreCollectionRequest(collection.id) : { ...collection, deletedAt: undefined }
        setDeletedCollections((current) => current.filter((item) => item.id !== collection.id))
        setCollections((current) => [restored, ...current])
        showToast('Collection restauree', 'La tendance est de nouveau disponible dans l administration.')
      } catch (error) {
        console.error(error)
        showToast('Restauration impossible', 'La collection n a pas pu etre restauree.')
      }
    })()
  }

  const restoreDeletedProduct = (product: Product) => {
    void (async () => {
      try {
        const restored = isDatabaseReady ? await restoreProductRequest(product.id) : { ...product, deletedAt: undefined }
        setDeletedProducts((current) => current.filter((item) => item.id !== product.id))
        setProducts((current) => [restored, ...current])
        showToast('Produit restaure', 'Le produit est revenu dans le catalogue actif.')
      } catch (error) {
        console.error(error)
        showToast('Restauration impossible', 'Le produit n a pas pu etre restaure.')
      }
    })()
  }

  const restoreDeletedReview = (review: Review) => {
    void (async () => {
      try {
        const restored = isDatabaseReady ? await restoreReviewRequest(review.id) : { ...review, deletedAt: undefined }
        setDeletedReviews((current) => current.filter((item) => item.id !== review.id))
        setReviews((current) => [restored, ...current])
        showToast('Avis restaure', 'Le temoignage est de nouveau visible dans la moderation.')
      } catch (error) {
        console.error(error)
        showToast('Restauration impossible', 'L avis n a pas pu etre restaure.')
      }
    })()
  }

  const handleAdminPasswordChange = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSettingsPasswordError('')
    setSettingsPasswordSuccess('')

    const currentPassword = settingsPasswordForm.currentPassword.trim()
    const nextPassword = settingsPasswordForm.nextPassword.trim()
    const confirmPassword = settingsPasswordForm.confirmPassword.trim()

    if (!currentPassword || !nextPassword || !confirmPassword) {
      setSettingsPasswordError('Merci de renseigner les trois champs du formulaire.')
      return
    }

    if (nextPassword.length < 8) {
      setSettingsPasswordError('Le nouveau mot de passe doit contenir au moins 8 caracteres.')
      return
    }

    if (nextPassword !== confirmPassword) {
      setSettingsPasswordError('La confirmation ne correspond pas au nouveau mot de passe.')
      return
    }

    if (currentPassword === nextPassword) {
      setSettingsPasswordError('Choisissez un nouveau mot de passe different de l ancien.')
      return
    }

    void (async () => {
      try {
        await changeAdminPasswordRequest(currentPassword, nextPassword)
        setSettingsPasswordForm(emptyPasswordForm)
        setSettingsPasswordSuccess('Mot de passe mis a jour avec succes.')
        showToast('Mot de passe modifie', 'Le nouvel acces admin est maintenant actif.')
      } catch (error) {
        console.error(error)
        setSettingsPasswordError('Impossible de modifier le mot de passe. Verifiez votre code actuel.')
      }
    })()
  }

  const handleShippingSettingsSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setShippingSettingsMessage('')

    const sanitizedRates = Object.entries(shippingForm).reduce<ShippingRates>((accumulator, [commune, amount]) => {
      accumulator[commune] = Math.max(0, Number(amount) || 0)
      return accumulator
    }, {})

    if (!isDatabaseReady) {
      setShippingSettingsMessage('Base indisponible. Relancez l API avant d enregistrer les tarifs.')
      return
    }

    void (async () => {
      try {
        const savedRates = await updateShippingRatesRequest(sanitizedRates)
        setShippingRates(savedRates)
        setShippingForm(savedRates)
        setShippingSettingsMessage('Tarifs de livraison mis a jour.')

        if (!(orderForm.commune in savedRates)) {
          const firstCommune = Object.keys(savedRates)[0]
          if (firstCommune) {
            setOrderForm((current) => ({ ...current, commune: firstCommune }))
          }
        }

        showToast('Livraisons mises a jour', 'Les nouveaux prix sont deja actifs dans le panier.')
      } catch (error) {
        console.error(error)
        setShippingSettingsMessage('Impossible d enregistrer les nouveaux tarifs pour le moment.')
      }
    })()
  }

  if (path === '/admin/login') {
    return (
      <PageTransition pageKey={path}>
        <div className="min-h-screen overflow-hidden bg-[#fdf1f7] text-[#241f2b]">
          <ToastNotification open={!!toast.title} title={toast.title} message={toast.message} />
          <div className="promo-bar">
            <span>ESPACE ADMIN PRIVE YELE HOUSE&apos;S</span>
          </div>

          <div className="relative isolate flex min-h-[calc(100vh-38px)] items-center justify-center overflow-hidden px-5 py-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(239,76,174,0.16),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(126,60,241,0.18),_transparent_32%)]" />

            <div className="relative z-10 grid w-full max-w-[1180px] gap-8 xl:grid-cols-[0.95fr_0.8fr]">
              <RevealSection className="rounded-[30px] border border-[#decfe2] bg-[rgba(255,255,255,0.75)] p-8 backdrop-blur-xl xl:p-12">
                <p className="section-kicker text-left">BACK OFFICE PRIVE</p>
                <h1 className="mt-4 editorial-title text-[52px] leading-none text-[#241f2b] xl:text-[70px]">
                  Acces admin Yele House&apos;s
                </h1>
                <p className="mt-6 max-w-[560px] text-[16px] leading-8 text-[#6f657a]">
                  Cette entree n&apos;apparait jamais dans la vitrine publique. Elle donne acces uniquement au
                  back-office de gestion des commandes, produits, avis et messages.
                </p>
              </RevealSection>

              <RevealSection className="panel-card p-8 xl:p-10" delay={0.08}>
                <div className="mb-8 flex items-center gap-3">
                  <ShieldCheck size={18} className="text-[#f04cb3]" />
                  <h2 className="editorial-title text-[28px] font-semibold text-[#241f2b]">Connexion administrateur</h2>
                </div>

                <form onSubmit={handleAdminLogin} className="grid gap-5" autoComplete="off">
                  <input type="text" name="fake-admin-username" autoComplete="username" className="hidden" tabIndex={-1} />
                  <input type="password" name="fake-admin-password" autoComplete="current-password" className="hidden" tabIndex={-1} />
                  <div>
                    <label className="form-label">EMAIL</label>
                    <input
                      type="email"
                      name="admin-access-email"
                      autoComplete="off"
                      value={loginForm.email}
                      onChange={(event) => {
                        setLoginError('')
                        setLoginForm((current) => ({ ...current, email: event.target.value }))
                      }}
                      placeholder="Votre email administrateur"
                      className="field-input"
                    />
                  </div>

                  <div>
                    <label className="form-label">MOT DE PASSE</label>
                    <div className="relative">
                      <input
                        type={showAdminPassword ? 'text' : 'password'}
                        name="admin-access-passcode"
                        autoComplete="new-password"
                        value={loginForm.password}
                        onChange={(event) => {
                          setLoginError('')
                          setLoginForm((current) => ({ ...current, password: event.target.value }))
                        }}
                        placeholder="Votre mot de passe"
                        className="field-input pr-14"
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        aria-label={showAdminPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                        aria-pressed={showAdminPassword}
                        onClick={() => setShowAdminPassword((current) => !current)}
                      >
                        {showAdminPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {loginError ? (
                    <div className="rounded-[20px] border border-[#ef4cae]/25 bg-[#ef4cae]/10 px-4 py-3 text-sm text-[#b03b82]">
                      {loginError}
                    </div>
                  ) : null}

                  <motion.button type="submit" className="primary-button mt-2 w-full" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    Se connecter
                  </motion.button>
                </form>

                <div className="mt-8 rounded-[24px] border border-[#ded1e3] bg-[#fffdfd] p-5 text-sm leading-7 text-[#6f657a]">
                  Acces reserve a l&apos;administration de la Maison. Utilisez vos identifiants pour ouvrir le
                  back-office prive.
                </div>
              </RevealSection>
            </div>
          </div>
        </div>
      </PageTransition>
    )
  }

  if (path.startsWith('/admin')) {
    if (!adminAuthResolved) return null
    if (!isAdminAuthenticated()) return null

    return (
      <PageTransition pageKey={path}>
      <div className="min-h-screen bg-[#fdf1f7] text-[#241f2b]">
        <ToastNotification open={!!toast.title} title={toast.title} message={toast.message} />
        <div className="promo-bar">
          <span>ESPACE DE GESTION PRIVE YELE HOUSE&apos;S</span>
        </div>

        <header className="sticky top-0 z-40 border-b border-[#ecd3e4] bg-[rgba(253,241,247,0.94)] backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1280px] flex-col gap-5 px-5 py-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="flex items-end gap-2 leading-none">
                <span className="brand-mark text-[32px] text-[#241f2b]">YELE</span>
                <span className="brand-script text-[30px] text-[#d44aa1]">House&apos;s</span>
              </div>
              <p className="mt-1 text-[10px] uppercase tracking-[0.28em] text-[#7a6f86]">Administration privee</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="hidden items-center gap-2 rounded-full border border-[#dfd4e4] bg-white/70 px-4 py-2 text-sm text-[#6f657a] md:flex">
                <BadgePercent size={16} />
                Session admin securisee
              </div>
              <button type="button" onClick={handleAdminLogout} className="primary-button">
                <LogOut size={16} />
                Deconnexion
              </button>
            </div>
          </div>
        </header>

        <main className="section-shell py-10">
          <div className="admin-layout admin-layout-shell">
            <aside className="admin-sidebar">
              <div className="admin-sidebar-card admin-sidebar-nav-card">
                <div className="space-y-2">
                  {adminLinks.map((item) => {
                    const Icon = item.icon
                    const active = path === item.path
                    const badgeCount =
                      item.path === '/admin/orders'
                        ? pendingOrdersCount
                        : item.path === '/admin/messages'
                          ? unreadMessagesCount
                          : item.path === '/admin/trash'
                            ? trashItemsCount
                          : 0

                    return (
                      <button
                        key={item.path}
                        type="button"
                        onClick={() => navigate(item.path)}
                        className={`admin-nav-button ${active ? 'admin-nav-button-active' : ''}`}
                      >
                        <span className={`admin-nav-icon ${active ? 'admin-nav-icon-active' : ''}`}>
                          <Icon size={16} />
                        </span>
                        <span className="admin-nav-text">{item.label}</span>
                        {badgeCount ? <span className="admin-nav-badge">{badgeCount}</span> : null}
                      </button>
                    )
                  })}
                </div>
              </div>

            </aside>

            <section className="admin-content">
              <div className="admin-page-head">
                <div>
                  <p className="section-kicker text-left">{adminMeta.kicker}</p>
                  <h1 className="mt-3 editorial-title text-[34px] leading-none text-[#241f2b] xl:text-[42px]">
                    {adminMeta.title}
                  </h1>
                </div>
                <p className="admin-page-copy">{adminMeta.copy}</p>
              </div>

              <Suspense
                fallback={
                  <div className="grid gap-6">
                    <div className="panel-card p-7">
                      <div className="animate-pulse space-y-4">
                        <div className="h-5 w-40 rounded-full bg-[#f0d7e6]" />
                        <div className="h-16 rounded-[20px] bg-[#efe7f2]" />
                        <div className="h-40 rounded-[24px] bg-[#efe7f2]" />
                      </div>
                    </div>
                  </div>
                }
              >
                {adminPath === '/admin/dashboard' ? (
                  <AdminDashboardSection
                    dashboardStats={dashboardStats}
                    recentOrders={recentOrders}
                    recentCollections={recentCollections}
                    navigate={navigate}
                    startEditingCollection={startEditingCollection}
                  />
                ) : null}

                {adminPath === '/admin/orders' ? (
                  <AdminOrdersSection
                    visibleOrders={visibleOrders}
                    orderStatusFilter={orderStatusFilter}
                    setOrderStatusFilter={setOrderStatusFilter}
                    updateOrderStatus={updateAdminOrderStatus}
                  />
                ) : null}

                {adminPath === '/admin/products' ? (
                  <AdminProductsSection
                    productCategories={categories.slice(1) as Category[]}
                    collections={collections}
                    products={products}
                    collectionMap={collectionMap}
                    productForm={productForm}
                    setProductForm={setProductForm}
                    editingProductId={editingProductId}
                    saveProduct={saveProduct}
                    cancelProductEditing={cancelProductEditing}
                    productSuccessMessage={productSuccessMessage}
                    galleryInputRef={galleryInputRef}
                    cameraInputRef={cameraInputRef}
                    galleryVideoInputRef={galleryVideoInputRef}
                    cameraVideoInputRef={cameraVideoInputRef}
                    handleProductImageFile={handleProductImageFile}
                    handleProductVideoFile={handleProductVideoFile}
                    adminGalleryImageInput={adminGalleryImageInput}
                    setAdminGalleryImageInput={setAdminGalleryImageInput}
                    addGalleryImageFromUrl={addGalleryImageFromUrl}
                    setPrimaryGalleryImage={setPrimaryGalleryImage}
                    removeGalleryImage={removeGalleryImage}
                    adminColorsOpen={adminColorsOpen}
                    setAdminColorsOpen={setAdminColorsOpen}
                    adminColorOptions={adminColorOptions}
                    toggleAdminColor={toggleAdminColor}
                    adminCustomColor={adminCustomColor}
                    setAdminCustomColor={setAdminCustomColor}
                    addCustomAdminColor={addCustomAdminColor}
                    swatchColor={swatchColor}
                    startEditingProduct={startEditingProduct}
                    deleteAdminProduct={deleteAdminProduct}
                    collectionForm={collectionForm}
                    setCollectionForm={setCollectionForm}
                    editingCollectionId={editingCollectionId}
                    saveCollection={saveCollection}
                    cancelCollectionEditing={cancelCollectionEditing}
                    collectionSuccessMessage={collectionSuccessMessage}
                    collectionGalleryInputRef={collectionGalleryInputRef}
                    collectionCameraInputRef={collectionCameraInputRef}
                    collectionGalleryVideoInputRef={collectionGalleryVideoInputRef}
                    collectionCameraVideoInputRef={collectionCameraVideoInputRef}
                    handleCollectionImageFile={handleCollectionImageFile}
                    handleCollectionVideoFile={handleCollectionVideoFile}
                    startEditingCollection={startEditingCollection}
                    deleteAdminCollection={deleteAdminCollection}
                  />
                ) : null}

                {adminPath === '/admin/reviews' ? (
                  <AdminReviewsSection reviews={reviews} deleteReview={deleteAdminReview} />
                ) : null}

                {adminPath === '/admin/messages' ? (
                  <AdminMessagesSection messages={messages} toggleMessageRead={toggleAdminMessageRead} />
                ) : null}

                {adminPath === '/admin/trash' ? (
                  <AdminTrashSection
                    trashItemsCount={trashItemsCount}
                    deletedProducts={deletedProducts}
                    deletedCollections={deletedCollections}
                    deletedReviews={deletedReviews}
                    restoreDeletedProduct={restoreDeletedProduct}
                    restoreDeletedCollection={restoreDeletedCollection}
                    restoreDeletedReview={restoreDeletedReview}
                  />
                ) : null}

                {adminPath === '/admin/settings' ? (
                  <AdminSettingsSection
                    currentAdminEmail={currentAdminSession?.email}
                    settingsPasswordForm={settingsPasswordForm}
                    settingsPasswordError={settingsPasswordError}
                    settingsPasswordSuccess={settingsPasswordSuccess}
                    showSettingsPasswords={showSettingsPasswords}
                    shippingForm={shippingForm}
                    shippingSettingsMessage={shippingSettingsMessage}
                    setSettingsPasswordForm={setSettingsPasswordForm}
                    setSettingsPasswordError={setSettingsPasswordError}
                    setSettingsPasswordSuccess={setSettingsPasswordSuccess}
                    setShowSettingsPasswords={setShowSettingsPasswords}
                    setShippingForm={setShippingForm}
                    handleAdminPasswordChange={handleAdminPasswordChange}
                    handleShippingSettingsSubmit={handleShippingSettingsSubmit}
                  />
                ) : null}
              </Suspense>
            </section>
          </div>
        </main>
      </div>
      </PageTransition>
    )
  }

  const shouldShowPublicLoading =
    !isPublicBootstrapResolved &&
    collections.length === 0 &&
    products.length === 0 &&
    reviews.length === 0

  return (
    <PageTransition pageKey={path}>
    <div className="min-h-screen bg-[#fdf1f7] text-[#241f2b]">
      <ToastNotification open={!!toast.title} title={toast.title} message={toast.message} />
      <div className="promo-bar">
        <span>LIVRAISON EXPRESS A ABIDJAN EN 24H ET EXPEDITION DANS TOUTE LA COTE D&apos;IVOIRE</span>
      </div>

      <header className="sticky top-0 z-40 border-b border-[#ecd3e4] bg-[rgba(253,241,247,0.94)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-4 px-5 py-5">
          <button type="button" onClick={() => goToSection('accueil')} className="text-left">
            <div className="flex items-end gap-2 leading-none">
              <span className="brand-mark text-[32px] text-[#241f2b]">YELE</span>
              <span className="brand-script text-[30px] text-[#d44aa1]">House&apos;s</span>
            </div>
            <p className="mt-1 text-[10px] uppercase tracking-[0.28em] text-[#7a6f86]">Chic & glamour ivoirien</p>
          </button>

          <nav className="hidden items-center gap-8 lg:flex">
            {publicNavItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => goToSection(item.id)}
                className={`nav-link ${activeNav === item.id ? 'nav-link-active' : ''}`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3 text-[#332b3c]">
            <button type="button" className="icon-button hidden sm:inline-flex" aria-label="Recherche">
              <Search size={21} />
            </button>
            <button type="button" className="icon-button hidden sm:inline-flex" aria-label="Favoris">
              <Heart size={21} />
            </button>
            <button
              type="button"
              className="icon-button hidden sm:inline-flex"
              aria-label="Acces admin"
              onClick={() => navigate('/admin/login')}
            >
              <User size={21} />
            </button>
            <button type="button" className="icon-button" aria-label="Panier" onClick={() => setIsCartOpen(true)}>
              <ShoppingBag size={21} />
            </button>
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#e2d5e7] bg-white/70 text-[#241f2b] lg:hidden"
              onClick={() => setMobileMenuOpen((current) => !current)}
              aria-label="Menu mobile"
            >
              {mobileMenuOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>

        <div className="border-t border-[#eee5ef] px-5 pb-4 lg:hidden">
          <div className="mx-auto flex max-w-[1240px] gap-2 overflow-x-auto pt-4 mobile-tabs-scroll">
            {publicNavItems.map((item) => (
              <button
                key={`mobile-tab-${item.id}`}
                type="button"
                onClick={() => goToSection(item.id)}
                className={`mobile-tab-chip ${activeNav === item.id ? 'mobile-tab-chip-active' : ''}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen ? (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="border-t border-[#ecd3e4] bg-[#fdf1f7] px-5 py-4 lg:hidden"
            >
              <div className="mx-auto flex max-w-[1240px] flex-col gap-2">
                {publicNavItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => goToSection(item.id)}
                    className={`rounded-[18px] px-4 py-4 text-left text-sm font-semibold tracking-[0.06em] ${
                      activeNav === item.id ? 'bg-[#ef4cae]/10 text-[#f04cb3]' : 'bg-white text-[#5f556a]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </header>

      {shouldShowPublicLoading ? (
        <main className="border-b border-[#e4d9e8]">
          <section className="section-shell pb-12 pt-8">
            <div className="animate-pulse">
              <div className="grid gap-6 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={`loading-feature-${index}`}
                    className="overflow-hidden rounded-[30px] border border-[#e4d9e8] bg-white/70 shadow-[0_20px_60px_rgba(70,38,82,0.08)]"
                  >
                    <div className="h-[320px] bg-[#efe7f2]" />
                    <div className="space-y-4 p-6">
                      <div className="h-3 w-32 rounded-full bg-[#f0d7e6]" />
                      <div className="h-8 w-48 rounded-full bg-[#ece3ef]" />
                      <div className="h-4 w-full rounded-full bg-[#efe7f2]" />
                      <div className="h-4 w-3/4 rounded-full bg-[#efe7f2]" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-14">
                <div className="mx-auto h-3 w-40 rounded-full bg-[#f0d7e6]" />
                <div className="mx-auto mt-5 h-12 w-72 rounded-full bg-[#ece3ef]" />
              </div>

              <div className="mt-12 grid gap-8 md:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={`loading-product-${index}`} className="rounded-[24px] border border-[#ece2ee] bg-[#fffdfd] p-4">
                    <div className="h-56 rounded-[20px] bg-[#efe7f2]" />
                    <div className="mt-4 h-3 w-24 rounded-full bg-[#f0d7e6]" />
                    <div className="mt-3 h-7 w-40 rounded-full bg-[#ece3ef]" />
                    <div className="mt-3 h-4 w-full rounded-full bg-[#efe7f2]" />
                    <div className="mt-2 h-4 w-2/3 rounded-full bg-[#efe7f2]" />
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>
      ) : (
      <main className="border-b border-[#e4d9e8]">
        <section id="accueil" className="section-shell pb-12 pt-3">
          <RevealSection>
          {featuredCollections.length ? (
            <div className="mb-14 grid gap-6 lg:grid-cols-3">
              {featuredCollections.map((collection) => (
                <CollectionCardMotion
                  key={collection.id}
                  title={collection.name}
                  copy={collection.description}
                  image={collection.image}
                  video={collection.video}
                />
              ))}
            </div>
          ) : null}

          <div className="section-heading">
            <p className="section-kicker">CATEGORIES D&apos;EXCEPTION</p>
            <h1 className="section-title">Explorez l&apos;Univers Yele</h1>
            <div className="section-line" />
          </div>

          <div className="mt-14 grid gap-7 lg:grid-cols-4">
            {categoryHighlights.map((product) => {
              const copy = categoryCopy(product.category)

              return (
                <article key={product.id} className="feature-card">
                  <SmartMedia
                    image={product.image}
                    video={product.video}
                    alt={product.name}
                    fallbackImage={productFallbackImage(product.category)}
                    className="feature-card-image"
                  />
                  <div className="feature-card-body">
                    <p className="feature-kicker">{copy.kicker}</p>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="feature-title">{copy.title}</h2>
                        <p className="feature-text">{copy.body}</p>
                      </div>
                      <ArrowRight className="mt-2 shrink-0 text-[#8a7f95]" size={18} />
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
          </RevealSection>
        </section>

        <section id="boutique" className="section-shell border-t border-[#e4d9e8] py-12">
          <RevealSection>
          <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              {categories.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setCategory(item)
                    setActiveNav('boutique')
                  }}
                  className={`rounded-full border px-4 py-2 text-[12px] font-semibold tracking-[0.2em] transition ${
                    category === item
                      ? 'border-[#d63e9c] bg-[#d63e9c]/10 text-[#f04cb3]'
                      : 'border-[#dfd3e4] bg-white/90 text-[#6f657a]'
                  }`}
                >
                  {item === 'Tous' ? 'TOUT' : categoryLabel(item)}
                </button>
              ))}
            </div>

            <label className="search-shell">
              <Search size={16} className="text-[#8a7f95]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher une piece, un sac, un parfum..."
                className="w-full bg-transparent text-sm text-[#241f2b] outline-none placeholder:text-[#9a90a7]"
              />
            </label>
          </div>

          <div className="grid gap-x-8 gap-y-8 md:grid-cols-2 xl:grid-cols-4">
            {filteredProducts.map((product, index) => {
              const selection = selectedOptions[product.id] ?? {
                color: product.colors[0] ?? '',
                size: product.sizes[0] ?? '',
                image: product.image
              }

              return (
                <div
                  key={product.id}
                  className="motion-delay-shell"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <RevealSection delay={index * 0.03}>
                    <ProductCardMotion
                      badge={product.isBestSeller ? 'Best Seller' : 'Nouveau'}
                      category={categoryLabel(product.category)}
                      score={scoreForProduct(product)}
                      title={product.name}
                      copy={product.description}
                      price={currency.format(product.price)}
                      compareAtPrice={product.compareAtPrice ? currency.format(product.compareAtPrice) : undefined}
                      image={product.image}
                      video={product.video}
                      colors={product.colors}
                      sizes={product.sizes}
                      selectedColor={selection.color}
                      selectedSize={selection.size}
                      swatchColor={swatchColor}
                      onColorSelect={(item) =>
                        setSelectedOptions((current) => ({
                          ...current,
                          [product.id]: { ...selection, color: item }
                        }))
                      }
                      onSizeChange={(size) =>
                        setSelectedOptions((current) => ({
                          ...current,
                          [product.id]: { ...selection, size }
                        }))
                      }
                      onPreview={() => setPreviewProductId(product.id)}
                      onAdd={() => addToCart(product)}
                    />
                  </RevealSection>
                </div>
              )
            })}
          </div>
          </RevealSection>
        </section>

        <section id="avis" className="section-shell border-t border-[#e4d9e8] py-12">
          <RevealSection>
          <div className="section-heading">
            <h2 className="section-title">Ce que disent nos Reines</h2>
            <div className="section-line" />
            <p className="mx-auto mt-6 max-w-[660px] text-center text-[16px] leading-8 text-[#6f657a]">
              La satisfaction de nos clientes est au coeur de l&apos;esprit Yele. Decouvrez les retours
              d&apos;experience de nos fideles clientes partout en Cote d&apos;Ivoire.
            </p>
          </div>

          <div className="mt-14 grid gap-8 xl:grid-cols-[380px_minmax(0,1fr)]">
            <div className="review-score-card">
              <div>
                <p className="text-[15px] font-semibold uppercase tracking-[0.08em] text-[#332b3c]">NOTE GLOBALE</p>
                <div className="mt-8 text-[72px] font-semibold leading-none text-[#a14de5]">{averageRating.toFixed(1)}</div>
                <div className="mt-4 flex justify-center gap-1">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} size={24} fill="#ffbf2f" color="#ffbf2f" />
                  ))}
                </div>
                <p className="mx-auto mt-6 max-w-[260px] text-[15px] leading-7 text-[#70667d]">
                  Moyenne calculee sur plus de 1 200 commandes livrees en Cote d&apos;Ivoire.
                </p>
              </div>
            </div>

            <div className="panel-card p-8">
              <form onSubmit={submitReview}>
                <div className="mb-8 flex items-center gap-3">
                  <div className="h-4 w-4 rounded-sm border border-[#e74ca6]" />
                  <h3 className="editorial-title text-[22px] font-semibold text-[#241f2b]">Laissez Votre Temoignage</h3>
                </div>

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
                  <div>
                    <label className="form-label">VOTRE NOM COMPLET</label>
                    <input
                      value={reviewForm.author}
                      onChange={(event) => setReviewForm((current) => ({ ...current, author: event.target.value }))}
                      placeholder="Ex: Marie-Helene Kouadio"
                      className="field-input"
                    />
                  </div>

                  <div>
                    <label className="form-label">NOTE D&apos;ETOILES</label>
                    <div className="mt-4 flex gap-3">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setReviewForm((current) => ({ ...current, rating: value }))}
                          className="text-[#ffbf2f]"
                        >
                          <Star size={32} fill={reviewForm.rating >= value ? '#ffbf2f' : 'none'} color="#ffbf2f" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <label className="form-label">TITRE DU TEMOIGNAGE</label>
                  <input
                    value={reviewForm.title}
                    onChange={(event) => setReviewForm((current) => ({ ...current, title: event.target.value }))}
                    placeholder="Adresse rare"
                    className="field-input"
                  />
                </div>

                <div className="mt-6">
                  <label className="form-label">VOTRE COMMENTAIRE</label>
                  <textarea
                    value={reviewForm.body}
                    onChange={(event) => setReviewForm((current) => ({ ...current, body: event.target.value }))}
                    placeholder="Partagez votre avis sur la qualite, la coupe des robes, les sillages des parfums ou l'accueil du service client..."
                    rows={4}
                    className="field-area"
                  />
                </div>

                <div className="mt-6 flex justify-end">
                  <button type="submit" className="primary-button px-7">
                    Publier mon avis
                  </button>
                </div>
              </form>

              <div className="mt-10 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setReviewFilter(0)}
                  className={`filter-chip ${reviewFilter === 0 ? 'filter-chip-active' : ''}`}
                >
                  Tous
                </button>
                {[5, 4, 3].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setReviewFilter(value)}
                    className={`filter-chip ${reviewFilter === value ? 'filter-chip-active' : ''}`}
                  >
                    {value} etoiles
                  </button>
                ))}
              </div>

              <div className="mt-8 grid gap-4 lg:grid-cols-2">
                {visibleReviews.map((review) => (
                  <article key={review.id} className="rounded-[24px] border border-[#dfd3e4] bg-[#fffdfd] p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-[20px] font-semibold text-[#241f2b]">{review.title}</h3>
                        <p className="mt-1 text-sm text-[#8a7f95]">{review.author}</p>
                      </div>
                      <div className="flex gap-1">
                        {Array.from({ length: review.rating }).map((_, index) => (
                          <Star key={index} size={14} fill="#ffbf2f" color="#ffbf2f" />
                        ))}
                      </div>
                    </div>
                    <p className="mt-4 text-[15px] leading-7 text-[#6f657a]">{review.body}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
          </RevealSection>
        </section>

        <section id="contact" className="section-shell border-t border-[#e4d9e8] py-12">
          <RevealSection>
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="panel-card p-8">
              <p className="section-kicker text-left">A PROPOS DE LA MAISON</p>
              <h2 className="mt-3 editorial-title text-[54px] leading-none text-[#241f2b]">Maison Yele</h2>
              <p className="mt-6 text-[16px] leading-8 text-[#6f657a]">
                Yele House&apos;s imagine une experience retail qui ressemble a un salon prive d&apos;Abidjan:
                silhouettes couture, parfumerie d&apos;auteur, pieces de desir et accompagnement concierge.
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[22px] border border-[#dfd3e4] bg-[#fffdfd] p-5">
                  <p className="text-[12px] font-semibold tracking-[0.22em] text-[#f04cb3]">SHOWROOM</p>
                  <p className="mt-3 text-[15px] leading-7 text-[#5f556a]">Cocody Danga, Abidjan sur rendez-vous prive.</p>
                </div>
                <div className="rounded-[22px] border border-[#dfd3e4] bg-[#fffdfd] p-5">
                  <p className="text-[12px] font-semibold tracking-[0.22em] text-[#f04cb3]">CONCIERGERIE</p>
                  <p className="mt-3 text-[15px] leading-7 text-[#5f556a]">WhatsApp, sourcing, cadeaux et livraison personnalisee.</p>
                </div>
              </div>
            </div>

            <div className="panel-card p-8">
              <div className="mb-8 flex items-center gap-3">
                <Send size={18} className="text-[#f04cb3]" />
                <h3 className="editorial-title text-[22px] font-semibold text-[#241f2b]">Contact & Conciergerie</h3>
              </div>

              <form onSubmit={submitMessage} className="grid gap-5">
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="form-label">NOM COMPLET</label>
                    <input
                      value={contactForm.name}
                      onChange={(event) => setContactForm((current) => ({ ...current, name: event.target.value }))}
                      placeholder="Votre nom"
                      className="field-input"
                    />
                  </div>
                  <div>
                    <label className="form-label">NUMERO WHATSAPP</label>
                    <input
                      value={contactForm.phone}
                      onChange={(event) => setContactForm((current) => ({ ...current, phone: event.target.value }))}
                      placeholder="+225 07 00 00 00 00"
                      className="field-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">SUJET</label>
                  <input
                    value={contactForm.topic}
                    onChange={(event) => setContactForm((current) => ({ ...current, topic: event.target.value }))}
                    placeholder="Essayage prive, cadeau, sourcing..."
                    className="field-input"
                  />
                </div>

                <div>
                  <label className="form-label">MESSAGE</label>
                  <textarea
                    value={contactForm.message}
                    onChange={(event) => setContactForm((current) => ({ ...current, message: event.target.value }))}
                    rows={5}
                    placeholder="Decrivez votre demande"
                    className="field-area"
                  />
                </div>

                <div className="flex justify-end">
                  <button type="submit" className="primary-button px-7">
                    Envoyer a la Maison
                  </button>
                </div>
              </form>
            </div>
          </div>
          </RevealSection>
        </section>
      </main>
      )}

      <footer className="border-t border-[#ecd3e4] bg-[#f9e8f1]">
        <div className="section-shell flex flex-col gap-4 py-8 text-sm text-[#70667d] md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-semibold uppercase tracking-[0.16em] text-[#332b3c]">Yele House&apos;s</p>
            <p className="mt-2">Accueil, boutique, panier, checkout, contact et avis clients uniquement.</p>
          </div>
          <div className="flex flex-wrap gap-5 text-[#6f657a]">
            <button type="button" onClick={() => goToSection('accueil')}>
              Accueil
            </button>
            <button type="button" onClick={() => goToSection('boutique')}>
              Boutique
            </button>
            <button type="button" onClick={() => goToSection('avis')}>
              Avis clients
            </button>
            <button type="button" onClick={() => goToSection('contact')}>
              Contact
            </button>
          </div>
        </div>
      </footer>

      <AnimatedModal open={!!previewProduct} onClose={() => setPreviewProductId(null)}>
        {previewProduct ? (
          <div className="grid gap-6 md:grid-cols-[0.9fr_1.1fr]">
            <div className="premium-preview-media">
              {previewProduct.video ? (
                <motion.video
                  src={previewProduct.video}
                  poster={previewSelection?.image ?? previewProduct.image}
                  className="premium-preview-image"
                  autoPlay
                  muted
                  loop
                  playsInline
                  controls
                  whileHover={{ scale: 1.04 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                />
              ) : (
                <motion.img
                  src={previewSelection?.image ?? previewProduct.image}
                  alt={previewProduct.name}
                  className="premium-preview-image"
                  onError={(event) => applyImageFallback(event, productFallbackImage(previewProduct.category))}
                  whileHover={{ scale: 1.08 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                />
              )}
              <div className="premium-preview-overlay" />
            </div>

            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="product-category">{categoryLabel(previewProduct.category)}</p>
                  <h3 className="mt-3 editorial-title text-[34px] leading-none text-[#241f2b]">{previewProduct.name}</h3>
                </div>
                <AnimatedBadge className="mt-1">{previewProduct.isBestSeller ? 'Best Seller' : 'Abidjan Summer 2026'}</AnimatedBadge>
              </div>

              <p className="mt-5 text-[15px] leading-7 text-[#6f657a]">{previewProduct.description}</p>

              {previewProduct.images.length > 1 ? (
                <div className="mt-5 flex flex-wrap gap-3">
                  {previewProduct.images.map((image, index) => (
                    <button
                      key={`${image}-${index}`}
                      type="button"
                      onClick={() =>
                        setSelectedOptions((current) => ({
                          ...current,
                          [previewProduct.id]: { ...previewSelection!, image }
                        }))
                      }
                      className={`overflow-hidden rounded-[18px] border ${
                        (previewSelection?.image ?? previewProduct.image) === image ? 'border-[#f04cb3]' : 'border-[#dfd3e4]'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${previewProduct.name} visuel ${index + 1}`}
                        className="h-20 w-20 object-cover"
                        onError={(event) => applyImageFallback(event, productFallbackImage(previewProduct.category))}
                      />
                    </button>
                  ))}
                </div>
              ) : null}

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[20px] border border-[#dfd3e4] bg-[#fffdfd] p-4">
                  <p className="text-[12px] font-semibold tracking-[0.18em] text-[#f04cb3]">MATIERE</p>
                  <p className="mt-3 text-sm leading-7 text-[#5f556a]">{previewProduct.material}</p>
                </div>
                <div className="rounded-[20px] border border-[#dfd3e4] bg-[#fffdfd] p-4">
                  <p className="text-[12px] font-semibold tracking-[0.18em] text-[#f04cb3]">STOCK</p>
                  <p className="mt-3 text-sm leading-7 text-[#5f556a]">{previewProduct.stock} pieces disponibles</p>
                </div>
              </div>

              <div className="mt-5">
                {previewProduct.compareAtPrice ? (
                  <p className="text-[14px] text-[#8a7f95] line-through">{currency.format(previewProduct.compareAtPrice)}</p>
                ) : null}
                <p className="price-now mt-1">{currency.format(previewProduct.price)}</p>
              </div>

              <div className="mt-5">
                <p className="form-label">COULEURS</p>
                <div className="flex flex-wrap gap-2">
                  {previewProduct.colors.map((item) => {
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() =>
                          setSelectedOptions((current) => ({
                            ...current,
                            [previewProduct.id]: { ...previewSelection!, color: item }
                          }))
                        }
                        className={`flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition ${
                          previewSelection?.color === item ? 'border-[#ef4cae]/40 bg-[#ef4cae]/10 text-[#241f2b]' : 'border-[#dfd3e4] bg-white text-[#5f556a]'
                        }`}
                      >
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: swatchColor(item) }} />
                        {item}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="mt-5">
                <p className="form-label">TAILLE / FORMAT</p>
                <div className="flex flex-wrap gap-2">
                  {previewProduct.sizes.map((item) => {
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() =>
                          setSelectedOptions((current) => ({
                            ...current,
                            [previewProduct.id]: { ...previewSelection!, size: item }
                          }))
                        }
                        className={`rounded-full border px-3 py-2 text-sm transition ${
                          previewSelection?.size === item ? 'border-[#ef4cae]/40 bg-[#ef4cae]/10 text-[#241f2b]' : 'border-[#dfd3e4] bg-white text-[#5f556a]'
                        }`}
                      >
                        {item}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <motion.button type="button" onClick={addPreviewProductToCart} className="primary-button px-6" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  Ajouter au panier
                </motion.button>
                <motion.button type="button" onClick={() => setPreviewProductId(null)} className="secondary-button" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  Fermer
                </motion.button>
              </div>

              {relatedPreviewProducts.length ? (
                <div className="mt-8">
                  <p className="form-label">LOOK COMPLET</p>
                  <div className="mt-3 grid gap-3">
                    {relatedPreviewProducts.map((product) => (
                      <motion.button
                        key={product.id}
                        type="button"
                        onClick={() => openPreviewProduct(product.id)}
                        className="look-complete-card"
                        whileHover={{ y: -4, scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <img
                          src={product.image}
                          alt={product.name}
                          className="look-complete-image"
                          onError={(event) => applyImageFallback(event, productFallbackImage(product.category))}
                        />
                        <div className="min-w-0 flex-1 text-left">
                          <p className="text-[11px] font-semibold tracking-[0.16em] text-[#f04cb3]">{categoryLabel(product.category)}</p>
                          <h4 className="mt-1 truncate text-[15px] font-semibold text-[#241f2b]">{product.name}</h4>
                          <p className="mt-2 text-sm text-[#6f657a]">{currency.format(product.price)}</p>
                        </div>
                        <span className="text-[#9a90a7]">+</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </AnimatedModal>

      <CartDrawer open={isCartOpen} onClose={() => setIsCartOpen(false)}>
        <div className="flex items-center justify-between border-b border-[#e4d9e8] pb-5">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#f04cb3]/30 bg-[#f04cb3]/10 text-[#f04cb3]">
              <ShoppingBag size={18} />
            </span>
            <div>
              <h3 className="font-['Cormorant_Garamond'] text-[22px] font-semibold text-[#241f2b] sm:text-[26px]">
                Mon Panier Signature
              </h3>
              <p className="mt-1 text-[11px] font-semibold tracking-[0.18em] text-[#8a7f95]">
                {cart.length} ARTICLE{cart.length > 1 ? 'S' : ''} SELECTIONNE{cart.length > 1 ? 'S' : ''}
              </p>
            </div>
          </div>
          <button type="button" onClick={() => setIsCartOpen(false)} className="cart-close-button" aria-label="Fermer le panier">
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 flex-1 space-y-5 overflow-y-auto pr-1">
          <div className="cart-panel-section">
            <div className="mb-4 flex items-center justify-between gap-4">
              <p className="text-[11px] font-semibold tracking-[0.18em] text-[#8a7f95]">VOS ARTICLES SELECTIONNES</p>
              {cart.length ? (
                <button type="button" onClick={() => setCart([])} className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#f04cb3] transition hover:text-[#241f2b]">
                  Vider le panier
                </button>
              ) : null}
            </div>

            {cart.length ? (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={`${item.productId}-${item.color}-${item.size}`} className="cart-line-item">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="cart-line-image"
                      onError={(event) => applyImageFallback(event, productFallbackImage())}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="truncate text-[15px] font-semibold text-[#241f2b]">{item.name}</h4>
                          <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-medium text-[#7a6f86]">
                            <span className="cart-detail-pill">TAILLE : {item.size}</span>
                            <span className="cart-detail-pill">
                              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: swatchColor(item.color) }} />{item.color}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.productId, item.color, item.size)}
                          className="cart-icon-button"
                          aria-label={`Retirer ${item.name} du panier`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <div className="cart-quantity-control">
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(item.productId, item.color, item.size, -1)}
                            className="cart-quantity-button"
                            aria-label="Diminuer la quantite"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-6 text-center text-sm font-semibold text-[#241f2b]">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(item.productId, item.color, item.size, 1)}
                            className="cart-quantity-button"
                            aria-label="Augmenter la quantite"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <p className="text-[16px] font-semibold text-[#ff52b4]">{currency.format(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-[22px] border border-dashed border-[#d8cade] bg-white/80 p-6 text-sm text-[#8a7f95]">
                Le panier est vide pour le moment.
              </div>
            )}
          </div>

          <div className="cart-panel-section space-y-4">
            <div className="cart-location-row">
              <div className="flex items-center gap-2 text-sm font-medium text-[#5f556a]">
                <MapPin size={15} className="text-[#f04cb3]" />
                <span>Lieu de Livraison :</span>
              </div>
              <select
                value={orderForm.commune}
                onChange={(event) => setOrderForm((current) => ({ ...current, commune: event.target.value }))}
                className="cart-location-select"
              >
                {communeOptions.map((item) => (
                  <option key={item} value={item} className="bg-white text-[#241f2b]">
                    {item} ({(shippingRates[item] ?? 0).toLocaleString('fr-FR')} FCFA)
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-3 border-b border-[#e4d9e8] pb-4 text-sm">
              <div className="flex items-center justify-between text-[#70667d]">
                <span>Sous-total articles :</span>
                <span>{currency.format(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-[#70667d]">
                <span>Frais de livraison :</span>
                <span>{currency.format(shipping)}</span>
              </div>
              <div className="flex items-center justify-between text-[18px] font-semibold text-[#241f2b]">
                <span>Total general estime :</span>
                <span className="text-[#ff52b4]">{currency.format(total)}</span>
              </div>
            </div>

            <div>
              <p className="mb-4 text-[11px] font-semibold tracking-[0.18em] text-[#8a7f95]">DETAILS DE LIVRAISON</p>
              <div className="grid gap-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    value={orderForm.customerName}
                    onChange={(event) => setOrderForm((current) => ({ ...current, customerName: event.target.value }))}
                    placeholder="Votre nom complet"
                    className="cart-field-input"
                  />
                  <input
                    value={orderForm.phone}
                    onChange={(event) => setOrderForm((current) => ({ ...current, phone: event.target.value }))}
                    placeholder="Ex: +225 07..."
                    className="cart-field-input"
                  />
                </div>
                <input
                  value={orderForm.addressLine}
                  onChange={(event) => setOrderForm((current) => ({ ...current, addressLine: event.target.value }))}
                  placeholder="Quartier, Rue, Reperes exacts"
                  className="cart-field-input"
                />
                <textarea
                  value={orderForm.deliveryNotes}
                  onChange={(event) => setOrderForm((current) => ({ ...current, deliveryNotes: event.target.value }))}
                  rows={3}
                  placeholder="Instructions facultatives (ex: livraison l'apres-midi)"
                  className="cart-field-area"
                />
              </div>
            </div>
          </div>
        </div>

        <button type="button" onClick={submitOrder} className="cart-whatsapp-button mt-5 w-full" disabled={!cart.length}>
          <Phone size={18} />
          Commander via WhatsApp
          <ArrowRight size={18} />
        </button>
      </CartDrawer>
    </div>
    </PageTransition>
  )
}
