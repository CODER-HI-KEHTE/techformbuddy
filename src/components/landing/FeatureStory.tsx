'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const STEPS = [
  {
    eyebrow: '01 / UNDERSTAND',
    title: 'Make every question feel familiar.',
    description: 'Read supported form labels in your language and get calm, contextual guidance as you go.',
    screenTitle: 'Language assistance',
    screenBody: 'Choose the language that feels right to you.',
    screenDetail: 'हिंदी  ·  मराठी  ·  தமிழ்',
    icon: 'अ',
  },
  {
    eyebrow: '02 / COMPLETE',
    title: 'Use your voice, at your pace.',
    description: 'Speak naturally, review suggested values, and keep sensitive details in your hands.',
    screenTitle: 'Voice input ready',
    screenBody: 'Tell Buddy what you would like help with.',
    screenDetail: 'Listening is always started by you',
    icon: '◖',
  },
  {
    eyebrow: '03 / REVIEW',
    title: 'You stay in control at every step.',
    description: 'Check every field on the official site. Buddy never submits a form for you.',
    screenTitle: 'Ready for your review',
    screenBody: 'Your answers are suggestions, not a submission.',
    screenDetail: 'Review first · Submit yourself',
    icon: '✓',
  },
];

export default function FeatureStory() {
  const storyRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(0);
  const reduceMotion = useReducedMotion();
  const step = STEPS[activeStep];

  useEffect(() => {
    if (reduceMotion || !storyRef.current || !stageRef.current) return;
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add('(min-width: 860px) and (pointer: fine)', () => {
      const progressFill = storyRef.current?.querySelector<HTMLElement>('.story-screen-progress i');
      gsap.fromTo(stageRef.current, { clipPath: 'inset(0 100% 0 0)', scale: 1.035 }, {
        clipPath: 'inset(0 0% 0 0)',
        scale: 1,
        duration: .85,
        ease: 'power2.out',
        scrollTrigger: { trigger: storyRef.current, start: 'top 68%', once: true },
      });
      ScrollTrigger.create({
        trigger: storyRef.current,
        pin: stageRef.current,
        start: 'top top+=105',
        end: 'bottom bottom-=60',
        scrub: .65,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const index = Math.min(STEPS.length - 1, Math.floor(self.progress * STEPS.length));
          setActiveStep((current) => current === index ? current : index);
          if (progressFill) gsap.set(progressFill, { scaleX: self.progress });
        },
      });
    });
    return () => media.revert();
  }, [reduceMotion]);

  return (
    <div className="feature-story" ref={storyRef}>
      <div className="feature-story-copy">
        <p className="landing-kicker">A little help, all the way through</p>
        <h2>Forms that make more sense.</h2>
        <div className="feature-story-steps">
          {STEPS.map((item, index) => (
            <motion.article
              key={item.eyebrow}
              className={`feature-story-step ${activeStep === index ? 'is-active' : ''}`}
              onViewportEnter={() => setActiveStep(index)}
              viewport={{ amount: 0.55, margin: '-35% 0px -35% 0px' }}
              initial={false}
              animate={reduceMotion ? { opacity: 1 } : { opacity: activeStep === index ? 1 : 0.52, x: activeStep === index ? 0 : 7 }}
              transition={{ duration: reduceMotion ? 0 : 0.3 }}
            >
              <span className="feature-story-eyebrow">{item.eyebrow}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </motion.article>
          ))}
        </div>
      </div>
      <div className="feature-story-stage" aria-live="polite" ref={stageRef}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            className="feature-story-mockup"
            key={step.screenTitle}
            initial={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -8, scale: 0.99 }}
            transition={{ duration: reduceMotion ? 0 : 0.28 }}
          >
            <div className="story-window-bar"><i /><i /><i /><span>techformbuddy.app / guide</span></div>
            <div className="story-screen-content">
              <div className="story-screen-icon">{step.icon}</div>
              <span className="story-screen-kicker">TECHFORM BUDDY</span>
              <h3>{step.screenTitle}</h3>
              <p>{step.screenBody}</p>
              <div className="story-screen-detail">{step.screenDetail}</div>
              <div className="story-screen-progress"><i style={{ transform: `scaleX(${(activeStep + 1) / STEPS.length})` }} /></div>
            </div>
            <div className="story-screen-caption"><span>●</span> You are always in charge</div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
