'use client';

import { useRef } from 'react';
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';

const PARTICLES = Array.from({ length: 14 }, (_, index) => ({
  id: index,
  left: `${(index * 37 + 11) % 100}%`,
  top: `${(index * 53 + 7) % 100}%`,
  delay: `${(index % 7) * -0.8}s`,
  size: index % 4 === 0 ? 5 : 3,
}));

export default function LandingAtmosphere() {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const smoothX = useSpring(pointerX, { stiffness: 45, damping: 20, mass: 0.8 });
  const smoothY = useSpring(pointerY, { stiffness: 45, damping: 20, mass: 0.8 });
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end start'] });
  const farX = useTransform(smoothX, [-1, 1], [-9, 9]);
  const farY = useTransform(smoothY, [-1, 1], [-7, 7]);
  const nearX = useTransform(smoothX, [-1, 1], [12, -12]);
  const nearY = useTransform(smoothY, [-1, 1], [9, -9]);
  const scrollY = useTransform(scrollYProgress, [0, 1], [0, 72]);

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (reduceMotion || event.pointerType === 'touch') return;
    const bounds = containerRef.current?.getBoundingClientRect();
    if (!bounds) return;
    pointerX.set(((event.clientX - bounds.left) / bounds.width) * 2 - 1);
    pointerY.set(((event.clientY - bounds.top) / bounds.height) * 2 - 1);
  };

  const resetPointer = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  return (
    <div
      ref={containerRef}
      className="landing-atmosphere"
      aria-hidden="true"
      onPointerMove={handlePointerMove}
      onPointerLeave={resetPointer}
    >
      <motion.div className="aurora-wash aurora-wash-one" style={reduceMotion ? undefined : { x: farX, y: farY }} />
      <motion.div className="aurora-wash aurora-wash-two" style={reduceMotion ? undefined : { x: nearX, y: nearY }} />
      <motion.div className="aurora-orb aurora-orb-cherry" style={reduceMotion ? undefined : { x: nearX, y: farY }} />
      <motion.div className="aurora-orb aurora-orb-blush" style={reduceMotion ? undefined : { x: farX, y: nearY }} />
      <motion.div className="aurora-scroll-glow" style={reduceMotion ? undefined : { y: scrollY }} />
      <div className="particle-field">
        {PARTICLES.map((particle) => (
          <span
            key={particle.id}
            className="aurora-particle"
            style={{
              left: particle.left,
              top: particle.top,
              animationDelay: particle.delay,
              width: particle.size,
              height: particle.size,
            }}
          />
        ))}
      </div>
    </div>
  );
}
