import { AnimatePresence, motion } from 'motion/react'
import { ReactNode } from 'react'
import { cartBackdropVariants, modalTransition, modalVariants } from '../../lib/motion'

interface AnimatedModalProps {
  open: boolean
  onClose: () => void
  children: ReactNode
}

export function AnimatedModal({ open, onClose, children }: AnimatedModalProps) {
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/70"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={cartBackdropVariants}
          />
          <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-5">
            <motion.div
              initial="initial"
              animate="animate"
              exit="exit"
              variants={modalVariants}
              transition={modalTransition}
              className="mx-auto my-6 w-full max-w-[1120px] rounded-[28px] border border-[#e7c8db] bg-[#fff7fb] p-5 shadow-[0_30px_90px_rgba(138,67,108,0.18)] sm:my-10 sm:p-6 lg:my-12 lg:p-8"
            >
              {children}
            </motion.div>
          </div>
        </>
      ) : null}
    </AnimatePresence>
  )
}
