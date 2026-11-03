'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import MimmyBot from '@/components/MimmyBot';

const SCENES = [
  { step: '01', title: 'Upload', copy: 'Keep useful documents organized in one secure place.', icon: '↑' },
  { step: '02', title: 'Understand', copy: 'Get calm, readable guidance in the language you choose.', icon: 'अ' },
  { step: '03', title: 'Autofill', copy: 'Use available profile details for supported fields.', icon: '✳' },
  { step: '04', title: 'Review', copy: 'Check every suggested value before moving forward.', icon: '✓' },
  { step: '05', title: 'Submit', copy: 'You finish on the official portal and press Submit yourself.', icon: '↗' },
];

export default function HorizontalJourney() {
  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion || !sectionRef.current || !pinRef.current || !trackRef.current) return;
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add('(min-width: 860px) and (pointer: fine)', () => {
      const track = trackRef.current;
      const pin = pinRef.current;
      if (!track || !pin) return;
      gsap.to(track, {
        x: () => Math.min(0, pin.clientWidth - track.scrollWidth),
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          pin,
          start: 'top top+=72',
          end: () => `+=${Math.max(900, track.scrollWidth - pin.clientWidth)}`,
          scrub: .75,
          invalidateOnRefresh: true,
        },
      });
    });
    return () => media.revert();
  }, [reduceMotion]);

  return (
    <section ref={sectionRef} className="cinema-journey" aria-label="Five steps of a supported form journey">
      <div className="cinema-journey-pin" ref={pinRef}>
        <div className="cinema-journey-heading">
          <span className="landing-kicker">A guided journey</span>
          <h2>One step at a time.</h2>
          <span className="cinema-journey-hint">Scroll to explore <b aria-hidden="true">↓</b></span>
        </div>
        <div className="cinema-journey-viewport">
          <div className="cinema-journey-track" ref={trackRef}>
            {SCENES.map((scene, index) => (
              <article className="cinema-journey-card" key={scene.step}>
                <div className="cinema-journey-card-top"><span>{scene.step} / 05</span><i /></div>
                <div className="cinema-journey-icon" aria-hidden="true">{scene.icon}</div>
                <span className="cinema-journey-kicker">YOUR FORM STORY</span>
                <h3>{scene.title}</h3>
                <p>{scene.copy}</p>
                <div className="cinema-journey-line"><i style={{ transform: `scaleX(${(index + 1) / SCENES.length})` }} /></div>
                {index === 2 && <MimmyBot className="cinema-journey-mimmy" size={68} mood="happy" interactive={false} label="Mimmy watches over the autofill step" />}
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
