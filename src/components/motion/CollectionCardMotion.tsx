import type { Transition, Variants } from 'motion/react'
import { motion, useInView } from 'motion/react'
import { ArrowRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { premiumEase } from '../../lib/motion'
import { collectionFallbackImage } from '../../lib/imageFallbacks'

interface CollectionCardMotionProps {
  title: string
  copy: string
  image: string
  video?: string
}

const collectionCardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 28,
    scale: 0.985,
    filter: 'blur(10px)',
    boxShadow: '0 12px 30px rgba(0, 0, 0, 0.12)'
  },
  rest: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    boxShadow: '0 12px 30px rgba(0, 0, 0, 0.12)'
  },
  hover: {
    opacity: 1,
    y: -10,
    scale: 1.02,
    filter: 'blur(0px)',
    boxShadow: '0 25px 60px rgba(236,72,153,0.25)'
  }
}

const collectionImageVariants: Variants = {
  hidden: {
    scale: 1.06,
    opacity: 0.72,
    filter: 'blur(8px)'
  },
  rest: {
    scale: 1,
    opacity: 1,
    filter: 'blur(0px)'
  },
  hover: {
    scale: 1.08,
    opacity: 1,
    filter: 'blur(0px)'
  }
}

const collectionGlowVariants: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  rest: { opacity: 0.22, scale: 0.98 },
  hover: { opacity: 0.72, scale: 1.08 }
}

const collectionTransition: Transition = {
  duration: 0.5,
  ease: premiumEase
}

export function CollectionCardMotion({ title, copy, image, video }: CollectionCardMotionProps) {
  const mediaRef = useRef<HTMLDivElement | null>(null)
  const isMediaVisible = useInView(mediaRef, { once: false, amount: 0.35 })
  const [imageSrc, setImageSrc] = useState(image || collectionFallbackImage)

  useEffect(() => {
    setImageSrc(image || collectionFallbackImage)
  }, [image])

  return (
    <motion.article
      className="feature-card relative isolate overflow-hidden"
      initial="hidden"
      whileInView="rest"
      whileHover="hover"
      whileTap="rest"
      viewport={{ once: true, amount: 0.2 }}
      variants={collectionCardVariants}
      transition={collectionTransition}
    >
      <motion.div
        className="pointer-events-none absolute inset-0 -z-[1] rounded-[26px] bg-[radial-gradient(circle_at_top,_rgba(236,72,153,0.22),_transparent_36%),radial-gradient(circle_at_bottom_right,_rgba(124,58,237,0.22),_transparent_40%)]"
        variants={collectionGlowVariants}
        transition={collectionTransition}
      />

      <div ref={mediaRef} className="relative overflow-hidden">
        {video ? (
          <motion.video
            src={isMediaVisible ? video : undefined}
            poster={imageSrc}
            className="feature-card-image"
            autoPlay={isMediaVisible}
            muted
            loop
            playsInline
            preload={isMediaVisible ? 'metadata' : 'none'}
          variants={collectionImageVariants}
          transition={collectionTransition}
        />
      ) : (
        <motion.img
          src={imageSrc}
          alt={title}
          className="feature-card-image"
          decoding="async"
          onError={() => setImageSrc(collectionFallbackImage)}
          variants={collectionImageVariants}
          transition={collectionTransition}
        />
      )}
      </div>

      <div className="feature-card-body">
        <p className="feature-kicker">COLLECTION SIGNATURE</p>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="feature-title">{title}</h2>
            <p className="feature-text">{copy}</p>
          </div>
          <ArrowRight className="mt-2 shrink-0 text-[#8a7f95]" size={18} />
        </div>
      </div>
    </motion.article>
  )
}
