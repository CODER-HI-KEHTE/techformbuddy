'use client';

import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

const LINES = [
  { text: 'हिंदी में मदद', chars: 'अआइईउऊकखगघचछजझटठ' },
  { text: 'मराठीत मदत', chars: 'अआइईउऊकखगघचछजझटठ' },
  { text: 'தமிழில் உதவி', chars: 'அஆஇஈஉஊகஙசஞடண' },
  { text: 'বাংলায় সহায়তা', chars: 'অআইঈউঊকখগঘচছজঝ' },
];

export default function ScrambleSubtitle() {
  const [active, setActive] = useState(0);
  const [display, setDisplay] = useState(LINES[0].text);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;
    let languageIndex = 0;
    let scrambleTimer = 0;
    const interval = window.setInterval(() => {
      languageIndex = (languageIndex + 1) % LINES.length;
      setActive(languageIndex);
      const target = LINES[languageIndex];
      const steps = 7;
      let step = 0;
      window.clearInterval(scrambleTimer);
      scrambleTimer = window.setInterval(() => {
        step += 1;
        const decoded = target.text.split('').map((character, index) => {
          if (character === ' ' || index < Math.floor((step / steps) * target.text.length)) return character;
          return target.chars[Math.floor(Math.random() * target.chars.length)];
        }).join('');
        setDisplay(decoded);
        if (step >= steps) {
          setDisplay(target.text);
          window.clearInterval(scrambleTimer);
        }
      }, 42);
    }, 2900);
    return () => {
      window.clearInterval(interval);
      window.clearInterval(scrambleTimer);
    };
  }, [reduceMotion]);

  return (
    <span className="cinema-scramble" aria-live="polite" aria-label={LINES[active].text}>
      <span className="cinema-scramble-cursor" aria-hidden="true">▌</span>{display}
    </span>
  );
}
