'use client';

import { Children, ReactNode, useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useReducedMotion, useSpring } from 'framer-motion';
import MimmyBot, { type MimmyMood } from '@/components/MimmyBot';
import './floating-buddy.css';

interface FloatingBuddyProps {
  children: ReactNode;
  isListening: boolean;
  isSpeaking: boolean;
  autofillEnabled: boolean;
  isHidden: boolean;
  isMounted: boolean;
  savedPosition: { x: number; y: number } | null;
  onPositionChange: (position: { x: number; y: number }) => void;
  onHide: () => void;
  onToggleOpen?: () => void;
}

export default function FloatingBuddy({
  children,
  isListening,
  isSpeaking,
  autofillEnabled,
  isHidden,
  isMounted,
  savedPosition,
  onPositionChange,
  onHide,
  onToggleOpen,
}: FloatingBuddyProps) {
  const [expanded, setExpanded] = useState(false);
  const [sleepy, setSleepy] = useState(false);
  const reduceMotion = useReducedMotion();
  const idleTimer = useRef<number | null>(null);
  const lastActivityAt = useRef(0);

  /* ── eye-follow-cursor ────────────────────────────────────────────── */
  const gazeXRaw = useMotionValue(0);
  const gazeYRaw = useMotionValue(0);
  const gazeX = useSpring(gazeXRaw, { stiffness: 260, damping: 22 });
  const gazeY = useSpring(gazeYRaw, { stiffness: 260, damping: 22 });
  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);
  const dotRef = useRef<HTMLButtonElement>(null);
  const launcherRef = useRef<HTMLDivElement>(null);
  const dragBoundsRef = useRef<HTMLDivElement>(null);

  const markActivity = useCallback(() => {
    setSleepy(false);
    lastActivityAt.current = Date.now();
    if (idleTimer.current !== null) window.clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(() => setSleepy(true), 10_000);
  }, []);

  useEffect(() => {
    markActivity();
    return () => {
      if (idleTimer.current !== null) window.clearTimeout(idleTimer.current);
    };
  }, [markActivity]);

  useEffect(() => {
    if (reduceMotion || expanded) return;
    const handleMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      if (Date.now() - lastActivityAt.current > 900) markActivity();
      const el = dotRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      // Normalise to ±3 px max eye travel
      const dx = Math.max(-3, Math.min(3, (e.clientX - cx) / 60));
      const dy = Math.max(-3, Math.min(3, (e.clientY - cy) / 60));
      gazeXRaw.set(dx);
      gazeYRaw.set(dy);
    };
    window.addEventListener('pointermove', handleMove, { passive: true });
    return () => window.removeEventListener('pointermove', handleMove);
  }, [reduceMotion, expanded, gazeXRaw, gazeYRaw, markActivity]);

  const resetGaze = useCallback(() => {
    gazeXRaw.set(0);
    gazeYRaw.set(0);
  }, [gazeXRaw, gazeYRaw]);

  /* ── positioning ──────────────────────────────────────────────────── */
  const savedPositionIsRight = Boolean(isMounted && savedPosition && savedPosition.x > window.innerWidth / 2);
  const positionStyle: React.CSSProperties = savedPosition && isMounted
    ? {
        position: 'fixed',
        left: expanded && savedPositionIsRight ? 'auto' : `${savedPosition.x}px`,
        top: `${savedPosition.y}px`,
        bottom: 'auto',
        right: expanded && savedPositionIsRight ? '12px' : 'auto',
      }
    : { position: 'fixed', bottom: '24px', right: '24px', left: 'auto', top: 'auto' };

  const handleDotClick = () => {
    markActivity();
    setExpanded(true);
    onToggleOpen?.();
  };
  const mascotMood: MimmyMood = isListening ? 'thinking' : sleepy ? 'sleepy' : (autofillEnabled || isSpeaking) ? 'happy' : 'idle';

  const handleCollapse = () => {
    setExpanded(false);
  };

  return (
    <>
    <div ref={dragBoundsRef} className="tfb-floating-buddy-drag-bounds" aria-hidden="true" />
    <motion.div
      ref={launcherRef}
      id="tfb-launcher-badge"
      className={`tfb-floating-buddy ${expanded ? 'is-expanded' : 'is-compact'} ${savedPosition && isMounted ? 'has-saved-position' : ''} ${isListening ? 'is-listening' : ''} ${isSpeaking ? 'is-speaking' : ''}`}
      style={{
        ...positionStyle,
        x: dragX,
        y: dragY,
        display: isHidden && isMounted ? 'none' : 'flex',
      }}
      drag
      dragConstraints={dragBoundsRef}
      dragMomentum={false}
      dragElastic={reduceMotion ? 0 : 0.04}
      onDragEnd={() => {
        const rect = launcherRef.current?.getBoundingClientRect();
        if (!rect) return;
        const snapLeft = rect.left + rect.width / 2 < window.innerWidth / 2;
        const snapX = snapLeft ? 12 : Math.max(12, window.innerWidth - 64 - 12);
        const snapY = Math.max(12, Math.min(window.innerHeight - rect.height - 12, rect.top));
        onPositionChange({ x: snapX, y: snapY });
        dragX.set(0);
        dragY.set(0);
        try {
          localStorage.setItem('tfb_commander_pos', JSON.stringify({ x: snapX, y: snapY }));
        } catch { /* noop */ }
      }}
      onPointerDownCapture={markActivity}
      data-testid="tfb-launcher-badge"
    >
      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            key="panel"
            className="tfb-floating-buddy-expanded"
            layoutId={reduceMotion ? undefined : 'tfb-buddy-surface'}
            initial={reduceMotion ? false : { opacity: 0, scale: 0.5, borderRadius: '50%' }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, borderRadius: '9999px' }}
            exit={reduceMotion ? undefined : { opacity: 0, scale: 0.5, borderRadius: '50%' }}
            transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 28, mass: 0.7 }}
          >
            <div className="tfb-floating-buddy-controls">
              {Children.map(children, (child, index) => (
                <motion.div
                  key={index}
                  initial={reduceMotion ? false : { opacity: 0, y: 7 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: reduceMotion ? 0 : 0.2, delay: reduceMotion ? 0 : index * 0.045 }}
                >
                  {child}
                </motion.div>
              ))}
            </div>
            <button
              type="button"
              id="tfb-pill-close-btn"
              className="tfb-buddy-control tfb-buddy-collapse"
              onClick={(e) => { e.stopPropagation(); handleCollapse(); }}
              aria-label="Collapse Buddy to bot"
              title="Collapse"
            >
              <span aria-hidden="true">×</span>
            </button>
            <button
              type="button"
              id="tfb-pill-hide-btn"
              className="tfb-buddy-control tfb-buddy-hide"
              onClick={(e) => { e.stopPropagation(); onHide(); }}
              aria-label="Hide Buddy"
              title="Hide Buddy (Alt+B to restore)"
            >
              <span aria-hidden="true">−</span>
            </button>
          </motion.div>
        ) : (
          <motion.button
            key="dot"
            ref={dotRef}
            type="button"
            className="tfb-buddy-dot"
            aria-label="Open TechForm Buddy controls"
            title="Hi! Main TechForm Buddy hoon"
            layoutId={reduceMotion ? undefined : 'tfb-buddy-surface'}
            onClick={handleDotClick}
            onPointerLeave={resetGaze}
            /* float up-down */
            animate={reduceMotion ? undefined : { y: [0, -5, 0] }}
            transition={reduceMotion ? undefined : { duration: 3, ease: 'easeInOut', repeat: Infinity }}
            whileTap={reduceMotion ? undefined : { scale: 0.92 }}
            initial={reduceMotion ? false : { scale: 0, opacity: 0 }}
            exit={reduceMotion ? undefined : { scale: 0, opacity: 0 }}
          >
            {/* Glow pulse ring */}
            <span className="tfb-buddy-glow-ring" aria-hidden="true" />

            <MimmyBot size={56} mood={mascotMood} eyeOffset={{ x: gazeX, y: gazeY }} interactive={false} label="Mimmy Bot" />

            {/* Green autofill-on indicator dot */}
            {autofillEnabled && <span className="tfb-buddy-status" aria-label="Autofill on" title="Autofill on" />}
            {/* Listening ring */}
            {isListening && <span className="tfb-buddy-listening-ring" aria-hidden="true" />}
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
    </>
  );
}
