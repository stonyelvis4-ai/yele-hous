import { motion, useInView } from 'motion/react'
import { useRef, useState } from 'react'
import { AnimatedBadge } from './AnimatedBadge'
import { productCardGlowVariants, productCardImageVariants, productCardVariants, subtleHoverTransition } from '../../lib/motion'
import { productFallbackImage } from '../../lib/imageFallbacks'

interface ProductCardMotionProps {
  badge: string
  category: string
  score: number
  title: string
  copy: string
  price: string
  compareAtPrice?: string
  image: string
  video?: string
  colors: string[]
  sizes: string[]
  selectedColor: string
  selectedSize: string
  swatchColor: (name: string) => string
  isOutOfStock: boolean
  onColorSelect: (color: string) => void
  onSizeChange: (size: string) => void
  onPreview: () => void
  onAdd: () => void
}

export function ProductCardMotion({
  badge,
  category,
  score,
  title,
  copy,
  price,
  compareAtPrice,
  image,
  video,
  colors,
  sizes,
  selectedColor,
  selectedSize,
  swatchColor,
  isOutOfStock,
  onColorSelect,
  onSizeChange,
  onPreview,
  onAdd
}: ProductCardMotionProps) {
  const mediaRef = useRef<HTMLButtonElement | null>(null)
  const isMediaVisible = useInView(mediaRef, { once: false, amount: 0.25 })
  const [imageSrc, setImageSrc] = useState(image || productFallbackImage(category))

  return (
    <motion.article
      className="product-card relative isolate overflow-hidden"
      initial="rest"
      whileHover="hover"
      whileTap="rest"
      viewport={{ once: true, amount: 0.2 }}
      variants={productCardVariants}
      transition={subtleHoverTransition}
    >
      <motion.div
        className="pointer-events-none absolute inset-0 -z-[1] rounded-[26px] bg-[radial-gradient(circle_at_top,_rgba(236,72,153,0.35),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(124,58,237,0.35),_transparent_42%)]"
        variants={productCardGlowVariants}
        transition={subtleHoverTransition}
      />

      <button ref={mediaRef} type="button" onClick={onPreview} className="relative block w-full overflow-hidden text-left">
        {video ? (
          <motion.video
            src={isMediaVisible ? video : undefined}
            poster={imageSrc}
            className="product-image"
            autoPlay={isMediaVisible}
            muted
            loop
            playsInline
            preload={isMediaVisible ? 'metadata' : 'none'}
            variants={productCardImageVariants}
            transition={subtleHoverTransition}
          />
        ) : (
          <motion.img
            src={imageSrc}
            alt={title}
            className="product-image"
            loading="lazy"
            decoding="async"
            onError={() => setImageSrc(productFallbackImage(category))}
            variants={productCardImageVariants}
            transition={subtleHoverTransition}
          />
        )}
        <div className="absolute left-4 top-4">
          <AnimatedBadge>{isOutOfStock ? 'Rupture de stock' : badge}</AnimatedBadge>
        </div>
      </button>

      <div className="product-body">
        <div className="flex items-start justify-between gap-4">
          <p className="product-category">{category}</p>
          <div className="flex items-center gap-1 text-[13px] font-semibold text-[#332b3c]">
            <span className="text-[#ffbf2f]">★</span>
            {score}
          </div>
        </div>

        <button type="button" onClick={onPreview} className="text-left">
          <h3 className="product-title">{title}</h3>
        </button>

        <div className="mb-4 flex gap-2">
          {colors.slice(0, 3).map((item) => (
            <button
              key={item}
              type="button"
              aria-label={item}
              onClick={() => onColorSelect(item)}
              className={`h-10 w-10 rounded-full border transition ${
                selectedColor === item ? 'border-[#8a738f] shadow-[0_0_0_4px_rgba(236,72,153,0.12)]' : 'border-[#d8cade]'
              }`}
              style={{ backgroundColor: swatchColor(item) }}
            />
          ))}
        </div>

        <p className="product-copy">{copy}</p>
        <div className="product-divider" />

        <div className="mb-5">
          {compareAtPrice ? <p className="text-[14px] text-[#8b7e98] line-through">{compareAtPrice}</p> : null}
          <p className="price-now">{price}</p>
        </div>

        <div className="flex gap-2">
          <motion.button
            type="button"
            onClick={onPreview}
            className="secondary-button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            Voir
          </motion.button>
          <select
            value={selectedSize}
            onChange={(event) => onSizeChange(event.target.value)}
            className="mini-select"
            disabled={isOutOfStock}
          >
            {sizes.map((item) => (
              <option key={item} value={item} className="bg-white text-[#241f2b]">
                {item}
              </option>
            ))}
          </select>

          <motion.button
            type="button"
            onClick={onAdd}
            className="primary-button flex-1 disabled:cursor-not-allowed disabled:opacity-50"
            whileHover={isOutOfStock ? undefined : { scale: 1.03 }}
            whileTap={isOutOfStock ? undefined : { scale: 0.97 }}
            disabled={isOutOfStock}
          >
            {isOutOfStock ? 'Indisponible' : 'Ajouter'}
          </motion.button>
        </div>
      </div>
    </motion.article>
  )
}
