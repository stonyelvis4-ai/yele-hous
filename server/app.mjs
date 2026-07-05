import cors from 'cors'
import crypto from 'crypto'
import express from 'express'
import pg from 'pg'

const { Pool } = pg

const DATABASE_URL = process.env.DATABASE_URL
const ADMIN_TOKEN_SECRET = process.env.ADMIN_TOKEN_SECRET ?? 'yele-house-admin-secret'

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is required to start the API server.')
}

const pool = new Pool({ connectionString: DATABASE_URL })
const app = express()
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
    isFeatured: true
  },
  {
    id: 'col-essentiels-maison',
    name: 'Essentiels Maison',
    slug: 'essentiels-maison',
    description: 'Pieces signatures a porter, offrir et recomposer au fil des saisons.',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80',
    isFeatured: false
  },
  {
    id: 'col-parfums-ivoire',
    name: 'Parfums d Ivoire',
    slug: 'parfums-d-ivoire',
    description: 'Une selection de sillages solaires, bois precieux et nectar haute presence.',
    image: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=1200&q=80',
    isFeatured: true
  }
]

function resolveCorsOrigin(origin) {
  if (!origin) return true

  if (
    origin.startsWith('http://localhost:') ||
    origin.startsWith('http://127.0.0.1:') ||
    origin.startsWith('https://localhost:') ||
    origin.startsWith('https://127.0.0.1:')
  ) {
    return true
  }

  if (origin.includes('.vercel.app')) {
    return true
  }

  return true
}

app.use(
  cors({
    origin(origin, callback) {
      callback(null, resolveCorsOrigin(origin))
    },
    credentials: true
  })
)
app.use(express.json({ limit: '20mb' }))

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
  res.setHeader(
    'Set-Cookie',
    `yele_admin_session=${encodeURIComponent(token)}; HttpOnly; Path=/; Max-Age=43200; SameSite=Lax`
  )
}

function clearAdminSessionCookie(res) {
  res.setHeader('Set-Cookie', 'yele_admin_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax')
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
    image: row.image
  }
}

function mapCollection(row) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    image: row.image,
    isFeatured: row.is_featured
  }
}

function mapReview(row) {
  return {
    id: row.id,
    author: row.author,
    rating: row.rating,
    title: row.title,
    body: row.body,
    createdAt: row.created_at
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

async function listProducts() {
  const { rows } = await pool.query('select * from products order by created_at desc, id desc')
  return rows.map(mapProduct)
}

async function listCollections() {
  const { rows } = await pool.query('select * from collections order by is_featured desc, created_at desc, id desc')
  return rows.map(mapCollection)
}

async function listReviews() {
  const { rows } = await pool.query('select * from reviews order by created_at desc, id desc')
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

    const { rows } = await client.query('select id, name, price, stock, image from products where id = $1 limit 1', [
      productId
    ])
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
  return {
    id: String(body.id ?? '').trim(),
    name: String(body.name ?? '').trim(),
    category: String(body.category ?? 'Vetements').trim(),
    collectionId: String(body.collectionId ?? '').trim() || null,
    price: Number(body.price ?? 0),
    compareAtPrice:
      body.compareAtPrice === undefined || body.compareAtPrice === null || body.compareAtPrice === ''
        ? null
        : Number(body.compareAtPrice),
    description: String(body.description ?? '').trim(),
    material: String(body.material ?? '').trim(),
    colors: Array.isArray(body.colors) ? body.colors.map((item) => String(item).trim()).filter(Boolean) : [],
    sizes: Array.isArray(body.sizes) ? body.sizes.map((item) => String(item).trim()).filter(Boolean) : [],
    stock: Number(body.stock ?? 0),
    isBestSeller: Boolean(body.isBestSeller),
    image: String(body.image ?? '').trim()
  }
}

function normalizeCollectionBody(body) {
  return {
    id: String(body.id ?? '').trim(),
    name: String(body.name ?? '').trim(),
    slug: String(body.slug ?? '').trim(),
    description: String(body.description ?? '').trim(),
    image: String(body.image ?? '').trim(),
    isFeatured: Boolean(body.isFeatured)
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

  res.json({ collections, products, reviews, shippingRates })
})

app.get('/api/admin/bootstrap', requireAdminApiAuth, async (_req, res) => {
  const [collections, products, orders, reviews, messages, shippingRates] = await Promise.all([
    listCollections(),
    listProducts(),
    listOrders(),
    listReviews(),
    listMessages(),
    listShippingRates()
  ])

  res.json({ collections, products, orders, reviews, messages, shippingRates })
})

app.post('/api/admin/login', async (req, res) => {
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
      insert into collections (id, name, slug, description, image, is_featured)
      values ($1,$2,$3,$4,$5,$6)
    `,
    [collection.id, collection.name, collection.slug, collection.description, collection.image, collection.isFeatured]
  )
  const { rows } = await pool.query('select * from collections where id = $1', [collection.id])
  res.status(201).json(mapCollection(rows[0]))
})

app.put('/api/collections/:id', requireAdminApiAuth, async (req, res) => {
  const collection = normalizeCollectionBody({ ...req.body, id: req.params.id })
  await pool.query(
    `
      update collections
      set name = $2, slug = $3, description = $4, image = $5, is_featured = $6, updated_at = now()
      where id = $1
    `,
    [collection.id, collection.name, collection.slug, collection.description, collection.image, collection.isFeatured]
  )
  const { rows } = await pool.query('select * from collections where id = $1', [collection.id])
  res.json(mapCollection(rows[0]))
})

app.delete('/api/collections/:id', requireAdminApiAuth, async (req, res) => {
  await pool.query('update products set collection_id = null, updated_at = now() where collection_id = $1', [req.params.id])
  await pool.query('delete from collections where id = $1', [req.params.id])
  res.status(204).end()
})

app.post('/api/products', requireAdminApiAuth, async (req, res) => {
  const product = normalizeProductBody(req.body)
  await pool.query(
    `
      insert into products (
        id, name, category, collection_id, price, compare_at_price, description, material, colors, sizes, stock, is_best_seller, image
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
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
      product.image
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
      product.image
    ]
  )

  const { rows } = await pool.query('select * from products where id = $1', [product.id])
  res.json(mapProduct(rows[0]))
})

app.delete('/api/products/:id', requireAdminApiAuth, async (req, res) => {
  await pool.query('delete from products where id = $1', [req.params.id])
  res.status(204).end()
})

app.post('/api/orders', async (req, res) => {
  const order = req.body
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

app.post('/api/reviews', async (req, res) => {
  const review = req.body
  await pool.query(
    'insert into reviews (id, author, rating, title, body, created_at) values ($1,$2,$3,$4,$5,$6)',
    [review.id, review.author, review.rating, review.title, review.body, review.createdAt]
  )
  const { rows } = await pool.query('select * from reviews where id = $1', [review.id])
  res.status(201).json(mapReview(rows[0]))
})

app.delete('/api/reviews/:id', requireAdminApiAuth, async (req, res) => {
  await pool.query('delete from reviews where id = $1', [req.params.id])
  res.status(204).end()
})

app.post('/api/messages', async (req, res) => {
  const message = req.body
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
          is_featured boolean not null default false,
          created_at timestamptz not null default now(),
          updated_at timestamptz not null default now()
        )
      `)

      await pool.query(`
        alter table products
        add column if not exists collection_id text references collections(id) on delete set null
      `)

      await pool.query(`
        create table if not exists shipping_rates (
          commune text primary key,
          amount numeric(12, 2) not null check (amount >= 0),
          created_at timestamptz not null default now(),
          updated_at timestamptz not null default now()
        )
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
            insert into collections (id, name, slug, description, image, is_featured)
            values ($1, $2, $3, $4, $5, $6)
            on conflict (id) do nothing
          `,
          [collection.id, collection.name, collection.slug, collection.description, collection.image, collection.isFeatured]
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
