'use client';

import { ReactNode, useEffect, useRef } from 'react';
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';
import SectionBackgroundBlend from '@/components/cinema/SectionBackgroundBlend';

interface RevealProps {
  children: ReactNode;
  as?: 'div' | 'span' | 'h1' | 'p';
  className?: string;
  delay?: number;
  scale?: boolean;
}

export function MotionReveal({ children, as = 'div', className, delay = 0, scale = false }: RevealProps) {
  const reduceMotion = useReducedMotion();
  const initial = reduceMotion ? false : scale ? { opacity: 0, scale: 0.92, y: 12 } : { opacity: 0, y: 14 };
  const animate = scale ? { opacity: 1, scale: 1, y: 0 } : { opacity: 1, y: 0 };
  const transition = { delay: reduceMotion ? 0 : delay, duration: reduceMotion ? 0 : 0.48, ease: 'easeOut' as const };
  const props = { className, initial, animate, transition };

  switch (as) {
    case 'span': return <motion.span {...props}>{children}</motion.span>;
    case 'h1': return <motion.h1 {...props}>{children}</motion.h1>;
    case 'p': return <motion.p {...props}>{children}</motion.p>;
    default: return <motion.div {...props}>{children}</motion.div>;
  }
}

const gridVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.085, delayChildren: 0.08 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, rotateX: 16, rotateY: -7, z: -24 },
  visible: { opacity: 1, y: 0, rotateX: 0, rotateY: 0, z: 0, transition: { duration: 0.55, ease: 'easeOut' as const } },
};

export function FeatureGrid({ children, className }: { children: ReactNode; className?: string }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className={className}
      variants={reduceMotion ? undefined : gridVariants}
      initial={reduceMotion ? false : 'hidden'}
      whileInView={reduceMotion ? undefined : 'visible'}
      viewport={{ once: true, amount: 0.12 }}
    >
      {children}
    </motion.div>
  );
}

export function FeatureCard({ children, className }: { children: ReactNode; className?: string }) {
  const reduceMotion = useReducedMotion();
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const smoothX = useSpring(pointerX, { stiffness: 260, damping: 24 });
  const smoothY = useSpring(pointerY, { stiffness: 260, damping: 24 });
  const rotateX = useTransform(smoothY, [-0.5, 0.5], [7, -7]);
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-7, 7]);

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (reduceMotion || event.pointerType === 'touch') return;
    const bounds = event.currentTarget.getBoundingClientRect();
    pointerX.set((event.clientX - bounds.left) / bounds.width - 0.5);
    pointerY.set((event.clientY - bounds.top) / bounds.height - 0.5);
    event.currentTarget.style.setProperty('--glow-x', `${((event.clientX - bounds.left) / bounds.width) * 100}%`);
    event.currentTarget.style.setProperty('--glow-y', `${((event.clientY - bounds.top) / bounds.height) * 100}%`);
  };

  const resetPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    pointerX.set(0);
    pointerY.set(0);
    event.currentTarget.style.setProperty('--glow-x', '50%');
    event.currentTarget.style.setProperty('--glow-y', '50%');
  };

  return (
    <motion.div
      className={className}
      variants={reduceMotion ? undefined : cardVariants}
      style={reduceMotion ? undefined : { rotateX, rotateY, transformPerspective: 900 }}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetPointer}
      whileHover={reduceMotion ? undefined : { scale: 1.02, z: 12 }}
    >
      {children}
    </motion.div>
  );
}

export function LandingHero({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroProgress = useSpring(scrollYProgress, { stiffness: 90, damping: 28, mass: 0.25 });
  const contentY = useTransform(heroProgress, [0, 1], ['0px', '-56px']);
  const contentOpacity = useTransform(heroProgress, [0, 1], [1, 0.18]);
  const visualRotateX = useTransform(heroProgress, [0, 1], ['0deg', '4deg']);
  const visualRotateY = useTransform(heroProgress, [0, 1], ['0deg', '-9deg']);
  const visualScale = useTransform(heroProgress, [0, 1], [1, 0.92]);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const start = () => {
      if (!reduceMotion) hero.classList.add('cinema-push-in');
    };
    const end = () => hero.classList.remove('cinema-push-in');
    window.addEventListener('tfb-cinema-intro-start', start);
    window.addEventListener('tfb-cinema-intro-end', end);
    return () => {
      window.removeEventListener('tfb-cinema-intro-start', start);
      window.removeEventListener('tfb-cinema-intro-end', end);
    };
  }, [reduceMotion]);

  return (
    <motion.section
      ref={heroRef}
      id="intro"
      className="hero"
      style={{
        '--hero-content-y': reduceMotion ? '0px' : contentY,
        '--hero-content-opacity': reduceMotion ? 1 : contentOpacity,
        '--hero-rotate-x': reduceMotion ? '0deg' : visualRotateX,
        '--hero-rotate-y': reduceMotion ? '0deg' : visualRotateY,
        '--hero-visual-scale': reduceMotion ? 1 : visualScale,
      } as React.CSSProperties}
      // Keep the hero visible if entrance motion is interrupted during hydration.
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.65, ease: 'easeOut' }}
      data-mimmy-mood="waving"
    >
      <SectionBackgroundBlend progress={heroProgress} />
      {children}
    </motion.section>
  );
}

export function LandingCallToAction({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.section
      className="cta"
      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: reduceMotion ? 0 : 0.5 }}
    >
      {children}
    </motion.section>
  );
}
