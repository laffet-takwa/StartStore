import { motion } from 'framer-motion'

const variants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.2 } },
}

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div variants={variants} initial="hidden" animate="visible" exit="exit">
      {children}
    </motion.div>
  )
}
