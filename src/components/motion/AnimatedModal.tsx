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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
            <motion.div
              initial="initial"
              animate="animate"
              exit="exit"
              variants={modalVariants}
              transition={modalTransition}
              className="w-full max-w-[560px] rounded-[28px] border border-[#dbcde0] bg-[#fffdfd] p-8 shadow-[0_30px_90px_rgba(95,72,118,0.18)]"
            >
              {children}
            </motion.div>
          </div>
        </>
      ) : null}
    </AnimatePresence>
  )
}
