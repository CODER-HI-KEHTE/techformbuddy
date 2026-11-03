'use client';

import { motion, useReducedMotion } from 'framer-motion';

export default function WordReveal({ text, className }: { text: string; className?: string }) {
  const reduceMotion = useReducedMotion();
  const words = text.split(/\s+/);
  return (
    <motion.p
      className={className}
      aria-label={text}
      initial={reduceMotion ? false : 'hidden'}
      whileInView="visible"
      viewport={{ once: true, amount: 0.6 }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: reduceMotion ? 0 : 0.035 } },
      }}
    >
      {words.map((word, index) => (
        <motion.span
          key={`${word}-${index}`}
          aria-hidden="true"
          variants={{ hidden: { opacity: 0.28, y: 3 }, visible: { opacity: 1, y: 0 } }}
          transition={{ duration: reduceMotion ? 0 : 0.22, ease: 'easeOut' }}
        >
          {word}{index < words.length - 1 ? ' ' : ''}
        </motion.span>
      ))}
    </motion.p>
  );
}
