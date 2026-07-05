import { motion } from 'motion/react'
import { ReactNode } from 'react'
import { revealSectionTransition, revealSectionVariants } from '../../lib/motion'

interface RevealSectionProps {
  children: ReactNode
  className?: string
  delay?: number
}

export function RevealSection({ children, className, delay = 0 }: RevealSectionProps) {
  return (
    <motion.div
      className={className}
      initial="initial"
      animate="whileInView"
      whileInView="whileInView"
      viewport={{ once: true, amount: 0.2 }}
      variants={revealSectionVariants}
      transition={{ ...revealSectionTransition, delay }}
    >
      {children}
    </motion.div>
  )
}
