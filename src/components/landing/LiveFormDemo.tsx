'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import MimmyBot from '@/components/MimmyBot';

type DemoField = { label: string; value: string; type?: string };
const FIELDS: DemoField[] = [
  { label: 'Full name', value: 'Aarav Sharma' },
  { label: 'Email address', value: 'aarav@example.com', type: 'email' },
  { label: 'Preferred language', value: 'Hindi' },
];
const LETTER_COUNT = FIELDS.reduce((sum, field) => sum + field.value.length, 0);
const TOTAL_STEPS = LETTER_COUNT + FIELDS.length * 2;
const CONFETTI = Array.from({ length: 18 }, (_, index) => index);

export default function LiveFormDemo() {
  const shellRef = useRef<HTMLDivElement>(null);
  const [frame, setFrame] = useState(0);
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: shellRef, offset: ['start end', 'end start'] });
  const tiltX = useTransform(scrollYProgress, [0, 0.5, 1], [6, 0, -6]);
  const tiltY = useTransform(scrollYProgress, [0, 0.5, 1], [-4, 0, 4]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.94, 1, 0.96]);
  const cycleLength = TOTAL_STEPS + 16;
  const run = Math.floor(frame / cycleLength);
  const progress = frame % cycleLength;
  const complete = progress >= TOTAL_STEPS;
  const percent = Math.min(100, Math.round((progress / TOTAL_STEPS) * 100));

  useEffect(() => {
    if (reduceMotion) {
      setFrame(TOTAL_STEPS);
      return;
    }
    const timer = window.setInterval(() => setFrame((current) => current + 1), 155);
    return () => window.clearInterval(timer);
  }, [cycleLength, reduceMotion]);

  const offsets = useMemo(() => {
    let cursor = 0;
    return FIELDS.map((field) => {
      const start = cursor;
      cursor += field.value.length + 2;
      return { start, end: start + field.value.length };
    });
  }, []);

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (reduceMotion || event.pointerType === 'touch') return;
    const bounds = event.currentTarget.getBoundingClientRect();
    setEyeOffset({
      x: Math.max(-1, Math.min(1, (event.clientX - bounds.left - bounds.width / 2) / (bounds.width / 2))),
      y: Math.max(-1, Math.min(1, (event.clientY - bounds.top - bounds.height / 2) / (bounds.height / 2))),
    });
  };

  const resetGaze = () => setEyeOffset({ x: 0, y: 0 });

  return (
    <motion.div
      ref={shellRef}
      className="live-demo-shell"
      style={reduceMotion ? undefined : { rotateX: tiltX, rotateY: tiltY, scale, transformPerspective: 1100 }}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetGaze}
    >
      <div className="live-demo-browser" aria-label="Animated preview of a sample form being filled">
        <div className="live-demo-toolbar">
          <div className="browser-dots" aria-hidden="true"><i /><i /><i /></div>
          <div className="browser-address"><span className="browser-lock">⌑</span> secure.portal.gov / application</div>
          <span className="demo-live-label"><i /> LIVE DEMO</span>
        </div>

        <div className="live-demo-content">
          <div className="demo-form-heading">
            <div>
              <span className="demo-eyebrow">APPLICATION FORM</span>
              <h2>Personal details</h2>
            </div>
            <div className="demo-step">STEP 1 <span>/ 3</span></div>
          </div>

          <div className="demo-fields">
            {FIELDS.map((field, index) => {
              const offset = offsets[index];
              const typed = Math.max(0, Math.min(field.value.length, progress - offset.start));
              const isComplete = progress >= offset.end + 2;
              return (
                <div className={`demo-field ${isComplete ? 'demo-field-complete' : ''}`} key={field.label}>
                  <label>{field.label}</label>
                  <div className="demo-input">
                    <span>{field.value.slice(0, typed)}</span>
                    {typed < field.value.length && !reduceMotion && <i className="demo-caret" aria-hidden="true" />}
                    {isComplete && <motion.span className="demo-tick" initial={reduceMotion ? false : { scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 430, damping: 17 }} aria-label="Complete">✓</motion.span>}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="demo-progress-row"><span>Completion</span><strong>{percent}%</strong></div>
          <div className="demo-progress-track" role="progressbar" aria-label="Demo form completion" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
            <motion.div className="demo-progress-fill" animate={{ scaleX: percent / 100 }} transition={{ duration: reduceMotion ? 0 : 0.18, ease: 'linear' }} />
          </div>

          <div className="demo-footer">
            <div className="demo-safety"><span>✓</span> You review before submitting</div>
            <motion.div
              className="demo-bot-wrap"
              animate={complete && !reduceMotion ? { y: [0, -13, 0] } : { y: 0 }}
              transition={{ duration: 0.55, times: [0, 0.45, 1], ease: 'easeOut' }}
              key={`${run}-${complete ? 'done' : 'typing'}`}
            >
              <MimmyBot size={65} className="demo-buddy" mood={complete ? 'happy' : 'idle'} lookAt={eyeOffset} label={complete ? 'Mimmy Bot is happy the demo form is complete' : 'Mimmy Bot watches the demo form being filled'} />
            </motion.div>
          </div>

          {complete && !reduceMotion && (
            <div className="demo-confetti" aria-hidden="true" key={`confetti-${run}`}>
              {CONFETTI.map((piece) => <i key={piece} style={{ '--confetti-index': piece, '--confetti-x': `${(piece % 7 - 3) * 18}px`, '--confetti-y': `${-38 - (piece % 5) * 13}px` } as React.CSSProperties} />)}
            </div>
          )}
        </div>
      </div>
      <div className="demo-caption"><span className="demo-caption-sparkle">✦</span> A little help, right when you need it.</div>
    </motion.div>
  );
}
