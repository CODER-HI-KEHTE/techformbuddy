'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const CHAPTERS = [
  { id: 'intro', title: 'Intro' },
  { id: 'features', title: 'Features' },
  { id: 'metrics', title: 'Impact' },
  { id: 'security', title: 'Security' },
  { id: 'credits', title: 'Credits' },
];

export default function ChapterIndicator() {
  const [active, setActive] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const nodes = CHAPTERS.map(({ id }) => document.getElementById(id)).filter((node): node is HTMLElement => Boolean(node));
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      const index = CHAPTERS.findIndex(({ id }) => id === visible.target.id);
      if (index >= 0) setActive(index);
    }, { rootMargin: '-38% 0px -38% 0px', threshold: [0.05, 0.25, 0.55] });
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  return (
    <nav className="cinema-chapter-nav" aria-label="Page chapters">
      <div className="cinema-chapter-rail" aria-hidden="true">
        <motion.span animate={{ scaleY: (active + 1) / CHAPTERS.length }} transition={{ duration: reduceMotion ? 0 : .25 }} />
      </div>
      {CHAPTERS.map((chapter, index) => (
        <a
          href={`#${chapter.id}`}
          className={index === active ? 'is-active' : ''}
          aria-current={index === active ? 'location' : undefined}
          key={chapter.id}
        >
          <span className="cinema-chapter-number">0{index + 1}</span>
          <span className="cinema-chapter-title">{chapter.title}</span>
        </a>
      ))}
    </nav>
  );
}
