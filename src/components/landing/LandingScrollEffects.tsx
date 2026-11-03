'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';
import MimmyBot, { type MimmyMood } from '@/components/MimmyBot';

export default function LandingScrollEffects() {
  const reduceMotion = useReducedMotion();
  const [mood, setMood] = useState<MimmyMood>('waving');
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 28, mass: 0.25 });
  const heroTint = useTransform(smoothProgress, [0, 0.28, 0.58, 0.84, 1], [0.2, 0.06, 0.12, 0.03, 0.17]);
  const securityTint = useTransform(smoothProgress, [0, 0.38, 0.62, 0.86, 1], [0.02, 0.12, 0.04, 0.19, 0.08]);
  const mascotX = useTransform(smoothProgress, [0, 0.32, 0.67, 1], ['74vw', '68vw', '12vw', '72vw']);
  const mascotY = useTransform(smoothProgress, [0, 0.32, 0.67, 1], ['17vh', '24vh', '75vh', '18vh']);

  useEffect(() => {
    const landmarks = document.querySelectorAll<HTMLElement>('[data-mimmy-mood]');
    const observer = new IntersectionObserver((entries) => {
      const active = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      const nextMood = active?.target.getAttribute('data-mimmy-mood') as MimmyMood | null;
      if (nextMood) setMood(nextMood);
    }, { rootMargin: '-34% 0px -34% 0px', threshold: [0.05, 0.2, 0.45] });
    landmarks.forEach((landmark) => observer.observe(landmark));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <motion.div
        className="landing-curtain"
        aria-hidden="true"
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: reduceMotion ? 0.14 : 0.62, ease: 'easeOut' }}
      />
      <motion.div
        className="landing-scroll-progress"
        aria-hidden="true"
        style={{ scaleX: reduceMotion ? 0 : smoothProgress, transformOrigin: 'left center' }}
      />
      <motion.div className="landing-scroll-aurora landing-scroll-aurora-hero" aria-hidden="true" style={{ opacity: reduceMotion ? 0 : heroTint }} />
      <motion.div className="landing-scroll-aurora landing-scroll-aurora-security" aria-hidden="true" style={{ opacity: reduceMotion ? 0 : securityTint }} />
      <motion.div
        className="landing-scroll-mimmy"
        aria-hidden="true"
        style={reduceMotion ? undefined : { x: mascotX, y: mascotY }}
      >
        <MimmyBot size={62} mood={mood} interactive={false} label="Mimmy Bot" />
      </motion.div>
    </>
  );
}
