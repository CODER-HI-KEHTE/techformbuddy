'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

const PROMISES = ['Fill forms in seconds', 'Never miss a deadline', 'Autofill with AI'];

export default function RotatingPromise() {
  const [active, setActive] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % PROMISES.length), 2600);
    return () => window.clearInterval(timer);
  }, [reduceMotion]);

  return (
    <span className="rotating-promise" aria-live="polite" aria-atomic="true">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={PROMISES[active]}
          className="rotating-promise-text"
          initial={reduceMotion ? false : { opacity: 0, y: 10, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={reduceMotion ? undefined : { opacity: 0, y: -8, filter: 'blur(5px)' }}
          transition={{ duration: reduceMotion ? 0 : 0.32 }}
        >
          {PROMISES[active]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
