'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';
import ThemeToggle from '@/components/ThemeToggle';
import PageTransition from '@/components/PageTransition';
import { MotionConfig } from 'framer-motion';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <MotionConfig reducedMotion="user">
        <PageTransition>{children}</PageTransition>
        <ThemeToggle />
      </MotionConfig>
    </SessionProvider>
  );
}
