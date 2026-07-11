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
            className="fixed bottom-0 left-0 right-0 z-50 flex h-[88vh] w-full flex-col rounded-t-[28px] border-x border-t border-[#e7c8db] bg-[#fdf1f7] p-4 shadow-[0_0_80px_rgba(138,67,108,0.18)] sm:h-[90vh] sm:p-5 md:bottom-auto md:left-auto md:right-0 md:top-0 md:h-screen md:max-w-[452px] md:rounded-none md:border-x-0 md:border-l md:border-t-0 md:p-6"
          >
            {children}
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  )
}
