import cors from 'cors'
import crypto from 'crypto'
import express from 'express'
import pg from 'pg'
import { URL } from 'url'

const { Pool } = pg

const DATABASE_URL = process.env.DATABASE_URL
const isProductionRuntime = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1'
const configuredAdminTokenSecret = process.env.ADMIN_TOKEN_SECRET?.trim()
const ADMIN_TOKEN_SECRET =
  configuredAdminTokenSecret || (isProductionRuntime ? '' : crypto.randomBytes(32).toString('hex'))
const explicitAllowedOrigins = (process.env.CORS_ALLOWED_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)
const appOrigins = new Set(
  [
    'https://yele-house.vercel.app',
    process.env.APP_ORIGIN?.trim(),
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
    ...explicitAllowedOrigins
  ].filter(Boolean)
)
const rateLimitStore = new Map()

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is required to start the API server.')
}

if (!ADMIN_TOKEN_SECRET) {
  throw new Error('ADMIN_TOKEN_SECRET is required in production.')
}

const pool = new Pool({ connectionString: DATABASE_URL })
const app = express()
const allowedCategories = new Set(['Vetements', 'Sacs', 'Parfums', 'Accessoires'])
const allowedOrderStatuses = new Set(['En attente', 'Livree', 'Annulee'])
const idPattern = /^[A-Za-z0-9-]+$/
const mediaUrlPattern = /^https?:\/\//i
const imageDataUrlPattern = /^data:image\/[a-zA-Z0-9.+-]+;base64,/i
const videoDataUrlPattern = /^data:video\/[a-zA-Z0-9.+-]+;base64,/i
const MAX_URL_LENGTH = 2048
const MAX_IMAGE_DATA_URL_LENGTH = 2_500_000
const MAX_VIDEO_DATA_URL_LENGTH = 12_500_000
const MAX_NAME_LENGTH = 160
const MAX_SLUG_LENGTH = 180
const MAX_DESCRIPTION_LENGTH = 3000
const MAX_MATERIAL_LENGTH = 500
const MAX_TOPIC_LENGTH = 180
const MAX_MESSAGE_LENGTH = 4000
const MAX_PHONE_LENGTH = 40
const MAX_COLOR_OR_SIZE_LENGTH = 80
const MAX_MEDIA_LIST_LENGTH = 12
const defaultShippingRates = {
  Cocody: 5000,
  Plateau: 4500,
  Marcory: 3500,
  DeuxPlateaux: 4000,
  Zone4: 3000,
  Yopougon: 6000
}
const defaultCollections = [
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
    video: '',
    isFeatured: false
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

function defaultProductName(category) {
  if (category === 'Vetements') return 'Nouvel article couture'
  if (category === 'Sacs') return 'Nouveau sac signature'
  if (category === 'Parfums') return 'Nouveau parfum signature'
  return 'Nouvel accessoire signature'
}

function productFallbackByCategory(category) {
  if (category === 'Sacs') {
    return 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1200&q=80'
  }
  if (category === 'Parfums') {
    return 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=1200&q=80'
  }
  if (category === 'Accessoires') {
    return 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=1200&q=80'
  }
  return 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=80'
}

function defaultCollectionName() {
  return 'Nouvelle collection signature'
}

function defaultCollectionDescription() {
  return 'Nouvelle tendance de la Maison, prete a etre enrichie depuis le back-office.'
}

function normalizeSlugValue(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

function resolveCorsOrigin(origin) {
  if (!origin) return true

  try {
    const parsedOrigin = new URL(origin)
    if (parsedOrigin.hostname === 'localhost' || parsedOrigin.hostname === '127.0.0.1') {
      return true
    }

    return appOrigins.has(`${parsedOrigin.protocol}//${parsedOrigin.host}`)
  } catch {
    return false
  }
}

app.use(
  cors({
    origin(origin, callback) {
      const allowed = resolveCorsOrigin(origin)
      callback(allowed ? null : new Error('Origin not allowed by CORS'), allowed)
    },
    credentials: true
  })
)
app.use(express.json({ limit: '20mb' }))

function getClientAddress(req) {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim()
  }

  if (Array.isArray(forwarded) && forwarded.length) {
    return forwarded[0]
  }

  return req.socket.remoteAddress ?? 'unknown'
}

function createRateLimiter({ keyPrefix, limit, windowMs }) {
  return (req, res, next) => {
    const now = Date.now()
    const clientAddress = getClientAddress(req)
    const key = `${keyPrefix}:${clientAddress}`
    const current = rateLimitStore.get(key)

    if (!current || current.resetAt <= now) {
      rateLimitStore.set(key, { count: 1, resetAt: now + windowMs })
      return next()
    }

    if (current.count >= limit) {
      res.setHeader('Retry-After', Math.ceil((current.resetAt - now) / 1000))
      return res.status(429).json({ error: 'Too many requests. Please retry later.' })
    }

    current.count += 1
    rateLimitStore.set(key, current)
    next()
  }
}

const adminLoginRateLimiter = createRateLimiter({
  keyPrefix: 'admin-login',
  limit: 5,
  windowMs: 10 * 60 * 1000
})

const publicWriteRateLimiter = createRateLimiter({
  keyPrefix: 'public-write',
  limit: 20,
  windowMs: 10 * 60 * 1000
})

function createAdminToken(admin) {
  const payload = {
    id: admin.id,
    email: admin.email,
    fullName: admin.full_name,
    exp: Date.now() + 1000 * 60 * 60 * 12
  }

  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = crypto.createHmac('sha256', ADMIN_TOKEN_SECRET).update(encodedPayload).digest('base64url')
  return `${encodedPayload}.${signature}`
}

function readAdminToken(token) {
  if (!token || !token.includes('.')) return null

  const [encodedPayload, signature] = token.split('.')
  const expected = crypto.createHmac('sha256', ADMIN_TOKEN_SECRET).update(encodedPayload).digest('base64url')
  if (signature !== expected) return null

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'))
    if (!payload.exp || payload.exp < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

function getBearerToken(req) {
  const authorization = req.headers.authorization
  if (!authorization?.startsWith('Bearer ')) return null
  return authorization.slice('Bearer '.length)
}

function getCookieToken(req) {
  const cookieHeader = req.headers.cookie
  if (!cookieHeader) return null

  const cookies = cookieHeader.split(';').map((item) => item.trim())
  const match = cookies.find((item) => item.startsWith('yele_admin_session='))
  if (!match) return null
  return decodeURIComponent(match.slice('yele_admin_session='.length))
}

function setAdminSessionCookie(res, token) {
  const secureFlag = isProductionRuntime ? '; Secure' : ''
  res.setHeader(
    'Set-Cookie',
    `yele_admin_session=${encodeURIComponent(token)}; HttpOnly; Path=/; Max-Age=43200; SameSite=Lax${secureFlag}`
  )
}

function clearAdminSessionCookie(res) {
  const secureFlag = isProductionRuntime ? '; Secure' : ''
  res.setHeader('Set-Cookie', `yele_admin_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax${secureFlag}`)
}

function requireAdminApiAuth(req, res, next) {
  const token = getCookieToken(req) ?? getBearerToken(req)
  const session = readAdminToken(token)

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  req.admin = session
  next()
}

function mapProduct(row) {
  const images = Array.isArray(row.images) ? row.images.filter(Boolean) : []
  const primaryImage = row.image || images[0] || ''
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    collectionId: row.collection_id ?? undefined,
    price: Number(row.price),
    compareAtPrice: row.compare_at_price == null ? undefined : Number(row.compare_at_price),
    description: row.description,
    material: row.material,
    colors: row.colors ?? [],
    sizes: row.sizes ?? [],
    stock: row.stock,
    isBestSeller: row.is_best_seller,
    image: primaryImage,
    images: images.length ? images : primaryImage ? [primaryImage] : [],
    video: row.video ?? undefined,
    deletedAt: row.deleted_at ?? undefined
  }
}

function mapCollection(row) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    image: row.image,
    video: row.video ?? undefined,
    isFeatured: row.is_featured,
    deletedAt: row.deleted_at ?? undefined
  }
}

function mapReview(row) {
  return {
    id: row.id,
    author: row.author,
    rating: row.rating,
    title: row.title,
    body: row.body,
    createdAt: row.created_at,
    deletedAt: row.deleted_at ?? undefined
  }
}

function mapMessage(row) {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    topic: row.topic,
    message: row.message,
    isRead: row.is_read,
    createdAt: row.created_at
  }
}

function createHttpError(message, statusCode = 400) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

function assert(condition, message, statusCode = 400) {
  if (!condition) {
    throw createHttpError(message, statusCode)
  }
}

function normalizeText(value, { field, required = false, maxLength = 255 } = {}) {
  const normalized = String(value ?? '').trim()
  if (required) {
    assert(normalized.length > 0, `${field} is required.`)
  }
  assert(normalized.length <= maxLength, `${field} is too long.`)
  return normalized
}

function normalizeIdentifier(value, field) {
  const normalized = normalizeText(value, { field, required: true, maxLength: 120 })
  assert(idPattern.test(normalized), `${field} contains invalid characters.`)
  return normalized
}

function normalizeMediaField(value, { field, allowEmpty = true, video = false } = {}) {
  const normalized = String(value ?? '').trim()

  if (!normalized) {
    assert(allowEmpty, `${field} is required.`)
    return ''
  }

  const maxLength = video ? MAX_VIDEO_DATA_URL_LENGTH : MAX_IMAGE_DATA_URL_LENGTH
  const validDataUrl = video ? videoDataUrlPattern.test(normalized) : imageDataUrlPattern.test(normalized)
  const validRemoteUrl = mediaUrlPattern.test(normalized) && normalized.length <= MAX_URL_LENGTH

  assert(validDataUrl || validRemoteUrl, `${field} must be a valid media URL.`)
  assert(normalized.length <= maxLength, `${field} is too large.`)

  return normalized
}

function normalizeArrayOfLabels(value, field) {
  assert(Array.isArray(value), `${field} must be a list.`)
  const normalized = value
    .map((item) => normalizeText(item, { field, required: true, maxLength: MAX_COLOR_OR_SIZE_LENGTH }))
    .filter(Boolean)

  assert(normalized.length > 0, `${field} must contain at least one item.`)
  assert(normalized.length <= MAX_MEDIA_LIST_LENGTH, `${field} contains too many items.`)
  return normalized
}

function validatePrice(value, field, { allowNull = false } = {}) {
  if (allowNull && (value === null || value === undefined || value === '')) {
    return null
  }

  const normalized = Number(value)
  assert(Number.isFinite(normalized) && normalized >= 0, `${field} is invalid.`)
  return normalized
}

function validateStock(value) {
  const normalized = Number(value)
  assert(Number.isInteger(normalized) && normalized >= 0, 'Stock is invalid.')
  return normalized
}

function validateCommune(value) {
  const normalized = normalizeText(value, { field: 'Commune', required: true, maxLength: 80 })
  assert(Object.prototype.hasOwnProperty.call(defaultShippingRates, normalized), 'Commune is invalid.')
  return normalized
}

async function listProducts({ onlyDeleted = false, includeDeleted = false } = {}) {
  const conditions = []
  if (onlyDeleted) conditions.push('deleted_at is not null')
  else if (!includeDeleted) conditions.push('deleted_at is null')

  const whereClause = conditions.length ? `where ${conditions.join(' and ')}` : ''
  const { rows } = await pool.query(`select * from products ${whereClause} order by coalesce(deleted_at, created_at) desc, id desc`)
  return rows.map(mapProduct)
}

async function listCollections({ onlyDeleted = false, includeDeleted = false } = {}) {
  const conditions = []
  if (onlyDeleted) conditions.push('deleted_at is not null')
  else if (!includeDeleted) conditions.push('deleted_at is null')

  const whereClause = conditions.length ? `where ${conditions.join(' and ')}` : ''
  const { rows } = await pool.query(
    `select * from collections ${whereClause} order by is_featured desc, coalesce(deleted_at, created_at) desc, id desc`
  )
  return rows.map(mapCollection)
}

async function listReviews({ onlyDeleted = false, includeDeleted = false } = {}) {
  const conditions = []
  if (onlyDeleted) conditions.push('deleted_at is not null')
  else if (!includeDeleted) conditions.push('deleted_at is null')

  const whereClause = conditions.length ? `where ${conditions.join(' and ')}` : ''
  const { rows } = await pool.query(`select * from reviews ${whereClause} order by coalesce(deleted_at, created_at) desc, id desc`)
  return rows.map(mapReview)
}

async function listMessages() {
  const { rows } = await pool.query('select * from messages order by created_at desc, id desc')
  return rows.map(mapMessage)
}

async function listShippingRates() {
  const { rows } = await pool.query('select commune, amount from shipping_rates order by commune asc')
  return rows.reduce((accumulator, row) => {
    accumulator[row.commune] = Number(row.amount)
    return accumulator
  }, {})
}

async function buildOrderPricing(items, commune, client) {
  if (!Array.isArray(items) || !items.length) {
    const error = new Error('Order must contain at least one item.')
    error.statusCode = 400
    throw error
  }

  const shippingRates = await listShippingRates()
  const shipping = shippingRates[commune]

  if (shipping == null) {
    const error = new Error('Unknown shipping commune.')
    error.statusCode = 400
    throw error
  }

  let subtotal = 0
  const normalizedItems = []

  for (const item of items ?? []) {
    const productId = String(item.productId ?? '').trim()
    const quantity = Number(item.quantity ?? 0)

    if (!productId || !Number.isInteger(quantity) || quantity <= 0) {
      const error = new Error('Invalid order item.')
      error.statusCode = 400
      throw error
    }

    const { rows } = await client.query(
      'select id, name, price, stock, image from products where id = $1 and deleted_at is null limit 1',
      [productId]
    )
    const product = rows[0]

    if (!product) {
      const error = new Error('Product not found.')
      error.statusCode = 400
      throw error
    }

    if (Number(product.stock) < quantity) {
      const error = new Error(`Insufficient stock for ${product.name}.`)
      error.statusCode = 400
      throw error
    }

    const unitPrice = Number(product.price)
    subtotal += unitPrice * quantity
    normalizedItems.push({
      productId,
      name: product.name,
      price: unitPrice,
      color: String(item.color ?? '').trim() || 'Unique',
      size: String(item.size ?? '').trim() || 'Unique',
      quantity,
      image: String(item.image ?? '').trim() || product.image
    })
  }

  return {
    items: normalizedItems,
    subtotal,
    shipping,
    total: subtotal + shipping
  }
}

async function listOrders() {
  const { rows } = await pool.query(`
    select
      o.*,
      coalesce(
        json_agg(
          json_build_object(
            'productId', oi.product_id,
            'name', oi.name,
            'price', oi.price,
            'color', oi.color,
            'size', oi.size,
            'quantity', oi.quantity,
            'image', oi.image
          )
          order by oi.id
        ) filter (where oi.id is not null),
        '[]'::json
      ) as items
    from orders o
    left join order_items oi on oi.order_id = o.id
    group by o.id
    order by o.created_at desc, o.id desc
  `)

  return rows.map((row) => ({
    id: row.id,
    customerName: row.customer_name,
    phone: row.phone,
    commune: row.commune,
    notes: row.notes,
    items: row.items.map((item) => ({
      productId: item.productId,
      name: item.name,
      price: Number(item.price),
      color: item.color,
      size: item.size,
      quantity: item.quantity,
      image: item.image
    })),
    subtotal: Number(row.subtotal),
    shipping: Number(row.shipping),
    total: Number(row.total),
    status: row.status,
    createdAt: row.created_at
  }))
}

function normalizeProductBody(body) {
  const rawCategory = normalizeText(body.category ?? 'Vetements', { field: 'Category', required: true, maxLength: 32 })
  assert(allowedCategories.has(rawCategory), 'Category is invalid.')
  const image = normalizeMediaField(body.image, { field: 'Image', allowEmpty: true }) || productFallbackByCategory(rawCategory)
  const rawImages = Array.isArray(body.images) ? body.images : []
  const normalizedImages = [image, ...rawImages.map((item) => normalizeMediaField(item, { field: 'Images[]', allowEmpty: false }))]
    .filter(Boolean)
    .filter((item, index, list) => list.indexOf(item) === index)

  return {
    id: normalizeIdentifier(body.id, 'Product id'),
    name: normalizeText(body.name ?? defaultProductName(rawCategory), { field: 'Product name', required: true, maxLength: MAX_NAME_LENGTH }),
    category: rawCategory,
    collectionId: body.collectionId ? normalizeIdentifier(body.collectionId, 'Collection id') : null,
    price: validatePrice(body.price, 'Price'),
    compareAtPrice: validatePrice(body.compareAtPrice, 'Compare at price', { allowNull: true }),
    description: normalizeText(body.description ?? 'Piece signature de la Maison, prete a etre enrichie depuis le back-office.', {
      field: 'Description',
      required: true,
      maxLength: MAX_DESCRIPTION_LENGTH
    }),
    material: normalizeText(body.material ?? 'Finition signature Yele House', {
      field: 'Material',
      required: true,
      maxLength: MAX_MATERIAL_LENGTH
    }),
    colors: normalizeArrayOfLabels(Array.isArray(body.colors) && body.colors.length ? body.colors : ['Unique'], 'Colors'),
    sizes: normalizeArrayOfLabels(Array.isArray(body.sizes) && body.sizes.length ? body.sizes : ['Unique'], 'Sizes'),
    stock: validateStock(body.stock),
    isBestSeller: Boolean(body.isBestSeller),
    image,
    images: normalizedImages,
    video: normalizeMediaField(body.video, { field: 'Video', allowEmpty: true, video: true }) || null
  }
}

function normalizeCollectionBody(body) {
  const name = normalizeText(body.name ?? defaultCollectionName(), { field: 'Collection name', required: true, maxLength: MAX_NAME_LENGTH })
  const slugSource = normalizeSlugValue(body.slug) || normalizeSlugValue(name) || `collection-${Date.now()}`
  const slug = normalizeText(slugSource, { field: 'Collection slug', required: true, maxLength: MAX_SLUG_LENGTH })
  assert(idPattern.test(slug), 'Collection slug contains invalid characters.')

  return {
    id: normalizeIdentifier(body.id, 'Collection id'),
    name,
    slug,
    description: normalizeText(body.description ?? defaultCollectionDescription(), {
      field: 'Collection description',
      required: true,
      maxLength: MAX_DESCRIPTION_LENGTH
    }),
    image: normalizeMediaField(body.image, { field: 'Collection image', allowEmpty: true }) || defaultCollections[0].image,
    video: normalizeMediaField(body.video, { field: 'Collection video', allowEmpty: true, video: true }) || null,
    isFeatured: Boolean(body.isFeatured)
  }
}

function normalizeReviewBody(body) {
  return {
    id: normalizeIdentifier(body.id, 'Review id'),
    author: normalizeText(body.author, { field: 'Author', required: true, maxLength: MAX_NAME_LENGTH }),
    rating: (() => {
      const normalized = Number(body.rating)
      assert(Number.isInteger(normalized) && normalized >= 1 && normalized <= 5, 'Rating is invalid.')
      return normalized
    })(),
    title: normalizeText(body.title, { field: 'Review title', required: true, maxLength: 180 }),
    body: normalizeText(body.body, { field: 'Review body', required: true, maxLength: MAX_MESSAGE_LENGTH }),
    createdAt: String(body.createdAt ?? new Date().toISOString()).trim()
  }
}

function normalizeMessageBody(body) {
  return {
    id: normalizeIdentifier(body.id, 'Message id'),
    name: normalizeText(body.name, { field: 'Name', required: true, maxLength: MAX_NAME_LENGTH }),
    phone: normalizeText(body.phone, { field: 'Phone', required: true, maxLength: MAX_PHONE_LENGTH }),
    topic: normalizeText(body.topic, { field: 'Topic', required: true, maxLength: MAX_TOPIC_LENGTH }),
    message: normalizeText(body.message, { field: 'Message', required: true, maxLength: MAX_MESSAGE_LENGTH }),
    isRead: Boolean(body.isRead),
    createdAt: String(body.createdAt ?? new Date().toISOString()).trim()
  }
}

function normalizeOrderBody(body) {
  const items = Array.isArray(body.items) ? body.items : []
  assert(items.length > 0, 'Order must contain at least one item.')

  return {
    id: normalizeIdentifier(body.id, 'Order id'),
    customerName: normalizeText(body.customerName, { field: 'Customer name', required: true, maxLength: MAX_NAME_LENGTH }),
    phone: normalizeText(body.phone, { field: 'Phone', required: true, maxLength: MAX_PHONE_LENGTH }),
    commune: validateCommune(body.commune),
    notes: normalizeText(body.notes ?? '', { field: 'Notes', required: false, maxLength: 500 }),
    items: items.map((item, index) => ({
      productId: normalizeIdentifier(item?.productId, `Order item ${index + 1} product id`),
      color: normalizeText(item?.color ?? 'Unique', { field: `Order item ${index + 1} color`, required: true, maxLength: MAX_COLOR_OR_SIZE_LENGTH }),
      size: normalizeText(item?.size ?? 'Unique', { field: `Order item ${index + 1} size`, required: true, maxLength: MAX_COLOR_OR_SIZE_LENGTH }),
      quantity: (() => {
        const normalized = Number(item?.quantity)
        assert(Number.isInteger(normalized) && normalized > 0 && normalized <= 20, `Order item ${index + 1} quantity is invalid.`)
        return normalized
      })(),
      image: normalizeMediaField(item?.image ?? '', { field: `Order item ${index + 1} image`, allowEmpty: true })
    })),
    status: allowedOrderStatuses.has(String(body.status ?? '').trim()) ? String(body.status).trim() : 'En attente',
    createdAt: String(body.createdAt ?? new Date().toISOString()).trim()
  }
}

app.get('/api/health', async (_req, res) => {
  const { rows } = await pool.query('select now() as now')
  res.json({ ok: true, now: rows[0].now })
})

app.get('/api/public/bootstrap', async (_req, res) => {
  const [collections, products, reviews, shippingRates] = await Promise.all([
    listCollections(),
    listProducts(),
    listReviews(),
    listShippingRates()
  ])

  res.setHeader('Cache-Control', 'public, max-age=30, s-maxage=60, stale-while-revalidate=300')
  res.json({ collections, products, reviews, shippingRates })
})

app.get('/api/admin/bootstrap', requireAdminApiAuth, async (_req, res) => {
  const [collections, products, orders, reviews, messages, shippingRates, deletedCollections, deletedProducts, deletedReviews] = await Promise.all([
    listCollections(),
    listProducts(),
    listOrders(),
    listReviews(),
    listMessages(),
    listShippingRates(),
    listCollections({ onlyDeleted: true }),
    listProducts({ onlyDeleted: true }),
    listReviews({ onlyDeleted: true })
  ])

  res.json({
    collections,
    products,
    orders,
    reviews,
    messages,
    shippingRates,
    trash: {
      collections: deletedCollections,
      products: deletedProducts,
      reviews: deletedReviews
    }
  })
})

app.post('/api/admin/login', adminLoginRateLimiter, async (req, res) => {
  const email = String(req.body.email ?? '').trim().toLowerCase()
  const password = String(req.body.password ?? '').trim()

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' })
  }

  const { rows } = await pool.query(
    `
      select id, email, full_name
      from admin_users
      where email = $1
        and is_active = true
        and password_hash = crypt($2, password_hash)
      limit 1
    `,
    [email, password]
  )

  if (!rows.length) {
    return res.status(401).json({ error: 'Invalid credentials.' })
  }

  const token = createAdminToken(rows[0])
  setAdminSessionCookie(res, token)

  return res.json({
    id: rows[0].id,
    email: rows[0].email,
    fullName: rows[0].full_name
  })
})

app.get('/api/admin/session', requireAdminApiAuth, async (req, res) => {
  return res.json({
    id: req.admin.id,
    email: req.admin.email,
    fullName: req.admin.fullName
  })
})

app.post('/api/admin/logout', (_req, res) => {
  clearAdminSessionCookie(res)
  return res.status(204).end()
})

app.post('/api/admin/change-password', requireAdminApiAuth, async (req, res) => {
  const currentPassword = String(req.body.currentPassword ?? '').trim()
  const nextPassword = String(req.body.nextPassword ?? '').trim()

  if (!currentPassword || !nextPassword) {
    return res.status(400).json({ error: 'Current and next password are required.' })
  }

  if (nextPassword.length < 8) {
    return res.status(400).json({ error: 'The new password must contain at least 8 characters.' })
  }

  const { rows } = await pool.query(
    `
      select id
      from admin_users
      where id = $1
        and is_active = true
        and password_hash = crypt($2, password_hash)
      limit 1
    `,
    [req.admin.id, currentPassword]
  )

  if (!rows.length) {
    return res.status(401).json({ error: 'Current password is invalid.' })
  }

  await pool.query(
    `
      update admin_users
      set password_hash = crypt($2, gen_salt('bf')),
          updated_at = now()
      where id = $1
    `,
    [req.admin.id, nextPassword]
  )

  return res.json({ success: true })
})

app.put('/api/settings/shipping', requireAdminApiAuth, async (req, res) => {
  const shippingRates = req.body.shippingRates

  if (!shippingRates || typeof shippingRates !== 'object') {
    return res.status(400).json({ error: 'Shipping rates payload is required.' })
  }

  const entries = Object.entries(shippingRates)
    .map(([commune, amount]) => [String(commune).trim(), Number(amount)])
    .filter(([commune]) => commune.length > 0)

  if (!entries.length || entries.some(([, amount]) => !Number.isFinite(amount) || amount < 0)) {
    return res.status(400).json({ error: 'Shipping rates are invalid.' })
  }

  const client = await pool.connect()

  try {
    await client.query('begin')
    for (const [commune, amount] of entries) {
      await client.query(
        `
          insert into shipping_rates (commune, amount)
          values ($1, $2)
          on conflict (commune)
          do update set amount = excluded.amount, updated_at = now()
        `,
        [commune, amount]
      )
    }
    await client.query('commit')
  } catch (error) {
    await client.query('rollback')
    throw error
  } finally {
    client.release()
  }

  return res.json(await listShippingRates())
})

app.post('/api/collections', requireAdminApiAuth, async (req, res) => {
  const collection = normalizeCollectionBody(req.body)
  await pool.query(
    `
      insert into collections (id, name, slug, description, image, video, is_featured)
      values ($1,$2,$3,$4,$5,$6,$7)
    `,
    [collection.id, collection.name, collection.slug, collection.description, collection.image, collection.video, collection.isFeatured]
  )
  const { rows } = await pool.query('select * from collections where id = $1', [collection.id])
  res.status(201).json(mapCollection(rows[0]))
})

app.put('/api/collections/:id', requireAdminApiAuth, async (req, res) => {
  const collection = normalizeCollectionBody({ ...req.body, id: req.params.id })
  await pool.query(
    `
      update collections
      set name = $2, slug = $3, description = $4, image = $5, video = $6, is_featured = $7, updated_at = now()
      where id = $1
    `,
    [collection.id, collection.name, collection.slug, collection.description, collection.image, collection.video, collection.isFeatured]
  )
  const { rows } = await pool.query('select * from collections where id = $1', [collection.id])
  res.json(mapCollection(rows[0]))
})

app.delete('/api/collections/:id', requireAdminApiAuth, async (req, res) => {
  const { rows } = await pool.query(
    `
      update collections
      set deleted_at = now(), updated_at = now()
      where id = $1 and deleted_at is null
      returning *
    `,
    [req.params.id]
  )
  if (!rows.length) {
    return res.status(404).json({ error: 'Collection not found.' })
  }
  res.json(mapCollection(rows[0]))
})

app.post('/api/collections/:id/restore', requireAdminApiAuth, async (req, res) => {
  const { rows } = await pool.query(
    `
      update collections
      set deleted_at = null, updated_at = now()
      where id = $1 and deleted_at is not null
      returning *
    `,
    [req.params.id]
  )
  if (!rows.length) {
    return res.status(404).json({ error: 'Collection not found.' })
  }
  res.json(mapCollection(rows[0]))
})

app.post('/api/products', requireAdminApiAuth, async (req, res) => {
  const product = normalizeProductBody(req.body)
  await pool.query(
    `
      insert into products (
        id, name, category, collection_id, price, compare_at_price, description, material, colors, sizes, stock, is_best_seller, image, images, video
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
    `,
    [
      product.id,
      product.name,
      product.category,
      product.collectionId,
      product.price,
      product.compareAtPrice,
      product.description,
      product.material,
      product.colors,
      product.sizes,
      product.stock,
      product.isBestSeller,
      product.image,
      product.images,
      product.video
    ]
  )

  const { rows } = await pool.query('select * from products where id = $1', [product.id])
  res.status(201).json(mapProduct(rows[0]))
})

app.put('/api/products/:id', requireAdminApiAuth, async (req, res) => {
  const product = normalizeProductBody({ ...req.body, id: req.params.id })
  await pool.query(
    `
      update products
      set
        name = $2,
        category = $3,
        collection_id = $4,
        price = $5,
        compare_at_price = $6,
        description = $7,
        material = $8,
        colors = $9,
        sizes = $10,
        stock = $11,
        is_best_seller = $12,
        image = $13,
        images = $14,
        video = $15,
        updated_at = now()
      where id = $1
    `,
    [
      product.id,
      product.name,
      product.category,
      product.collectionId,
      product.price,
      product.compareAtPrice,
      product.description,
      product.material,
      product.colors,
      product.sizes,
      product.stock,
      product.isBestSeller,
      product.image,
      product.images,
      product.video
    ]
  )

  const { rows } = await pool.query('select * from products where id = $1', [product.id])
  res.json(mapProduct(rows[0]))
})

app.delete('/api/products/:id', requireAdminApiAuth, async (req, res) => {
  const { rows } = await pool.query(
    `
      update products
      set deleted_at = now(), updated_at = now()
      where id = $1 and deleted_at is null
      returning *
    `,
    [req.params.id]
  )
  if (!rows.length) {
    return res.status(404).json({ error: 'Product not found.' })
  }
  res.json(mapProduct(rows[0]))
})

app.post('/api/products/:id/restore', requireAdminApiAuth, async (req, res) => {
  const { rows } = await pool.query(
    `
      update products
      set deleted_at = null, updated_at = now()
      where id = $1 and deleted_at is not null
      returning *
    `,
    [req.params.id]
  )
  if (!rows.length) {
    return res.status(404).json({ error: 'Product not found.' })
  }
  res.json(mapProduct(rows[0]))
})

app.post('/api/orders', publicWriteRateLimiter, async (req, res) => {
  const order = normalizeOrderBody(req.body)
  const client = await pool.connect()

  try {
    await client.query('begin')
    const pricing = await buildOrderPricing(order.items, String(order.commune ?? '').trim(), client)
    await client.query(
      `
        insert into orders (
          id, customer_name, phone, commune, notes, subtotal, shipping, total, status, created_at
        ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      `,
      [
        order.id,
        order.customerName,
        order.phone,
        order.commune,
        order.notes ?? '',
        pricing.subtotal,
        pricing.shipping,
        pricing.total,
        order.status,
        order.createdAt
      ]
    )

    for (const item of pricing.items) {
      await client.query(
        `
          insert into order_items (
            order_id, product_id, name, price, color, size, quantity, image
          ) values ($1,$2,$3,$4,$5,$6,$7,$8)
        `,
        [order.id, item.productId, item.name, item.price, item.color, item.size, item.quantity, item.image]
      )

      if (item.productId) {
        await client.query('update products set stock = greatest(stock - $2, 0), updated_at = now() where id = $1', [
          item.productId,
          item.quantity
        ])
      }
    }

    await client.query('commit')
    const orders = await listOrders()
    res.status(201).json(orders.find((entry) => entry.id === order.id))
  } catch (error) {
    await client.query('rollback')
    throw error
  } finally {
    client.release()
  }
})

app.patch('/api/orders/:id/status', requireAdminApiAuth, async (req, res) => {
  await pool.query('update orders set status = $2, updated_at = now() where id = $1', [
    req.params.id,
    req.body.status
  ])
  const orders = await listOrders()
  res.json(orders.find((entry) => entry.id === req.params.id))
})

app.post('/api/reviews', publicWriteRateLimiter, async (req, res) => {
  const review = normalizeReviewBody(req.body)
  await pool.query(
    'insert into reviews (id, author, rating, title, body, created_at) values ($1,$2,$3,$4,$5,$6)',
    [review.id, review.author, review.rating, review.title, review.body, review.createdAt]
  )
  const { rows } = await pool.query('select * from reviews where id = $1', [review.id])
  res.status(201).json(mapReview(rows[0]))
})

app.delete('/api/reviews/:id', requireAdminApiAuth, async (req, res) => {
  const { rows } = await pool.query(
    `
      update reviews
      set deleted_at = now()
      where id = $1 and deleted_at is null
      returning *
    `,
    [req.params.id]
  )
  if (!rows.length) {
    return res.status(404).json({ error: 'Review not found.' })
  }
  res.json(mapReview(rows[0]))
})

app.post('/api/reviews/:id/restore', requireAdminApiAuth, async (req, res) => {
  const { rows } = await pool.query(
    `
      update reviews
      set deleted_at = null
      where id = $1 and deleted_at is not null
      returning *
    `,
    [req.params.id]
  )
  if (!rows.length) {
    return res.status(404).json({ error: 'Review not found.' })
  }
  res.json(mapReview(rows[0]))
})

app.post('/api/messages', publicWriteRateLimiter, async (req, res) => {
  const message = normalizeMessageBody(req.body)
  await pool.query(
    'insert into messages (id, name, phone, topic, message, is_read, created_at) values ($1,$2,$3,$4,$5,$6,$7)',
    [message.id, message.name, message.phone, message.topic, message.message, message.isRead, message.createdAt]
  )
  const { rows } = await pool.query('select * from messages where id = $1', [message.id])
  res.status(201).json(mapMessage(rows[0]))
})

app.patch('/api/messages/:id', requireAdminApiAuth, async (req, res) => {
  await pool.query('update messages set is_read = $2 where id = $1', [req.params.id, req.body.isRead])
  const { rows } = await pool.query('select * from messages where id = $1', [req.params.id])
  res.json(mapMessage(rows[0]))
})

let runtimeSchemaPromise

export async function ensureRuntimeSchema() {
  if (!runtimeSchemaPromise) {
    runtimeSchemaPromise = (async () => {
      await pool.query(`
        create table if not exists collections (
          id text primary key,
          name text not null,
          slug text not null unique,
          description text not null,
          image text not null,
          video text,
          is_featured boolean not null default false,
          deleted_at timestamptz,
          created_at timestamptz not null default now(),
          updated_at timestamptz not null default now()
        )
      `)

      await pool.query(`
        alter table collections
        add column if not exists deleted_at timestamptz
      `)

      await pool.query(`
        alter table collections
        add column if not exists video text
      `)

      await pool.query(`
        alter table products
        add column if not exists collection_id text references collections(id) on delete set null
      `)

      await pool.query(`
        alter table products
        add column if not exists images text[] not null default '{}'
      `)

      await pool.query(`
        alter table products
        add column if not exists deleted_at timestamptz
      `)

      await pool.query(`
        alter table products
        add column if not exists video text
      `)

      await pool.query(`
        update products
        set images = case
          when coalesce(array_length(images, 1), 0) = 0 and image <> '' then array[image]
          else images
        end
      `)

      await pool.query(`
        create table if not exists shipping_rates (
          commune text primary key,
          amount numeric(12, 2) not null check (amount >= 0),
          created_at timestamptz not null default now(),
          updated_at timestamptz not null default now()
        )
      `)

      await pool.query(`
        alter table reviews
        add column if not exists deleted_at timestamptz
      `)

      for (const [commune, amount] of Object.entries(defaultShippingRates)) {
        await pool.query(
          `
            insert into shipping_rates (commune, amount)
            values ($1, $2)
            on conflict (commune) do nothing
          `,
          [commune, amount]
        )
      }

      for (const collection of defaultCollections) {
        await pool.query(
          `
            insert into collections (id, name, slug, description, image, video, is_featured)
            values ($1, $2, $3, $4, $5, $6, $7)
            on conflict (id) do nothing
          `,
          [collection.id, collection.name, collection.slug, collection.description, collection.image, collection.video, collection.isFeatured]
        )
      }
    })()
  }

  return runtimeSchemaPromise
}

app.use((error, _req, res, _next) => {
  console.error(error)
  res.status(error.statusCode ?? 500).json({ error: error.message || 'Internal server error' })
})

export { app }
