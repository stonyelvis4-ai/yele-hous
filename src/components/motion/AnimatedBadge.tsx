import { motion } from 'motion/react'
import { ReactNode } from 'react'
import { badgeGlowTransition, badgeGlowVariants } from '../../lib/motion'

interface AnimatedBadgeProps {
  children: ReactNode
  className?: string
}

export function AnimatedBadge({ children, className = '' }: AnimatedBadgeProps) {
  return (
    <motion.div initial="rest" animate="pulse" className={`animated-badge ${className}`.trim()}>
      <motion.span className="animated-badge-glow" variants={badgeGlowVariants} transition={badgeGlowTransition} />
      <span className="animated-badge-dot animate-pulse" />
      <span className="relative z-[1]">{children}</span>
    </motion.div>
  )
}
