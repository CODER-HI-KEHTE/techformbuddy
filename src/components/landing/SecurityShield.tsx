'use client';

import { motion, useReducedMotion } from 'framer-motion';

export default function SecurityShield() {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className="landing-security-icon"
      aria-hidden="true"
      initial={reduceMotion ? false : { opacity: 0, scale: 0.86 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, amount: 0.7 }}
      transition={{ duration: reduceMotion ? 0 : 0.42, ease: 'easeOut' }}
    >
      <svg viewBox="0 0 64 64" fill="none">
        <motion.circle
          cx="32" cy="31" r="24"
          fill="var(--cherry-bright)"
          animate={reduceMotion ? undefined : { opacity: [0.08, 0.2, 0.08] }}
          transition={reduceMotion ? undefined : { duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <path d="M32 9 50 16v14c0 12-7 20-18 25C21 50 14 42 14 30V16l18-7Z" fill="var(--cherry)" stroke="var(--cherry-bright)" strokeWidth="2.5" strokeLinejoin="round" />
        <motion.path
          d="M32 9 50 16v14c0 12-7 20-18 25C21 50 14 42 14 30V16l18-7Z"
          fill="none"
          stroke="var(--blush)"
          strokeWidth="2.5"
          strokeLinejoin="round"
          pathLength={1}
          initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
          whileInView={{ pathLength: 1, opacity: 1 }}
          viewport={{ once: true, amount: .75 }}
          transition={{ duration: reduceMotion ? 0 : .95, ease: 'easeInOut' }}
        />
        <motion.g
          initial={reduceMotion ? false : { opacity: 0, y: 5, scale: .86 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: .75 }}
          transition={{ duration: reduceMotion ? 0 : .35, delay: reduceMotion ? 0 : .62 }}
          style={{ transformOrigin: '32px 32px' }}
        >
          <rect x="23" y="29" width="18" height="15" rx="4" fill="var(--bg-light)" />
          <path d="M27 29v-4a5 5 0 0 1 10 0v4" stroke="var(--bg-light)" strokeWidth="3" strokeLinecap="round" />
          <circle cx="32" cy="36" r="2" fill="var(--cherry-deep)" />
        </motion.g>
      </svg>
    </motion.div>
  );
}
