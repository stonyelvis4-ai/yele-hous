import type { Transition, Variants } from 'motion/react'

export const premiumEase = [0.22, 1, 0.36, 1] as const

export const pageTransitionVariants: Variants = {
  initial: {
    opacity: 0,
    y: 24,
    filter: 'blur(10px)'
  },
  animate: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)'
  },
  exit: {
    opacity: 0,
    y: -12,
    filter: 'blur(4px)'
  }
}

export const pageTransitionSpring: Transition = {
  duration: 0.55,
  ease: premiumEase
}

export const revealSectionVariants: Variants = {
  initial: { opacity: 0, y: 50, filter: 'blur(10px)' },
  whileInView: { opacity: 1, y: 0, filter: 'blur(0px)' }
}

export const revealSectionTransition: Transition = {
  duration: 0.6,
  ease: premiumEase
}

export const productCardVariants: Variants = {
  rest: {
    y: 0,
    scale: 1,
    boxShadow: '0 12px 30px rgba(0, 0, 0, 0.18)'
  },
  hover: {
    y: -10,
    scale: 1.02,
    boxShadow: '0 25px 60px rgba(236,72,153,0.25)'
  }
}

export const productCardImageVariants: Variants = {
  rest: { scale: 1 },
  hover: { scale: 1.08 }
}

export const productCardGlowVariants: Variants = {
  rest: { opacity: 0.18, scale: 0.96 },
  hover: { opacity: 0.75, scale: 1.08 }
}

export const subtleHoverTransition: Transition = {
  duration: 0.35,
  ease: premiumEase
}

export const cartDrawerVariants: Variants = {
  initial: { x: '100%' },
  animate: { x: '0%' },
  exit: { x: '100%' }
}

export const cartDrawerTransition: Transition = {
  type: 'spring',
  stiffness: 280,
  damping: 28,
  mass: 0.9
}

export const cartBackdropVariants: Variants = {
  initial: {
    opacity: 0,
    backdropFilter: 'blur(0px)'
  },
  animate: {
    opacity: 0.6,
    backdropFilter: 'blur(10px)'
  },
  exit: {
    opacity: 0,
    backdropFilter: 'blur(0px)'
  }
}

export const modalVariants: Variants = {
  initial: { scale: 0.9, opacity: 0, y: 20 },
  animate: { scale: 1, opacity: 1, y: 0 },
  exit: { scale: 0.96, opacity: 0, y: 14 }
}

export const modalTransition: Transition = {
  type: 'spring',
  stiffness: 320,
  damping: 24
}

export const toastVariants: Variants = {
  initial: { x: 100, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: 100, opacity: 0 }
}

export const toastTransition: Transition = {
  type: 'spring',
  stiffness: 260,
  damping: 24
}

export const badgeGlowVariants: Variants = {
  rest: { opacity: 0.22 },
  pulse: {
    opacity: [0.22, 0.55, 0.22]
  }
}

export const badgeGlowTransition: Transition = {
  duration: 2.2,
  ease: 'easeInOut',
  repeat: Infinity
}
