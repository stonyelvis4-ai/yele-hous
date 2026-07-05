import { AnimatePresence, motion } from 'motion/react'
import { ReactNode } from 'react'
import { pageTransitionSpring, pageTransitionVariants } from '../../lib/motion'

interface PageTransitionProps {
  children: ReactNode
  pageKey: string
}

export function PageTransition({ children, pageKey }: PageTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pageKey}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageTransitionVariants}
        transition={pageTransitionSpring}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
