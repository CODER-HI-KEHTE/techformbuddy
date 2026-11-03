# SPEC.md — Landing Experience and Mimmy Bot

> **Status**: `FINALIZED`

## Vision
Improve TechForm Buddy's public landing page and in-app floating assistant with an original, accessible mascot and cohesive motion while preserving existing assistant behavior.

## Goals
1. Replace the compact floating assistant face with a reusable original SVG mascot; preserve Page Guide, voice, autofill, hide, and expand/collapse behavior.
2. Add scroll-reactive landing-page storytelling, supporting motion, and the same mascot in the form demo.
3. Fix the heading spacing and safe-note overlap.

## Non-Goals
- Do not modify API routes, authentication, or any code under `packages/extension`.
- Do not change assistant/autofill business logic or add external imagery.

## Constraints
- Use Next.js App Router, TypeScript, existing Framer Motion and Lenis dependencies.
- Keep animation to transform/opacity where practical, reduce effects on mobile, and respect `prefers-reduced-motion`.
- Keep new landing features in focused components under `src/components/landing/` and the mascot at `src/components/MimmyBot.tsx`.

## Success Criteria
- [ ] Floating assistant opens from a 64px mascot dot and closes back to it; controls preserve existing handlers.
- [ ] Original inline SVG mascot supports idle, happy, thinking, waving, and sleepy moods, gaze, blink, hover, and click effects.
- [ ] Hero demo uses the mascot and heading reads “In your language.”
- [ ] Landing page includes scroll progress/parallax, sticky feature storytelling, card interactions, language marquee, counters, section accents, and cursor sparkles.
- [ ] Reduced-motion and mobile fallbacks are present.
- [ ] Lint/build or targeted type validation passes without editing prohibited areas.

*Last updated: 2026-11-02*
