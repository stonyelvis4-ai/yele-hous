import { CartItem } from '../types'

interface OrderMessageInput {
  customerName: string
  phone: string
  commune: string
  notes: string
  items: CartItem[]
  subtotal: number
  shipping: number
  total: number
}

const YELE_WHATSAPP_NUMBER = '2250714762155'

export function buildWhatsAppUrl(input: OrderMessageInput) {
  const lines = [
    "Bonjour Yele House's,",
    '',
    `Je souhaite confirmer cette commande concierge pour ${input.customerName}.`,
    `Telephone client: ${input.phone}`,
    `Commune de livraison: ${input.commune}`,
    '',
    'Articles:'
  ]

  input.items.forEach((item) => {
    lines.push(
      `- ${item.name} | ${item.size} | ${item.color} | x${item.quantity} | ${item.price.toLocaleString(
        'fr-FR'
      )} FCFA`
    )
  })

  lines.push('')
  lines.push(`Sous-total: ${input.subtotal.toLocaleString('fr-FR')} FCFA`)
  lines.push(`Livraison: ${input.shipping.toLocaleString('fr-FR')} FCFA`)
  lines.push(`Total: ${input.total.toLocaleString('fr-FR')} FCFA`)

  if (input.notes.trim()) {
    lines.push(`Notes: ${input.notes.trim()}`)
  }

  const text = encodeURIComponent(lines.join('\n'))

  return `https://wa.me/${YELE_WHATSAPP_NUMBER}?text=${text}`
}
