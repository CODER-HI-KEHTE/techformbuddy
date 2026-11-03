'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import gsap from 'gsap';
import MimmyBot from '@/components/MimmyBot';
import './cinema.css';

const TITLE = 'TECHFORM BUDDY';
export const CINEMA_INTRO_SESSION_KEY = 'tfb-cinema-intro-seen';

export default function CinemaIntro() {
  const reduceMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [count, setCount] = useState(3);
  const [titleVisible, setTitleVisible] = useState(false);
  const [presentVisible, setPresentVisible] = useState(false);
  const finished = useRef(false);
  const timeline = useRef<gsap.core.Timeline | null>(null);

  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    timeline.current?.kill();
    setVisible(false);
    window.dispatchEvent(new CustomEvent('tfb-cinema-intro-end'));
    try { sessionStorage.setItem(CINEMA_INTRO_SESSION_KEY, 'true'); } catch { /* storage may be blocked */ }
  };

  useEffect(() => {
    if (reduceMotion) return;
    try {
      if (sessionStorage.getItem(CINEMA_INTRO_SESSION_KEY) === 'true') return;
      sessionStorage.setItem(CINEMA_INTRO_SESSION_KEY, 'true');
    } catch { /* Intro still runs when storage is unavailable. */ }
    setVisible(true);
  }, [reduceMotion]);

  useEffect(() => {
    if (!visible || reduceMotion) return;
    window.dispatchEvent(new CustomEvent('tfb-cinema-intro-start'));
    const clock = { value: 0 };
    timeline.current = gsap.timeline({ onComplete: finish });
    timeline.current
      .to(clock, { value: 1, duration: 1.48, ease: 'none' })
      .call(() => setPresentVisible(true))
      .to(clock, { value: 2, duration: 0.54, ease: 'none' })
      .call(() => { setPresentVisible(false); setTitleVisible(true); })
      .to(clock, { value: 3, duration: 0.86, ease: 'none' })
      .to(rootRef.current?.querySelectorAll('.cinema-letterbox') ?? [], { yPercent: (index) => index === 0 ? -110 : 110, duration: 0.5, ease: 'power3.inOut' }, '+=0.12')
      .to(rootRef.current, { opacity: 0, duration: 0.28, ease: 'power2.out' }, '<');
    return () => {
      timeline.current?.kill();
    };
    // `finish` is stable for the lifetime of the mounted intro.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, reduceMotion]);

  useEffect(() => {
    if (!visible || reduceMotion) return;
    const timer = window.setInterval(() => setCount((current) => Math.max(1, current - 1)), 550);
    return () => window.clearInterval(timer);
  }, [visible, reduceMotion]);

  if (reduceMotion || !visible) return null;

  return (
    <motion.div ref={rootRef} className="cinema-intro" data-active="true" role="dialog" aria-label="TechForm Buddy opening sequence">
      <div className="cinema-letterbox cinema-letterbox-top" />
      <div className="cinema-letterbox cinema-letterbox-bottom" />
      <div className="cinema-flicker" aria-hidden="true" />
      <motion.div className="cinema-countdown" aria-hidden="true" animate={{ opacity: titleVisible ? 0 : 1, scale: titleVisible ? .86 : 1 }} transition={{ duration: .22 }}>
        <svg viewBox="0 0 120 120" className="cinema-countdown-ring">
          <circle cx="60" cy="60" r="53" />
          <circle cx="60" cy="60" r="53" className="cinema-ring-sweep" />
        </svg>
        <span key={count}>{count}</span>
      </motion.div>
      <div className="cinema-title-card" aria-live="polite">
        <motion.p className="cinema-present" animate={{ opacity: presentVisible ? 1 : 0, y: presentVisible ? 0 : 6 }}>
          TECH YODHA <span>presents</span>
        </motion.p>
        <div className={`cinema-title ${titleVisible ? 'is-visible' : ''}`} aria-label={TITLE}>
          {TITLE.split('').map((letter, index) => (
            <span className="cinema-title-letter" aria-hidden="true" key={`${letter}-${index}`} style={{ '--letter-index': index } as React.CSSProperties}>
              {letter === ' ' ? '\u00a0' : letter}
            </span>
          ))}
        </div>
        <span className="cinema-shine" aria-hidden="true" />
        <MimmyBot className="cinema-peek" size={74} mood="waving" interactive={false} label="Mimmy peeks into the opening credits" />
      </div>
      <button type="button" className="cinema-skip" onClick={finish}>Skip intro <span aria-hidden="true">↗</span></button>
      <span className="cinema-grain" aria-hidden="true" />
    </motion.div>
  );
}
