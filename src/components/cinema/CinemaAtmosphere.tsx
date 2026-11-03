'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion';
import './cinema-atmosphere.css';

export default function CinemaAtmosphere() {
  const reduceMotion = useReducedMotion();
  const pendingFrame = useRef<number | null>(null);
  const pointer = useRef({ x: -100, y: -100 });
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const springX = useSpring(x, { stiffness: 700, damping: 48, mass: 0.12 });
  const springY = useSpring(y, { stiffness: 700, damping: 48, mass: 0.12 });
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(false);
  const [label, setLabel] = useState('');
  const [paused, setPaused] = useState(false);
  const currentLabel = useRef('');

  useEffect(() => {
    if (reduceMotion) return;
    const desktop = window.matchMedia('(min-width: 900px) and (pointer: fine)');
    if (!desktop.matches) return;
    setEnabled(true);

    const renderFrame = () => {
      pendingFrame.current = null;
      if (document.visibilityState === 'hidden') return;
      const { x: px, y: py } = pointer.current;
      x.set(px);
      y.set(py);
    };
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      pointer.current = { x: event.clientX, y: event.clientY };
      setVisible(true);
      const target = event.target instanceof Element ? event.target.closest('a, button, [role="button"]') : null;
      const nextLabel = target ? (target.textContent?.toLowerCase().includes('start') || target.getAttribute('href') === '/register' ? 'Start' : 'View') : '';
      if (nextLabel !== currentLabel.current) {
        currentLabel.current = nextLabel;
        setLabel(nextLabel);
      }
      if (pendingFrame.current === null) pendingFrame.current = window.requestAnimationFrame(renderFrame);
    };
    const onLeave = () => setVisible(false);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setVisible(false);
        setPaused(true);
        if (pendingFrame.current !== null) cancelAnimationFrame(pendingFrame.current);
        pendingFrame.current = null;
      } else {
        setPaused(false);
      }
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (pendingFrame.current !== null) cancelAnimationFrame(pendingFrame.current);
    };
  }, [reduceMotion, x, y]);

  if (reduceMotion || !enabled) return null;
  return (
    <>
      <div className={paused ? 'cinema-film-grain is-paused' : 'cinema-film-grain'} aria-hidden="true" />
      <motion.div className="cinema-spotlight" style={{ x: springX, y: springY, opacity: visible ? 1 : 0 }} aria-hidden="true" />
      <motion.div
        className={`cinema-cursor ${visible ? 'is-visible' : ''} ${label ? 'has-label' : ''}`}
        style={{ x: springX, y: springY }}
        aria-hidden="true"
      >
        <span className="cinema-cursor-core" />
        <span className="cinema-cursor-label">{label}</span>
      </motion.div>
    </>
  );
}
