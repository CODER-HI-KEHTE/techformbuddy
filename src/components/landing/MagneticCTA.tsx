'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion';

export default function MagneticCTA() {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, { stiffness: 260, damping: 18 });
  const y = useSpring(rawY, { stiffness: 260, damping: 18 });

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (reduceMotion || event.pointerType === 'touch') return;
    const bounds = ref.current?.getBoundingClientRect();
    if (!bounds) return;
    rawX.set((event.clientX - bounds.left - bounds.width / 2) * 0.13);
    rawY.set((event.clientY - bounds.top - bounds.height / 2) * 0.13);
  };

  const reset = () => {
    rawX.set(0);
    rawY.set(0);
  };

  return (
    <motion.div
      ref={ref}
      className="magnetic-cta-wrap"
      style={reduceMotion ? undefined : { x, y }}
      onPointerMove={onPointerMove}
      onPointerLeave={reset}
      whileHover={reduceMotion ? undefined : { scale: 1.035 }}
      whileTap={reduceMotion ? undefined : { scale: 0.97 }}
    >
      <Link href="/register" className="btn btn-primary btn-lg magnetic-cta">
        Get started free
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
      </Link>
    </motion.div>
  );
}
