'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import MimmyBot from '@/components/MimmyBot';
import { CINEMA_INTRO_SESSION_KEY } from '@/components/cinema/CinemaIntro';

export default function CreditsReel() {
  const sectionRef = useRef<HTMLElement>(null);
  const rollRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion || !sectionRef.current || !rollRef.current) return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.fromTo(rollRef.current, { yPercent: 70 }, {
        yPercent: -105,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: .8,
        },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, [reduceMotion]);

  const replay = () => {
    try { sessionStorage.removeItem(CINEMA_INTRO_SESSION_KEY); } catch { /* storage may be blocked */ }
    window.location.reload();
  };

  return (
    <section ref={sectionRef} className="cinema-credits" aria-label="Production credits">
      <div className="cinema-credits-sticky">
        <div className="cinema-credits-roll" ref={rollRef}>
          <span className="cinema-credits-kicker">A little more confidence, for everyone</span>
          <h2>TECHFORM BUDDY</h2>
          <p>Directed by</p>
          <strong>TECH YODHA</strong>
          <p>Created with</p>
          <strong className="cinema-credits-team">Your team · Your ideas · Your courage</strong>
          <p>Made at</p>
          <strong>INDUX 5.0</strong>
          <span>Vikrant University</span>
          <MimmyBot className="cinema-credits-mimmy" size={112} mood="waving" interactive={false} label="Mimmy celebrates the end credits" />
          <span className="cinema-credits-the-end">The end. Your story continues.</span>
          <button type="button" className="btn btn-secondary cinema-replay" onClick={replay}>↺ Replay intro</button>
        </div>
      </div>
    </section>
  );
}
