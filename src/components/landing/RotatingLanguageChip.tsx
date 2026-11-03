'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

const LANGUAGES = ['हिंदी · Hindi', 'मराठी · Marathi', 'தமிழ் · Tamil', 'বাংলা · Bengali'];

export default function RotatingLanguageChip() {
  const [index, setIndex] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % LANGUAGES.length), 2200);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="floating-note floating-note-language" aria-label={`Your language: ${LANGUAGES[index]}`}>
      <span aria-hidden="true">अ</span>
      <AnimatePresence mode="wait" initial={false}>
        <motion.strong
          key={LANGUAGES[index]}
          initial={reduceMotion ? false : { opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: -5 }}
          transition={{ duration: reduceMotion ? 0 : 0.18 }}
        >
          {LANGUAGES[index]}
        </motion.strong>
      </AnimatePresence>
    </div>
  );
}
