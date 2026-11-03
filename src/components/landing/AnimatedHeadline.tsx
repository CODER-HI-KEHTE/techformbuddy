'use client';

import { motion, useReducedMotion } from 'framer-motion';

const WORDS = ['Forms', 'made', 'human.', 'In', 'your', 'language.'];

export default function AnimatedHeadline() {
  const reduceMotion = useReducedMotion();
  const container = {
    hidden: {},
    visible: { transition: { staggerChildren: reduceMotion ? 0 : 0.095, delayChildren: 0.08 } },
  };
  const word = {
    hidden: reduceMotion ? { opacity: 1 } : { opacity: 0, y: 22 },
    visible: { opacity: 1, y: 0, transition: { duration: reduceMotion ? 0 : 0.52, ease: 'easeOut' as const } },
  };

  return (
    <motion.h1 variants={container} initial={reduceMotion ? false : 'hidden'} animate="visible" aria-label="Forms made human. In your language.">
      {WORDS.map((part, index) => (
        <motion.span className={index === 2 ? 'headline-shimmer' : undefined} variants={word} key={`${part}-${index}`} aria-hidden="true">
          {part}{index === 2 ? <br /> : ' '}
        </motion.span>
      ))}
    </motion.h1>
  );
}
