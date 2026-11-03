'use client';

import { useEffect, useState } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';

const TRAIL = [0, 1, 2, 3];

function Sparkle({ index, x, y, active }: { index: number; x: ReturnType<typeof useMotionValue<number>>; y: ReturnType<typeof useMotionValue<number>>; active: boolean }) {
  const springX = useSpring(x, { stiffness: 900 - index * 150, damping: 42, mass: 0.12 });
  const springY = useSpring(y, { stiffness: 900 - index * 150, damping: 42, mass: 0.12 });
  return (
    <motion.span
      className={`cursor-sparkle cursor-sparkle-${index}`}
      aria-hidden="true"
      style={{ x: springX, y: springY, opacity: active ? 1 : 0 }}
    >
      {index % 2 ? '✦' : '✧'}
    </motion.span>
  );
}

export default function SparkleTrail() {
  const reduceMotion = useReducedMotion();
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const cursorX = useTransform(x, (value) => value - 13);
  const cursorY = useTransform(y, (value) => value - 13);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (reduceMotion) return;
    const move = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      x.set(event.clientX);
      y.set(event.clientY);
      setActive(true);
    };
    const leave = () => setActive(false);
    window.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerleave', leave);
    return () => {
      window.removeEventListener('pointermove', move);
      document.removeEventListener('pointerleave', leave);
    };
  }, [reduceMotion, x, y]);

  if (reduceMotion) return null;
  return (
    <div className="cursor-sparkle-trail" aria-hidden="true">
      <motion.span className="cursor-cherry-ring" style={{ x: cursorX, y: cursorY, opacity: active ? 1 : 0 }} />
      {TRAIL.map((index) => <Sparkle key={index} index={index} x={x} y={y} active={active} />)}
    </div>
  );
}
