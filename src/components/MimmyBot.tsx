'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion, useTransform, type MotionValue } from 'framer-motion';
import './mimmy-bot.css';

export type MimmyMood = 'idle' | 'happy' | 'thinking' | 'waving' | 'sleepy';

interface MimmyBotProps {
  size?: number;
  className?: string;
  mood?: MimmyMood;
  label?: string;
  lookAt?: { x: number; y: number };
  eyeOffset?: { x: number | MotionValue<number>; y: number | MotionValue<number> };
  interactive?: boolean;
}

const BURST = [
  { x: -27, y: -19, icon: '✦' },
  { x: 27, y: -25, icon: '♥' },
  { x: -34, y: 17, icon: '✧' },
  { x: 33, y: 13, icon: '✦' },
];

export default function MimmyBot({
  size = 180,
  className = '',
  mood = 'idle',
  label = 'Mimmy Bot mascot',
  lookAt,
  eyeOffset = { x: 0, y: 0 },
  interactive = true,
}: MimmyBotProps) {
  const reduceMotion = useReducedMotion();
  const gradientId = `mimmy-bow-${useId().replace(/:/g, '')}`;
  const [blink, setBlink] = useState(false);
  const [burstId, setBurstId] = useState(0);
  const burstTimer = useRef<number | null>(null);
  const gaze = lookAt ?? eyeOffset;
  const pupilX = useTransform(() => (typeof gaze.x === 'number' ? gaze.x : gaze.x.get() / 3) * 2.2);
  const pupilY = useTransform(() => (typeof gaze.y === 'number' ? gaze.y : gaze.y.get() / 3) * 1.8);

  useEffect(() => {
    if (reduceMotion) return;
    let timer = 0;
    let blinkTimer = 0;
    let active = true;
    const scheduleBlink = () => {
      timer = window.setTimeout(() => {
        if (!active) return;
        setBlink(true);
        blinkTimer = window.setTimeout(() => setBlink(false), 130);
        scheduleBlink();
      }, 2400 + Math.random() * 2600);
    };
    scheduleBlink();
    return () => {
      active = false;
      window.clearTimeout(timer);
      window.clearTimeout(blinkTimer);
    };
  }, [reduceMotion]);

  useEffect(() => () => {
    if (burstTimer.current !== null) window.clearTimeout(burstTimer.current);
  }, []);

  const celebrate = () => {
    setBurstId((current) => current + 1);
    if (burstTimer.current !== null) window.clearTimeout(burstTimer.current);
    burstTimer.current = window.setTimeout(() => setBurstId(0), 900);
  };
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      celebrate();
    }
  };
  const eyeScale = mood === 'sleepy' ? 0.24 : blink ? 0.12 : 1;

  return (
    <motion.div
      className={`mimmy-bot ${className}`.trim()}
      role="img"
      aria-label={label}
      tabIndex={interactive ? 0 : undefined}
      style={{ width: size, height: size }}
      onClick={interactive ? celebrate : undefined}
      onKeyDown={interactive ? handleKeyDown : undefined}
      initial={false}
      animate={reduceMotion ? undefined : { y: mood === 'happy' ? [0, -4, 0] : 0 }}
      transition={reduceMotion ? undefined : { duration: 1.4, repeat: mood === 'happy' ? Infinity : 0, ease: 'easeInOut' }}
      whileHover={reduceMotion ? undefined : { rotate: -4, scale: 1.045 }}
      whileTap={reduceMotion ? undefined : { scale: 0.94, y: 5 }}
    >
      <svg viewBox="0 0 160 160" width="100%" height="100%" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1="96" y1="24" x2="139" y2="58" gradientUnits="userSpaceOnUse">
            <stop stopColor="var(--cherry-bright)" />
            <stop offset="1" stopColor="var(--cherry-deep)" />
          </linearGradient>
        </defs>
        <ellipse cx="80" cy="145" rx="41" ry="7" fill="var(--cherry)" opacity=".12" />
        <motion.g
          animate={reduceMotion || (mood !== 'waving' && mood !== 'happy') ? { rotate: 0 } : { rotate: [0, -36, 4, -34, 0] }}
          transition={reduceMotion ? undefined : { duration: 1.2, repeat: mood === 'waving' || mood === 'happy' ? Infinity : 0, repeatDelay: 0.35 }}
          style={{ transformOrigin: '119px 101px' }}
        >
          <path d="M118 91c15-7 24 2 24 13s-8 17-22 15l-7-8" fill="#FFF9E9" stroke="#E9DAB9" strokeWidth="3" strokeLinejoin="round" />
          <path d="M137 102c3 2 4 5 3 8" stroke="var(--cherry)" strokeWidth="2.5" strokeLinecap="round" />
        </motion.g>
        <motion.g
          animate={reduceMotion ? undefined : { rotate: [0, 0, 0, -3, 0] }}
          transition={reduceMotion ? undefined : { duration: 4.8, repeat: Infinity, times: [0, 0.72, 0.76, 0.82, 1] }}
          style={{ transformOrigin: '80px 88px' }}
        >
          {/* Small antenna and the two distinct pointy ears */}
          <path d="M80 35V22" stroke="var(--cherry)" strokeWidth="4" strokeLinecap="round" />
          <circle cx="80" cy="18" r="6" fill="var(--cherry-bright)" stroke="white" strokeWidth="2" />
          <circle cx="80" cy="18" r="10" fill="var(--cherry-bright)" opacity=".22" />
          <path d="M42 61 34 31c-1-5 4-8 8-5l22 17M118 61l8-30c1-5-4-8-8-5L96 42" fill="#FFF9E9" stroke="#E9DAB9" strokeWidth="3" strokeLinejoin="round" />
          <path d="m40 37 15 13m65-13-15 13" stroke="#F2C6C1" strokeWidth="2" strokeLinecap="round" />
          {/* Soft cream round face */}
          <ellipse cx="80" cy="87" rx="48" ry="47" fill="#FFF9E9" stroke="#E9DAB9" strokeWidth="3" />
          <ellipse cx="80" cy="90" rx="40" ry="38" fill="#FFFCF4" />
          {/* Yellow side bow */}
          <motion.g
            animate={reduceMotion ? undefined : { rotate: [0, 5, -3, 0] }}
            transition={reduceMotion ? undefined : { duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
            style={{ transformOrigin: '120px 55px' }}
          >
            <path d="M119 54c-10-12-19-13-20-5-1 7 6 11 19 10-10 5-12 13-5 15 7 2 11-7 11-19 6 10 14 12 16 5 2-7-7-11-19-11 10-6 12-14 5-16-7-2-11 7-11 21Z" fill={`url(#${gradientId})`} stroke="var(--cherry-deep)" strokeWidth="2" strokeLinejoin="round" />
            <circle cx="120" cy="56" r="5" fill="var(--cherry-bright)" stroke="var(--cherry-deep)" strokeWidth="1.5" />
          </motion.g>
          {/* Blush */}
          <ellipse cx="51" cy="99" rx="8" ry="4.5" fill="var(--blush)" opacity=".55" />
          <ellipse cx="109" cy="99" rx="8" ry="4.5" fill="var(--blush)" opacity=".55" />
          {/* Glossy dot eyes follow the pointer; sleepy/blinking states lower the eyelids */}
          <motion.g
            style={{ x: pupilX, y: pupilY, scaleY: eyeScale, transformOrigin: '80px 83px' }}
          >
            <ellipse cx="63" cy="82" rx="5.7" ry="8" fill="#362B3C" />
            <ellipse cx="97" cy="82" rx="5.7" ry="8" fill="#362B3C" />
            <circle cx="65" cy="79" r="2.1" fill="white" />
            <circle cx="99" cy="79" r="2.1" fill="white" />
          </motion.g>
          <path d={mood === 'happy' ? 'M73 99c4 7 10 7 14 0' : mood === 'sleepy' ? 'M75 100h10' : 'M74 98c3 4 9 4 12 0'} stroke="#B96F75" strokeWidth="2.5" strokeLinecap="round" />
          {mood === 'thinking' && <text x="111" y="71" fill="var(--cherry)" fontSize="12" fontWeight="700">···</text>}
          {mood === 'sleepy' && <text x="112" y="70" fill="var(--cherry)" fontSize="10" fontWeight="700">z z</text>}
        </motion.g>
      </svg>
      <AnimatePresence>
        {burstId > 0 && !reduceMotion && BURST.map((item, index) => (
          <motion.span
            className="mimmy-burst"
            key={`${burstId}-${index}`}
            aria-hidden="true"
            initial={{ opacity: 0, scale: 0.3, x: 0, y: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0.4, 1.15, 0.7], x: item.x, y: item.y }}
            transition={{ duration: 0.78, delay: index * 0.035, ease: 'easeOut' }}
          >
            {item.icon}
          </motion.span>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}