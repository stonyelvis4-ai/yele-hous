import { AnimatePresence, motion } from 'motion/react'
import { toastTransition, toastVariants } from '../../lib/motion'

interface ToastNotificationProps {
  open: boolean
  title: string
  message: string
}

export function ToastNotification({ open, title, message }: ToastNotificationProps) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial="initial"
          animate="animate"
          exit="exit"
          variants={toastVariants}
          transition={toastTransition}
          className="pointer-events-none fixed right-5 top-5 z-[80] w-[min(360px,calc(100vw-40px))] rounded-[22px] border border-[#ef4cae]/20 bg-[rgba(255,253,255,0.96)] p-5 text-[#241f2b] shadow-[0_24px_80px_rgba(236,72,153,0.16)] backdrop-blur-xl"
        >
          <div className="absolute inset-0 rounded-[22px] bg-[radial-gradient(circle_at_top,_rgba(236,72,153,0.24),_transparent_40%),radial-gradient(circle_at_bottom_right,_rgba(124,58,237,0.24),_transparent_48%)]" />
          <div className="relative z-[1]">
            <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[#f7b8df]">Confirmation</p>
            <h3 className="mt-2 text-[17px] font-semibold">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-[#6e6479]">{message}</p>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
