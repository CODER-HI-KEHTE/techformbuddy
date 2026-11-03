'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export default function KineticHeading({ text, className = '' }: { text: string; className?: string }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const reduceMotion = useReducedMotion();
  const words = text.split(/\s+/);

  useEffect(() => {
    if (reduceMotion || !headingRef.current) return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      const wordEls = headingRef.current?.querySelectorAll<HTMLElement>('.kinetic-word');
      if (!wordEls?.length) return;
      gsap.fromTo(wordEls,
        { yPercent: 105, autoAlpha: 0 },
        {
          yPercent: 0,
          autoAlpha: 1,
          duration: .72,
          stagger: .075,
          ease: 'power3.out',
          scrollTrigger: { trigger: headingRef.current, start: 'top 84%', once: true },
        },
      );
    }, headingRef);
    return () => ctx.revert();
  }, [reduceMotion]);

  return (
    <h2 ref={headingRef} className={`kinetic-heading ${className}`.trim()} aria-label={text}>
      {words.map((word, index) => (
        <span className="kinetic-word-clip" key={`${word}-${index}`} aria-hidden="true">
          <span className="kinetic-word">{word}{index < words.length - 1 ? '\u00a0' : ''}</span>
        </span>
      ))}
    </h2>
  );
}
