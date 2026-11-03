'use client';

import MimmyBot from '@/components/MimmyBot';
import type { MotionValue } from 'framer-motion';

interface BuddyBotProps {
  size?: number;
  className?: string;
  label?: string;
  eyeOffset?: { x: number | MotionValue<number>; y: number | MotionValue<number> };
}

/** Legacy-compatible wrapper so existing extension/navigation placements use the original Mimmy mascot. */
export default function BuddyBot({ size = 180, className = '', label = 'Buddy Bot mascot', eyeOffset }: BuddyBotProps) {
  return (
    <MimmyBot
      size={size}
      className={className}
      label={label}
      eyeOffset={eyeOffset}
      mood="idle"
    />
  );
}
