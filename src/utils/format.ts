export const currency = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'XOF',
  maximumFractionDigits: 0
})

export const datetime = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'medium',
  timeStyle: 'short'
})
