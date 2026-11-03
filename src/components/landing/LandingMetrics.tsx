'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';

const METRICS = [
  { value: 17, suffix: '+', label: 'languages supported' },
  { value: 0, suffix: '', label: 'forms submitted automatically' },
  { value: 100, suffix: '%', label: 'you stay in control' },
];

function Metric({ value, suffix, label }: (typeof METRICS)[number]) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduceMotion = useReducedMotion();
  const [count, setCount] = useState(reduceMotion ? value : 0);

  useEffect(() => {
    if (!inView) return;
    if (reduceMotion || value === 0) {
      setCount(value);
      return;
    }
    const duration = 900;
    let animationFrame = 0;
    const start = performance.now();
    const update = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - progress) ** 3;
      setCount(Math.round(value * eased));
      if (progress < 1) animationFrame = requestAnimationFrame(update);
    };
    animationFrame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrame);
  }, [inView, reduceMotion, value]);

  return (
    <motion.div ref={ref} className="landing-metric" initial={reduceMotion ? false : { opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
      <div className="landing-metric-value">{count}{suffix}</div>
      <div className="landing-metric-label">{label}</div>
    </motion.div>
  );
}

export default function LandingMetrics() {
  return (
    <section className="landing-metrics-section" aria-label="TechForm Buddy at a glance">
      <div className="container landing-metrics">
        {METRICS.map((metric, index) => <Metric key={metric.label} {...metric} />)}
      </div>
    </section>
  );
}
