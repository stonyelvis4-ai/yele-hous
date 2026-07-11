function createPlaceholder(label: string, accent: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1200">
      <rect width="1200" height="1200" fill="#f8eff5"/>
      <rect x="96" y="96" width="1008" height="1008" rx="84" fill="#fff9fc" stroke="#ead5e4" stroke-width="8"/>
      <circle cx="600" cy="430" r="110" fill="${accent}" opacity="0.14"/>
      <text x="600" y="590" text-anchor="middle" fill="#3b2f45" font-family="Georgia, serif" font-size="88">YELE House&apos;s</text>
      <text x="600" y="675" text-anchor="middle" fill="#a16f91" font-family="Arial, sans-serif" font-size="38" letter-spacing="10">${label}</text>
    </svg>
  `.trim()

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export const collectionFallbackImage = createPlaceholder('COLLECTION', '#f04cb3')

const productFallbackByCategory: Record<string, string> = {
  Vetements: createPlaceholder('VETEMENTS', '#f04cb3'),
  VETEMENTS: createPlaceholder('VETEMENTS', '#f04cb3'),
  Sacs: createPlaceholder('SACS', '#b655e9'),
  SACS: createPlaceholder('SACS', '#b655e9'),
  Parfums: createPlaceholder('PARFUMS', '#d86c9e'),
  PARFUMS: createPlaceholder('PARFUMS', '#d86c9e'),
  Accessoires: createPlaceholder('ACCESSOIRES', '#8a6cf0'),
  ACCESSOIRES: createPlaceholder('ACCESSOIRES', '#8a6cf0')
}

export function productFallbackImage(category?: string) {
  return productFallbackByCategory[category ?? ''] ?? productFallbackByCategory.Vetements
}
