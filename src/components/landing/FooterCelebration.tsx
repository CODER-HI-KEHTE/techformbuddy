'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import MimmyBot from '@/components/MimmyBot';

const PIECES = Array.from({ length: 22 }, (_, index) => ({
  x: `${(index % 11 - 5) * 28}px`,
  y: `${-28 - (index % 7) * 22}px`,
  rotate: `${(index % 2 ? 1 : -1) * (80 + index * 13)}deg`,
  delay: `${(index % 8) * 0.018}s`,
  color: ['var(--cherry-bright)', 'var(--cherry)', 'var(--blush)', '#ffffff'][index % 4],
}));

export default function FooterCelebration() {
  const sectionRef = useRef<HTMLElement>(null);
  const [burst, setBurst] = useState(false);
  const timer = useRef<number | null>(null);
  const burstTimer = useRef<number | null>(null);
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const inView = useInView(sectionRef, { once: true, amount: .55 });

  useEffect(() => {
    if (!inView || reduceMotion) return;
    setBurst(true);
    burstTimer.current = window.setTimeout(() => setBurst(false), 950);
  }, [inView, reduceMotion]);

  useEffect(() => () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    if (burstTimer.current !== null) window.clearTimeout(burstTimer.current);
  }, []);

  const handleStart = () => {
    if (reduceMotion) {
      router.push('/register');
      return;
    }
    setBurst(true);
    burstTimer.current = window.setTimeout(() => setBurst(false), 950);
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => router.push('/register'), 520);
  };

  return (
    <section ref={sectionRef} className="footer-celebration" aria-label="Get started with TechForm Buddy">
      <div className="footer-celebration-glow" aria-hidden="true" />
      <MimmyBot className="footer-celebration-mimmy" size={78} mood={burst ? 'happy' : 'idle'} interactive={false} label="Mimmy celebrates with you" />
      {burst && !reduceMotion && (
        <div className="footer-confetti" aria-hidden="true">
          {PIECES.map((piece, index) => (
            <motion.i
              key={index}
              initial={{ opacity: 0, scale: 0.35, x: 0, y: 0, rotate: '0deg' }}
              animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.75], x: piece.x, y: piece.y, rotate: piece.rotate }}
              transition={{ duration: 0.48, delay: Number.parseFloat(piece.delay), ease: 'easeOut' }}
              style={{ backgroundColor: piece.color }}
            />
          ))}
        </div>
      )}
      <p className="landing-kicker">A little help goes a long way</p>
      <h2>Make your next form feel easier.</h2>
      <p className="footer-celebration-copy">Start free. Ask for help when you need it. Keep every final decision yours.</p>
      <button type="button" className="btn btn-primary btn-lg footer-celebration-button" onClick={handleStart}>
        Get started free <span aria-hidden="true">↗</span>
      </button>
      <p className="footer-celebration-footnote">Free to begin · Review everything · Submit yourself</p>
    </section>
  );
}
