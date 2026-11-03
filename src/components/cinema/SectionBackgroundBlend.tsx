'use client';

import { motion, useReducedMotion, useTransform, type MotionValue } from 'framer-motion';

export default function SectionBackgroundBlend({ progress }: { progress: MotionValue<number> }) {
  const reduceMotion = useReducedMotion();
  const opacity = useTransform(progress, [0, 0.55, 1], [0, 0.12, 0.32]);

  return (
    <motion.div
      className="cinema-section-background-blend"
      aria-hidden="true"
      style={{ opacity: reduceMotion ? 0 : opacity }}
    />
  );
}
