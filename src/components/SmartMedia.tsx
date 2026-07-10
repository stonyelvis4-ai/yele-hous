import { useInView } from 'motion/react'
import { useRef, useState } from 'react'

interface SmartMediaProps {
  image: string
  alt: string
  fallbackImage: string
  className: string
  video?: string
  priority?: boolean
  controls?: boolean
  muted?: boolean
  loop?: boolean
  autoPlay?: boolean
  containerClassName?: string
}

export function SmartMedia({
  image,
  alt,
  fallbackImage,
  className,
  video,
  priority = false,
  controls = false,
  muted = true,
  loop = true,
  autoPlay = true,
  containerClassName = ''
}: SmartMediaProps) {
  const mediaRef = useRef<HTMLDivElement | null>(null)
  const isInView = useInView(mediaRef, { once: false, amount: 0.2 })
  const shouldLoadVideo = Boolean(video) && (priority || isInView)
  const [imageSrc, setImageSrc] = useState(image || fallbackImage)

  return (
    <div ref={mediaRef} className={containerClassName}>
      {video ? (
        <video
          src={shouldLoadVideo ? video : undefined}
          poster={imageSrc}
          className={className}
          autoPlay={autoPlay && shouldLoadVideo}
          muted={muted}
          loop={loop}
          playsInline
          controls={controls}
          preload={shouldLoadVideo ? 'metadata' : 'none'}
        />
      ) : (
        <img
          src={imageSrc}
          alt={alt}
          className={className}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onError={() => setImageSrc(fallbackImage)}
        />
      )}
    </div>
  )
}
