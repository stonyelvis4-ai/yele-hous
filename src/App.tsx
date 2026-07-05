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
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatedBadge } from './components/motion/AnimatedBadge'
import { CollectionCardMotion } from './components/motion/CollectionCardMotion'
import { CartDrawer } from './components/motion/CartDrawer'
import { AnimatedModal } from './components/motion/AnimatedModal'
import { PageTransition } from './components/motion/PageTransition'
import { ProductCardMotion } from './components/motion/ProductCardMotion'
import { RevealSection } from './components/motion/RevealSection'
import { ToastNotification } from './components/motion/ToastNotification'
import {
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
import { currency, datetime } from './utils/format'
import { buildWhatsAppUrl } from './utils/whatsapp'

const categories: Array<Category | 'Tous'> = ['Tous', 'Vetements', 'Sacs', 'Parfums', 'Accessoires']

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
  { path: '/admin/settings', label: 'Parametres', icon: Settings }
] as const

const protectedAdminPaths = ['/admin/dashboard', '/admin/orders', '/admin/products', '/admin/reviews', '/admin/messages', '/admin/settings'] as const

type PublicNavId = (typeof publicNavItems)[number]['id']
type AdminPath = (typeof protectedAdminPaths)[number]

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
  image: ''
}

const emptyReview = { author: '', rating: 5, title: '', body: '' }
const emptyMessage = { name: '', phone: '', topic: '', message: '' }
const emptyCollectionForm: Omit<Collection, 'id'> = {
  name: '',
  slug: '',
  description: '',
  image: '',
  isFeatured: false
}
const adminLoginDefaults = { email: 'admin@yelehouse.com', password: 'Admin@2026' }
const emptyToast = { title: '', message: '' }
const emptyPasswordForm = { currentPassword: '', nextPassword: '', confirmPassword: '' }

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
    default:
      return {
        kicker: 'BACK OFFICE',
        title: 'Tableau de Bord Admin',
        copy: 'Votre espace prive pilote les commandes, le catalogue, les avis et les messages de conciergerie.'
      }
  }
}

export default function App() {
  const [collections, setCollections] = useState<Collection[]>(initialCollections)
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [reviews, setReviews] = useState<Review[]>(initialReviews)
  const [messages, setMessages] = useState<ContactMessage[]>(initialMessages)
  const [shippingRates, setShippingRates] = useState<ShippingRates>(shippingByCommune)
  const [cart, setCart] = useLocalStorage<CartItem[]>('yele-cart', [])

  const [path, setPath] = useState(currentPathname)
  const [activeNav, setActiveNav] = useState<PublicNavId>('accueil')
  const [pendingSection, setPendingSection] = useState<PublicNavId | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [category, setCategory] = useState<Category | 'Tous'>('Tous')
  const [search, setSearch] = useState('')
  const [selectedOptions, setSelectedOptions] = useState<Record<string, { color: string; size: string }>>({})
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
  const [loginForm, setLoginForm] = useState(adminLoginDefaults)
  const [loginError, setLoginError] = useState('')
  const [showAdminPassword, setShowAdminPassword] = useState(false)
  const [settingsPasswordForm, setSettingsPasswordForm] = useState(emptyPasswordForm)
  const [settingsPasswordError, setSettingsPasswordError] = useState('')
  const [settingsPasswordSuccess, setSettingsPasswordSuccess] = useState('')
  const [shippingForm, setShippingForm] = useState<ShippingRates>(shippingByCommune)
  const [shippingSettingsMessage, setShippingSettingsMessage] = useState('')
  const [showSettingsPasswords, setShowSettingsPasswords] = useState({
    current: false,
    next: false,
    confirm: false
  })
  const [toast, setToast] = useState(emptyToast)
  const [previewProductId, setPreviewProductId] = useState<string | null>(null)
  const [adminCustomColor, setAdminCustomColor] = useState('')
  const [adminColorsOpen, setAdminColorsOpen] = useState(false)
  const [isDatabaseReady, setIsDatabaseReady] = useState(false)
  const [adminAuthResolved, setAdminAuthResolved] = useState(false)
  const galleryInputRef = useRef<HTMLInputElement | null>(null)
  const cameraInputRef = useRef<HTMLInputElement | null>(null)
  const communeOptions = useMemo(() => Object.keys(shippingRates), [shippingRates])

  useEffect(() => {
    const handlePopState = () => setPath(currentPathname())
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

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
          setMessages(bootstrap.messages)
          setShippingRates(bootstrap.shippingRates)
          setShippingForm(bootstrap.shippingRates)
        } else {
          const bootstrap = await fetchPublicBootstrap()
          if (ignore) return
          setCollections(bootstrap.collections)
          setProducts(bootstrap.products)
          setReviews(bootstrap.reviews)
          setShippingRates(bootstrap.shippingRates)
        }
        setIsDatabaseReady(true)
      } catch (error) {
        console.error(error)
        if (ignore) return
        setIsDatabaseReady(false)
        showToast('Mode local actif', 'La base ou la session admin n est pas joignable. L interface garde les donnees de demo.')
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

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const categoryMatch = category === 'Tous' || product.category === category
      const searchMatch =
        search.trim() === '' ||
        [product.name, product.description, product.material].join(' ').toLowerCase().includes(search.toLowerCase())

      return categoryMatch && searchMatch
    })
  }, [category, products, search])

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart])
  const shipping = shippingRates[orderForm.commune] ?? 0
  const total = subtotal + shipping

  const averageRating = useMemo(() => {
    if (!reviews.length) return 0
    return reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
  }, [reviews])

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

  const stockValue = useMemo(
    () => products.reduce((sum, product) => sum + product.price * product.stock, 0),
    [products]
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
        helper: `${reviews.length} temoignages verifies`,
        accent: 'pink' as const
      }
    ]
  }, [averageRating, deliveredOrdersCount, orders, pendingOrdersCount, products, reviews.length, stockValue])

  const recentOrders = useMemo(() => {
    return [...orders]
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
      .slice(0, 5)
  }, [orders])

  const visibleOrders = useMemo(() => {
    return orderStatusFilter === 'Tous' ? orders : orders.filter((order) => order.status === orderStatusFilter)
  }, [orderStatusFilter, orders])

  const visibleReviews = useMemo(() => {
    return reviewFilter === 0 ? reviews : reviews.filter((review) => review.rating === reviewFilter)
  }, [reviewFilter, reviews])

  const categoryHighlights = useMemo(() => {
    return [
      products.find((item) => item.category === 'Vetements'),
      products.find((item) => item.category === 'Sacs'),
      products.find((item) => item.category === 'Parfums'),
      products.find((item) => item.category === 'Accessoires')
    ].filter(Boolean) as Product[]
  }, [products])

  const featuredCollections = useMemo(() => {
    return collections.filter((collection) => collection.isFeatured).slice(0, 3)
  }, [collections])

  const collectionMap = useMemo(
    () => collections.reduce<Record<string, Collection>>((accumulator, collection) => {
      accumulator[collection.id] = collection
      return accumulator
    }, {}),
    [collections]
  )

  const previewProduct = useMemo(
    () => products.find((product) => product.id === previewProductId) ?? null,
    [previewProductId, products]
  )
  const previewSelection = previewProduct
    ? selectedOptions[previewProduct.id] ?? {
        color: previewProduct.colors[0] ?? '',
        size: previewProduct.sizes[0] ?? ''
      }
    : null
  const relatedPreviewProducts = useMemo(() => {
    if (!previewProduct) return []

    const differentCategory = products.filter(
      (product) => product.id !== previewProduct.id && product.category !== previewProduct.category
    )
    const sameCategory = products.filter(
      (product) => product.id !== previewProduct.id && product.category === previewProduct.category
    )

    return [...differentCategory, ...sameCategory].slice(0, 3)
  }, [previewProduct, products])

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
      size: product.sizes[0] ?? 'Unique'
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

    const normalized: Product = {
      id: editingProductId ?? `PROD-${Date.now()}`,
      ...productForm,
      name: productForm.name.trim(),
      description: productForm.description.trim(),
      material: productForm.material.trim(),
      image: productForm.image.trim() || initialProducts[0].image,
      collectionId: productForm.collectionId?.trim() || undefined,
      colors: productForm.colors.map((item) => item.trim()).filter(Boolean),
      sizes: productForm.sizes.map((item) => item.trim()).filter(Boolean),
      compareAtPrice: productForm.compareAtPrice || undefined
    }

    if (!normalized.name || !normalized.description || !normalized.material || normalized.colors.length === 0) return

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
        setAdminColorsOpen(false)
        showToast(editingProductId ? 'Produit mis a jour' : 'Produit ajoute', 'Le catalogue premium a ete synchronise.')
      } catch (error) {
        console.error(error)
        showToast('Echec de sauvegarde', 'Impossible d enregistrer le produit pour le moment.')
      }
    })()
  }

  const handleProductImageFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      if (!result) return
      setProductForm((current) => ({ ...current, image: result }))
      showToast('Image ajoutee', 'Le visuel du produit a bien ete charge.')
    }
    reader.readAsDataURL(file)
    event.target.value = ''
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
      image: product.image
    })
    setAdminCustomColor('')
    setAdminColorsOpen(false)
    navigate('/admin/products')
  }

  const saveCollection = (event: FormEvent) => {
    event.preventDefault()

    const normalized: Collection = {
      id: editingCollectionId ?? `COL-${Date.now()}`,
      ...collectionForm,
      name: collectionForm.name.trim(),
      slug: (collectionForm.slug.trim() || collectionForm.name.trim().toLowerCase().replace(/\s+/g, '-')).replace(
        /[^a-z0-9-]/g,
        ''
      ),
      description: collectionForm.description.trim(),
      image: collectionForm.image.trim() || initialCollections[0].image
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
        showToast(editingCollectionId ? 'Collection mise a jour' : 'Collection ajoutee', 'La vitrine peut maintenant l utiliser.')
      } catch (error) {
        console.error(error)
        showToast('Echec de sauvegarde', 'Impossible d enregistrer la collection pour le moment.')
      }
    })()
  }

  const startEditingCollection = (collection: Collection) => {
    setEditingCollectionId(collection.id)
    setCollectionForm({
      name: collection.name,
      slug: collection.slug,
      description: collection.description,
      image: collection.image,
      isFeatured: !!collection.isFeatured
    })
    navigate('/admin/products')
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
        setLoginError('Connexion impossible. Verifiez la base admin ou relancez le service API.')
      }
    })()
  }

  const handleAdminLogout = () => {
    void (async () => {
      await logoutAdmin()
      showToast('Session fermee', 'Vous avez ete deconnecte du back-office.')
      navigate('/admin/login', { replace: true })
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
        <div className="min-h-screen overflow-hidden bg-[#f8f4ef] text-[#241f2b]">
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

                <form onSubmit={handleAdminLogin} className="grid gap-5">
                  <div>
                    <label className="form-label">EMAIL</label>
                    <input
                      type="email"
                      value={loginForm.email}
                      onChange={(event) => {
                        setLoginError('')
                        setLoginForm((current) => ({ ...current, email: event.target.value }))
                      }}
                      placeholder="admin@yelehouse.com"
                      className="field-input"
                    />
                  </div>

                  <div>
                    <label className="form-label">MOT DE PASSE</label>
                    <div className="relative">
                      <input
                        type={showAdminPassword ? 'text' : 'password'}
                        value={loginForm.password}
                        onChange={(event) => {
                          setLoginError('')
                          setLoginForm((current) => ({ ...current, password: event.target.value }))
                        }}
                        placeholder="Admin@2026"
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
      <div className="min-h-screen bg-[#f8f4ef] text-[#241f2b]">
        <ToastNotification open={!!toast.title} title={toast.title} message={toast.message} />
        <div className="promo-bar">
          <span>ESPACE DE GESTION PRIVE YELE HOUSE&apos;S</span>
        </div>

        <header className="sticky top-0 z-40 border-b border-[#e4d9e8] bg-[rgba(248,244,239,0.94)] backdrop-blur-xl">
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

              {adminPath === '/admin/dashboard' ? (
                <div className="admin-stats-grid">
                  {dashboardStats.map((stat) => (
                    <div key={stat.label} className={`admin-stat-card admin-stat-card-${stat.accent}`}>
                      <p className="admin-stat-label">{stat.label}</p>
                      <h3 className="admin-stat-value">{stat.value}</h3>
                      <p className="admin-stat-helper">{stat.helper}</p>
                    </div>
                  ))}
                </div>
              ) : null}

              {adminPath === '/admin/dashboard' ? (
                <div className="panel-card admin-table-card p-7">
                  <div className="admin-table-head">
                    <div className="flex items-center gap-3">
                      <LayoutDashboard size={18} className="text-[#f04cb3]" />
                      <h2 className="editorial-title text-[22px] font-semibold text-[#241f2b]">
                        Dernieres Commandes Recues
                      </h2>
                    </div>
                    <button type="button" onClick={() => navigate('/admin/orders')} className="admin-link-button">
                      Voir tout
                    </button>
                  </div>

                  <div className="admin-order-table">
                    <div className="admin-order-row admin-order-row-head">
                      <span>Client</span>
                      <span>Quartier & Ville</span>
                      <span>Date</span>
                      <span>Montant</span>
                      <span>Statut</span>
                    </div>

                    {recentOrders.map((order) => (
                      <div key={order.id} className="admin-order-row">
                        <div>
                          <strong className="admin-order-primary">{order.customerName}</strong>
                          <span className="admin-order-secondary">{order.phone}</span>
                        </div>
                        <div>
                          <strong className="admin-order-primary">Abidjan - {order.commune}</strong>
                          <span className="admin-order-secondary">
                            {order.notes?.trim() ? order.notes : 'Commande conciergerie Yele House'}
                          </span>
                        </div>
                        <span className="admin-order-muted">{datetime.format(new Date(order.createdAt))}</span>
                        <strong className="admin-order-amount">{currency.format(order.total)}</strong>
                        <span
                          className={`admin-status-pill ${
                            order.status === 'Livree'
                              ? 'admin-status-pill-success'
                              : order.status === 'Annulee'
                                ? 'admin-status-pill-cancelled'
                                : 'admin-status-pill-pending'
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {adminPath === '/admin/orders' ? (
                <div className="panel-card p-7">
              <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                  <ClipboardList size={18} className="text-[#f04cb3]" />
                  <h2 className="text-[22px] font-semibold text-[#241f2b]">Gestion des Commandes</h2>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(['Tous', 'En attente', 'Livree', 'Annulee'] as const).map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setOrderStatusFilter(value)}
                      className={`filter-chip ${orderStatusFilter === value ? 'filter-chip-active' : ''}`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                {visibleOrders.map((order) => (
                  <div key={order.id} className="rounded-[22px] border border-[#dfd3e4] bg-[#fffdfd] p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <h3 className="text-[18px] font-semibold text-[#241f2b]">
                          {order.id} - {order.customerName}
                        </h3>
                        <p className="mt-1 text-sm text-[#8a7f95]">
                          {order.commune} • {datetime.format(new Date(order.createdAt))}
                        </p>
                        <p className="mt-3 text-[#f04cb3]">{currency.format(order.total)}</p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {(['En attente', 'Livree', 'Annulee'] as OrderStatus[]).map((status) => (
                          <button
                            key={status}
                            type="button"
                            onClick={() => {
                              void (async () => {
                                try {
                                  const updatedOrder = isDatabaseReady
                                    ? await updateOrderStatusRequest(order.id, status)
                                    : { ...order, status }
                                  setOrders((current) =>
                                    current.map((item) => (item.id === order.id ? updatedOrder : item))
                                  )
                                } catch (error) {
                                  console.error(error)
                                  showToast('Mise a jour impossible', 'Le statut de la commande n a pas pu etre modifie.')
                                }
                              })()
                            }}
                            className={`filter-chip ${order.status === status ? 'filter-chip-active' : ''}`}
                          >
                            {status}
                          </button>
                        ))}
                        <a
                          href={`https://wa.me/${order.phone}`}
                          target="_blank"
                          rel="noreferrer"
                          className="primary-button px-4 py-3 text-[13px]"
                        >
                          WhatsApp
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
                </div>
              ) : null}

              {adminPath === '/admin/products' ? (
                <div className="panel-card p-7">
              <div className="mb-6 flex items-center gap-3">
                <PackagePlus size={18} className="text-[#f04cb3]" />
                <h2 className="text-[22px] font-semibold text-[#241f2b]">Catalogue Premium (CRUD)</h2>
              </div>

              <form onSubmit={saveProduct} className="grid gap-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="form-label">NOM DU PRODUIT</label>
                    <input
                      value={productForm.name}
                      onChange={(event) => setProductForm((current) => ({ ...current, name: event.target.value }))}
                      placeholder="Ex: Robe Satin Imperiale"
                      className="field-input"
                    />
                  </div>
                  <div>
                    <label className="form-label">CATEGORIE</label>
                    <select
                      value={productForm.category}
                      onChange={(event) => setProductForm((current) => ({ ...current, category: event.target.value as Category }))}
                      className="field-input"
                    >
                      {categories.slice(1).map((item) => (
                        <option key={item} value={item} className="bg-white text-[#241f2b]">
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">COLLECTION</label>
                    <select
                      value={productForm.collectionId ?? ''}
                      onChange={(event) => setProductForm((current) => ({ ...current, collectionId: event.target.value }))}
                      className="field-input"
                    >
                      <option value="">Aucune collection</option>
                      {collections.map((collection) => (
                        <option key={collection.id} value={collection.id}>
                          {collection.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="form-label">PRIX ACTUEL</label>
                    <input
                      type="number"
                      min="0"
                      value={productForm.price}
                      onChange={(event) => setProductForm((current) => ({ ...current, price: Number(event.target.value) }))}
                      placeholder="Ex: 35000"
                      className="field-input"
                    />
                    <p className="admin-field-help">Prix de vente affiche au client, en FCFA.</p>
                  </div>
                  <div>
                    <label className="form-label">PRIX BARRE</label>
                    <input
                      type="number"
                      min="0"
                      value={productForm.compareAtPrice}
                      onChange={(event) => setProductForm((current) => ({ ...current, compareAtPrice: Number(event.target.value) }))}
                      placeholder="Ex: 42000"
                      className="field-input"
                    />
                    <p className="admin-field-help">Ancien prix ou prix de reference pour une promotion.</p>
                  </div>
                  <div>
                    <label className="form-label">STOCK DISPONIBLE</label>
                    <input
                      type="number"
                      min="0"
                      value={productForm.stock}
                      onChange={(event) => setProductForm((current) => ({ ...current, stock: Number(event.target.value) }))}
                      placeholder="Ex: 5"
                      className="field-input"
                    />
                    <p className="admin-field-help">Nombre de pieces actuellement disponibles.</p>
                  </div>
                </div>

                <div>
                  <label className="form-label">DESCRIPTION EDITORIALE</label>
                  <textarea
                    rows={3}
                    value={productForm.description}
                    onChange={(event) => setProductForm((current) => ({ ...current, description: event.target.value }))}
                    placeholder="Decrivez la piece, son allure, son univers et sa promesse."
                    className="field-area"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="form-label">MATIERES</label>
                    <input
                      value={productForm.material}
                      onChange={(event) => setProductForm((current) => ({ ...current, material: event.target.value }))}
                      placeholder="Ex: Satin de soie, cuir saffiano, oud"
                      className="field-input"
                    />
                  </div>
                  <div>
                    <label className="form-label">IMAGE DU PRODUIT</label>
                    <input
                      value={productForm.image}
                      onChange={(event) => setProductForm((current) => ({ ...current, image: event.target.value }))}
                      placeholder="Collez l'URL complete de l'image"
                      className="field-input"
                    />
                    <input
                      ref={galleryInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleProductImageFile}
                    />
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handleProductImageFile}
                    />
                    <div className="admin-upload-actions">
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => cameraInputRef.current?.click()}
                      >
                        Prendre une photo
                      </button>
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => galleryInputRef.current?.click()}
                      >
                        Choisir une photo
                      </button>
                    </div>
                    <p className="admin-field-help">
                      Utilisez l&apos;appareil photo si disponible, ou selectionnez une image depuis la galerie.
                    </p>
                    {productForm.image ? (
                      <div className="admin-image-preview">
                        <img src={productForm.image} alt="Apercu du produit" className="admin-image-preview-media" />
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="form-label">COULEURS</label>
                    <button
                      type="button"
                      className={`admin-color-toggle ${adminColorsOpen ? 'admin-color-toggle-open' : ''}`}
                      onClick={() => setAdminColorsOpen((current) => !current)}
                    >
                      <span>
                        {productForm.colors.filter(Boolean).length
                          ? `${productForm.colors.filter(Boolean).length} couleur(s) selectionnee(s)`
                          : 'Choisir des couleurs'}
                      </span>
                      <ChevronDown size={18} className={`admin-color-toggle-icon ${adminColorsOpen ? 'admin-color-toggle-icon-open' : ''}`} />
                    </button>
                    {adminColorsOpen ? (
                      <>
                        <div className="admin-color-grid">
                          {adminColorOptions.map((color) => {
                            const active = productForm.colors.some(
                              (item) => item.trim().toLowerCase() === color.toLowerCase()
                            )

                            return (
                              <button
                                key={color}
                                type="button"
                                onClick={() => toggleAdminColor(color)}
                                className={`admin-color-option ${active ? 'admin-color-option-active' : ''}`}
                              >
                                <span
                                  className="admin-color-swatch"
                                  style={{ backgroundColor: swatchColor(color) }}
                                />
                                <span>{color}</span>
                              </button>
                            )
                          })}
                        </div>
                        <div className="admin-custom-color-row">
                          <input
                            value={adminCustomColor}
                            onChange={(event) => setAdminCustomColor(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') {
                                event.preventDefault()
                                addCustomAdminColor()
                              }
                            }}
                            placeholder="Ajouter une couleur personnalisee"
                            className="field-input"
                          />
                          <button type="button" onClick={addCustomAdminColor} className="secondary-button">
                            <Plus size={16} />
                            Ajouter
                          </button>
                        </div>
                      </>
                    ) : null}
                    {productForm.colors.filter(Boolean).length ? (
                      <div className="admin-selected-colors">
                        {productForm.colors.filter(Boolean).map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => toggleAdminColor(color)}
                            className="admin-selected-color-pill"
                          >
                            <span
                              className="admin-color-swatch admin-color-swatch-sm"
                              style={{ backgroundColor: swatchColor(color) }}
                            />
                            <span>{color}</span>
                            <span className="admin-selected-color-remove">×</span>
                          </button>
                        ))}
                      </div>
                    ) : null}
                    <p className="admin-field-help">Cliquez sur les couleurs disponibles ou ajoutez une nuance personnalisee.</p>
                  </div>
                  <div>
                    <label className="form-label">TAILLES OU FORMATS</label>
                    <input
                      value={productForm.sizes.join(', ')}
                      onChange={(event) => setProductForm((current) => ({ ...current, sizes: event.target.value.split(',') }))}
                      placeholder="Ex: S, M, L ou 50ml, 100ml"
                      className="field-input"
                    />
                    <p className="admin-field-help">Separez chaque taille ou format par une virgule.</p>
                  </div>
                </div>

                <label className="flex items-center gap-3 text-sm text-[#6f657a]">
                  <input
                    type="checkbox"
                    checked={productForm.isBestSeller}
                    onChange={(event) => setProductForm((current) => ({ ...current, isBestSeller: event.target.checked }))}
                  />
                  Best Seller
                </label>

                <div className="flex flex-wrap gap-3">
                  <button type="submit" className="primary-button px-6">
                    <Box size={16} />
                    {editingProductId ? 'Mettre a jour' : 'Ajouter le produit'}
                  </button>
                  {editingProductId ? (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingProductId(null)
                        setProductForm(emptyProductForm)
                      }}
                      className="secondary-button"
                    >
                      Annuler
                    </button>
                  ) : null}
                </div>
              </form>

              <div className="mt-6 space-y-3">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="flex flex-col gap-4 rounded-[22px] border border-[#dfd3e4] bg-[#fffdfd] p-4 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <img src={product.image} alt={product.name} className="h-14 w-14 rounded-[16px] object-cover" />
                      <div>
                        <h3 className="font-semibold text-[#241f2b]">{product.name}</h3>
                        <p className="mt-1 text-sm text-[#8a7f95]">
                          {product.category} • stock {product.stock}
                        </p>
                        {product.collectionId && collectionMap[product.collectionId] ? (
                          <p className="mt-1 text-xs font-semibold tracking-[0.12em] text-[#f04cb3]">
                            {collectionMap[product.collectionId].name}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => startEditingProduct(product)} className="secondary-button">
                        Editer
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          void (async () => {
                            try {
                              if (isDatabaseReady) {
                                await deleteProductRequest(product.id)
                              }
                              setProducts((current) => current.filter((item) => item.id !== product.id))
                            } catch (error) {
                              console.error(error)
                              showToast('Suppression impossible', 'Le produit n a pas pu etre retire.')
                            }
                          })()
                        }}
                        className="secondary-button"
                      >
                        Retirer
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-10 border-t border-[#e4d9e8] pt-8">
                <div className="mb-6 flex items-center gap-3">
                  <BadgePercent size={18} className="text-[#f04cb3]" />
                  <h2 className="text-[22px] font-semibold text-[#241f2b]">Collections Signature</h2>
                </div>

                <form onSubmit={saveCollection} className="grid gap-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <input
                      value={collectionForm.name}
                      onChange={(event) => setCollectionForm((current) => ({ ...current, name: event.target.value }))}
                      placeholder="Nom de la collection"
                      className="field-input"
                    />
                    <input
                      value={collectionForm.slug}
                      onChange={(event) => setCollectionForm((current) => ({ ...current, slug: event.target.value }))}
                      placeholder="Slug URL"
                      className="field-input"
                    />
                  </div>
                  <textarea
                    rows={3}
                    value={collectionForm.description}
                    onChange={(event) => setCollectionForm((current) => ({ ...current, description: event.target.value }))}
                    placeholder="Description editoriale de la collection"
                    className="field-area"
                  />
                  <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                    <input
                      value={collectionForm.image}
                      onChange={(event) => setCollectionForm((current) => ({ ...current, image: event.target.value }))}
                      placeholder="URL image de collection"
                      className="field-input"
                    />
                    <label className="flex items-center gap-3 text-sm text-[#6f657a]">
                      <input
                        type="checkbox"
                        checked={collectionForm.isFeatured}
                        onChange={(event) => setCollectionForm((current) => ({ ...current, isFeatured: event.target.checked }))}
                      />
                      Collection mise en avant
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button type="submit" className="primary-button px-6">
                      {editingCollectionId ? 'Mettre a jour la collection' : 'Ajouter la collection'}
                    </button>
                    {editingCollectionId ? (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCollectionId(null)
                          setCollectionForm(emptyCollectionForm)
                        }}
                        className="secondary-button"
                      >
                        Annuler
                      </button>
                    ) : null}
                  </div>
                </form>

                <div className="mt-6 grid gap-4 lg:grid-cols-2">
                  {collections.map((collection) => (
                    <div key={collection.id} className="rounded-[22px] border border-[#dfd3e4] bg-[#fffdfd] p-4">
                      <div className="flex items-start gap-4">
                        <img src={collection.image} alt={collection.name} className="h-16 w-16 rounded-[16px] object-cover" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <h3 className="font-semibold text-[#241f2b]">{collection.name}</h3>
                            {collection.isFeatured ? (
                              <span className="rounded-full bg-[#ef4cae]/10 px-3 py-1 text-xs font-semibold text-[#f04cb3]">
                                Featured
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-2 text-sm leading-6 text-[#6f657a]">{collection.description}</p>
                          <div className="mt-4 flex gap-2">
                            <button type="button" onClick={() => startEditingCollection(collection)} className="secondary-button">
                              Editer
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                void (async () => {
                                  try {
                                    if (isDatabaseReady) {
                                      await deleteCollectionRequest(collection.id)
                                    }
                                    setCollections((current) => current.filter((item) => item.id !== collection.id))
                                    setProducts((current) =>
                                      current.map((product) =>
                                        product.collectionId === collection.id ? { ...product, collectionId: undefined } : product
                                      )
                                    )
                                  } catch (error) {
                                    console.error(error)
                                    showToast('Suppression impossible', 'La collection n a pas pu etre retiree.')
                                  }
                                })()
                              }}
                              className="secondary-button"
                            >
                              Supprimer
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
              ) : null}

              {adminPath === '/admin/reviews' ? (
                <div className="panel-card p-7">
              <div className="mb-6 flex items-center gap-3">
                <Filter size={18} className="text-[#f04cb3]" />
                <h2 className="text-[22px] font-semibold text-[#241f2b]">Moderation des Avis</h2>
              </div>

              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="rounded-[22px] border border-[#dfd3e4] bg-[#fffdfd] p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-[#241f2b]">{review.title}</h3>
                        <p className="mt-1 text-sm text-[#8a7f95]">
                          {review.author} • {review.rating}/5
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          void (async () => {
                            try {
                              if (isDatabaseReady) {
                                await deleteReviewRequest(review.id)
                              }
                              setReviews((current) => current.filter((item) => item.id !== review.id))
                            } catch (error) {
                              console.error(error)
                              showToast('Suppression impossible', 'L avis n a pas pu etre supprime.')
                            }
                          })()
                        }}
                        className="icon-soft"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-[#6f657a]">{review.body}</p>
                  </div>
                ))}
              </div>
                </div>
              ) : null}

              {adminPath === '/admin/messages' ? (
                <div className="panel-card p-7">
              <div className="mb-6 flex items-center gap-3">
                <MessageCircleMore size={18} className="text-[#f04cb3]" />
                <h2 className="text-[22px] font-semibold text-[#241f2b]">Messagerie de Conciergerie</h2>
              </div>

              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className="rounded-[22px] border border-[#dfd3e4] bg-[#fffdfd] p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-[#241f2b]">{message.topic}</h3>
                        <p className="mt-1 text-sm text-[#8a7f95]">
                          {message.name} • {datetime.format(new Date(message.createdAt))}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          void (async () => {
                            try {
                              const updatedMessage = isDatabaseReady
                                ? await updateMessageRequest(message.id, !message.isRead)
                                : { ...message, isRead: !message.isRead }
                              setMessages((current) =>
                                current.map((item) => (item.id === message.id ? updatedMessage : item))
                              )
                            } catch (error) {
                              console.error(error)
                              showToast('Mise a jour impossible', 'Le message n a pas pu etre modifie.')
                            }
                          })()
                        }}
                        className={`filter-chip ${message.isRead ? '' : 'filter-chip-active'}`}
                      >
                        {message.isRead ? 'Lu' : 'Non lu'}
                      </button>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-[#6f657a]">{message.message}</p>
                    <a href={`https://wa.me/${message.phone}`} target="_blank" rel="noreferrer" className="mt-4 inline-flex primary-button px-5">
                      Reponse directe
                    </a>
                  </div>
                ))}
              </div>
                </div>
              ) : null}

              {adminPath === '/admin/settings' ? (
                <div className="grid gap-6">
                  <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                    <div className="panel-card p-7">
                      <div className="mb-6 flex items-center gap-3">
                        <Settings size={18} className="text-[#f04cb3]" />
                        <h2 className="text-[22px] font-semibold text-[#241f2b]">Compte administrateur</h2>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="admin-info-card">
                          <span className="admin-info-label">Email de connexion</span>
                          <strong className="admin-info-value">{currentAdminSession?.email ?? 'admin@yelehouse.com'}</strong>
                        </div>
                        <div className="admin-info-card">
                          <span className="admin-info-label">Methode</span>
                          <strong className="admin-info-value">Session securisee + base admin_users</strong>
                        </div>
                        <div className="admin-info-card md:col-span-2">
                          <span className="admin-info-label">Acces</span>
                          <p className="mt-2 text-[15px] leading-7 text-[#6f657a]">
                            Modifiez ici le mot de passe du compte administrateur sans exposer l espace prive a la vitrine.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="panel-card p-7">
                      <div className="mb-6 flex items-center gap-3">
                        <ShieldCheck size={18} className="text-[#f04cb3]" />
                        <h2 className="text-[22px] font-semibold text-[#241f2b]">Changer le mot de passe</h2>
                      </div>

                      <form onSubmit={handleAdminPasswordChange} className="grid gap-5">
                        <div>
                          <label className="form-label">MOT DE PASSE ACTUEL</label>
                          <div className="relative">
                            <input
                              type={showSettingsPasswords.current ? 'text' : 'password'}
                              value={settingsPasswordForm.currentPassword}
                              onChange={(event) => {
                                setSettingsPasswordError('')
                                setSettingsPasswordSuccess('')
                                setSettingsPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))
                              }}
                              placeholder="Entrez le mot de passe actuel"
                              className="field-input pr-14"
                            />
                            <button
                              type="button"
                              className="password-toggle"
                              aria-label={showSettingsPasswords.current ? 'Masquer le mot de passe actuel' : 'Afficher le mot de passe actuel'}
                              aria-pressed={showSettingsPasswords.current}
                              onClick={() =>
                                setShowSettingsPasswords((current) => ({ ...current, current: !current.current }))
                              }
                            >
                              {showSettingsPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="form-label">NOUVEAU MOT DE PASSE</label>
                          <div className="relative">
                            <input
                              type={showSettingsPasswords.next ? 'text' : 'password'}
                              value={settingsPasswordForm.nextPassword}
                              onChange={(event) => {
                                setSettingsPasswordError('')
                                setSettingsPasswordSuccess('')
                                setSettingsPasswordForm((current) => ({ ...current, nextPassword: event.target.value }))
                              }}
                              placeholder="Au moins 8 caracteres"
                              className="field-input pr-14"
                            />
                            <button
                              type="button"
                              className="password-toggle"
                              aria-label={showSettingsPasswords.next ? 'Masquer le nouveau mot de passe' : 'Afficher le nouveau mot de passe'}
                              aria-pressed={showSettingsPasswords.next}
                              onClick={() => setShowSettingsPasswords((current) => ({ ...current, next: !current.next }))}
                            >
                              {showSettingsPasswords.next ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="form-label">CONFIRMER LE NOUVEAU MOT DE PASSE</label>
                          <div className="relative">
                            <input
                              type={showSettingsPasswords.confirm ? 'text' : 'password'}
                              value={settingsPasswordForm.confirmPassword}
                              onChange={(event) => {
                                setSettingsPasswordError('')
                                setSettingsPasswordSuccess('')
                                setSettingsPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))
                              }}
                              placeholder="Retapez le nouveau mot de passe"
                              className="field-input pr-14"
                            />
                            <button
                              type="button"
                              className="password-toggle"
                              aria-label={showSettingsPasswords.confirm ? 'Masquer la confirmation du mot de passe' : 'Afficher la confirmation du mot de passe'}
                              aria-pressed={showSettingsPasswords.confirm}
                              onClick={() =>
                                setShowSettingsPasswords((current) => ({ ...current, confirm: !current.confirm }))
                              }
                            >
                              {showSettingsPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        </div>

                        {settingsPasswordError ? (
                          <p className="rounded-[18px] border border-[#f1bfd8] bg-[#fff1f7] px-4 py-3 text-sm text-[#b43182]">
                            {settingsPasswordError}
                          </p>
                        ) : null}

                        {settingsPasswordSuccess ? (
                          <p className="rounded-[18px] border border-[#cde6d6] bg-[#f4fff7] px-4 py-3 text-sm text-[#16825d]">
                            {settingsPasswordSuccess}
                          </p>
                        ) : null}

                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="text-sm leading-6 text-[#7a6f86]">
                            Le mot de passe est mis a jour dans la table <span className="font-semibold text-[#241f2b]">admin_users</span>.
                          </p>
                          <button type="submit" className="primary-button px-6">
                            Enregistrer
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>

                  <div className="panel-card p-7">
                    <div className="mb-6 flex items-center gap-3">
                      <MapPin size={18} className="text-[#f04cb3]" />
                      <h2 className="text-[22px] font-semibold text-[#241f2b]">Tarifs de livraison</h2>
                    </div>

                    <form onSubmit={handleShippingSettingsSubmit} className="grid gap-5">
                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {Object.entries(shippingForm).map(([commune, amount]) => (
                          <div key={commune}>
                            <label className="form-label">{commune}</label>
                            <div className="relative">
                              <input
                                type="number"
                                min={0}
                                step={500}
                                value={amount}
                                onChange={(event) =>
                                  setShippingForm((current) => ({
                                    ...current,
                                    [commune]: Math.max(0, Number(event.target.value) || 0)
                                  }))
                                }
                                className="field-input pr-20"
                              />
                              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#8a7f95]">
                                FCFA
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {shippingSettingsMessage ? (
                        <p
                          className={`rounded-[18px] px-4 py-3 text-sm ${
                            shippingSettingsMessage.includes('Impossible')
                              ? 'border border-[#f1bfd8] bg-[#fff1f7] text-[#b43182]'
                              : 'border border-[#cde6d6] bg-[#f4fff7] text-[#16825d]'
                          }`}
                        >
                          {shippingSettingsMessage}
                        </p>
                      ) : null}

                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm leading-6 text-[#7a6f86]">
                          Ces montants sont utilises directement dans le panier client et dans le total de commande.
                        </p>
                        <button type="submit" className="primary-button px-6">
                          Mettre a jour les livraisons
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              ) : null}
            </section>
          </div>
        </main>
      </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition pageKey={path}>
    <div className="min-h-screen bg-[#f8f4ef] text-[#241f2b]">
      <ToastNotification open={!!toast.title} title={toast.title} message={toast.message} />
      <div className="promo-bar">
        <span>LIVRAISON EXPRESS A ABIDJAN EN 24H ET EXPEDITION DANS TOUTE LA COTE D&apos;IVOIRE</span>
      </div>

      <header className="sticky top-0 z-40 border-b border-[#e4d9e8] bg-[rgba(248,244,239,0.94)] backdrop-blur-xl">
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
              className="border-t border-[#e4d9e8] bg-[#f8f4ef] px-5 py-4 lg:hidden"
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
                  <img src={product.image} alt={product.name} className="feature-card-image" />
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
                size: product.sizes[0] ?? ''
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

      <footer className="border-t border-[#e4d9e8] bg-[#f6f1eb]">
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
              <motion.img
                src={previewProduct.image}
                alt={previewProduct.name}
                className="premium-preview-image"
                whileHover={{ scale: 1.08 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              />
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
                        <img src={product.image} alt={product.name} className="look-complete-image" />
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
                    <img src={item.image} alt={item.name} className="cart-line-image" />
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
                    {item} ({shippingByCommune[item].toLocaleString('fr-FR')} FCFA)
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
