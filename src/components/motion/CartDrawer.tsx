import { AnimatePresence, motion } from 'motion/react'
import { ReactNode } from 'react'
import { cartBackdropVariants, cartDrawerTransition, cartDrawerVariants } from '../../lib/motion'

interface CartDrawerProps {
  open: boolean
  onClose: () => void
  children: ReactNode
}

export function CartDrawer({ open, onClose, children }: CartDrawerProps) {
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            onClick={onClose}
            initial="initial"
            animate="animate"
            exit="exit"
            variants={cartBackdropVariants}
            className="fixed inset-0 z-40 bg-black/78 backdrop-blur-md"
          />

          <motion.aside
            initial="initial"
            animate="animate"
            exit="exit"
            variants={cartDrawerVariants}
            transition={cartDrawerTransition}
            className="fixed right-0 top-0 z-50 flex h-screen w-full max-w-[452px] flex-col border-l border-[#e7c8db] bg-[#fdf1f7] p-6 shadow-[0_0_80px_rgba(138,67,108,0.18)]"
          >
            {children}
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  )
}
