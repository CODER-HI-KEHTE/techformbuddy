'use client';

import { motion, useReducedMotion } from 'framer-motion';

const PATHS = [
  'M0 42 C180 90 290 8 474 34 C650 58 780 90 948 48 C1120 5 1290 10 1440 55 L1440 90 L0 90 Z',
  'M0 52 C190 5 300 88 488 58 C670 28 770 5 950 50 C1120 92 1280 78 1440 38 L1440 90 L0 90 Z',
  'M0 34 C170 12 310 50 490 76 C660 99 790 42 960 28 C1120 12 1300 38 1440 68 L1440 90 L0 90 Z',
];

export default function SectionWave({ tone = 'cherry' }: { tone?: 'cherry' | 'blush' }) {
  const reduceMotion = useReducedMotion();
  return (
    <div className={`section-wave section-wave-${tone}`} aria-hidden="true">
      <svg viewBox="0 0 1440 90" preserveAspectRatio="none">
        <motion.path
          d={PATHS[0]}
          fill="currentColor"
          opacity=".1"
          animate={reduceMotion ? undefined : { d: PATHS }}
          transition={reduceMotion ? undefined : { duration: 8, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
        />
        <motion.path
          d={PATHS[1]}
          fill="currentColor"
          opacity=".065"
          animate={reduceMotion ? undefined : { d: [PATHS[1], PATHS[2], PATHS[0]] }}
          transition={reduceMotion ? undefined : { duration: 10, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
        />
      </svg>
    </div>
  );
}
