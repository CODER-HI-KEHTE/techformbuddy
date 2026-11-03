import Link from 'next/link';
import './landing.css';
import '@/components/landing/landing-experience.css';
import '@/components/landing/landing-delight.css';
import '@/components/cinema/cinema-chapters.css';
import '@/components/cinema/cinema-scenes.css';
import '@/components/cinema/section-background-blend.css';
import type { Metadata } from 'next';
import { FeatureCard, FeatureGrid, LandingHero, MotionReveal } from '@/components/LandingMotion';
import AnimatedHeadline from '@/components/landing/AnimatedHeadline';
import CinemaIntro from '@/components/cinema/CinemaIntro';
import CinemaAtmosphere from '@/components/cinema/CinemaAtmosphere';
import ChapterIndicator from '@/components/cinema/ChapterIndicator';
import CreditsReel from '@/components/cinema/CreditsReel';
import DepthParallax from '@/components/cinema/DepthParallax';
import HorizontalJourney from '@/components/cinema/HorizontalJourney';
import KineticHeading from '@/components/cinema/KineticHeading';
import FooterCelebration from '@/components/landing/FooterCelebration';
import FeatureStory from '@/components/landing/FeatureStory';
import LanguageMarquee from '@/components/landing/LanguageMarquee';
import LandingAtmosphere from '@/components/landing/LandingAtmosphere';
import LandingMetrics from '@/components/landing/LandingMetrics';
import LandingScrollEffects from '@/components/landing/LandingScrollEffects';
import LiveFormDemo from '@/components/landing/LiveFormDemo';
import MagneticCTA from '@/components/landing/MagneticCTA';
import ScrambleSubtitle from '@/components/cinema/ScrambleSubtitle';
import RotatingLanguageChip from '@/components/landing/RotatingLanguageChip';
import SectionWave from '@/components/landing/SectionWave';
import SecurityShield from '@/components/landing/SecurityShield';
import SparkleTrail from '@/components/landing/SparkleTrail';
import SmoothScroll from '@/components/landing/SmoothScroll';
import WordReveal from '@/components/landing/WordReveal';
import MimmyBot from '@/components/MimmyBot';

export const metadata: Metadata = {
  title: 'TechForm Buddy — Multilingual AI Form Assistant',
  description: 'Get multilingual form guidance, manage drafts, and assist with supported form fields. Review and submit forms yourself.',
};

export default function LandingPage() {
  return (
    <div className="landing">
      <CinemaIntro />
      <CinemaAtmosphere />
      <ChapterIndicator />
      <DepthParallax />
      <SmoothScroll />
      <LandingScrollEffects />
      <SparkleTrail />
      {/* Header */}
      <header className="landing-header">
        <div className="landing-nav container">
          <div className="landing-brand">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <defs><linearGradient id="landing-brand-gradient" x1="0" y1="0" x2="32" y2="32"><stop stopColor="var(--cherry-bright)"/><stop offset=".52" stopColor="var(--cherry)"/><stop offset="1" stopColor="var(--cherry-deep)"/></linearGradient></defs>
              <rect width="32" height="32" rx="8" fill="url(#landing-brand-gradient)"/>
              <path d="M8 12h16M8 16h12M8 20h14M22 10l4 4-4 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>TechForm Buddy</span>
          </div>
          <div className="landing-actions">
            <Link href="/login" className="btn btn-ghost">Sign in</Link>
            <Link href="/register" className="btn btn-primary">Get Started</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <LandingHero>
        <LandingAtmosphere />
        <div className="hero-blob hero-blob-cherry" aria-hidden="true" />
        <div className="hero-blob hero-blob-blush" aria-hidden="true" />
        <div className="container">
          <div className="hero-layout">
            <div className="hero-content">
              <MotionReveal as="span" className="hero-badge" delay={0.12}>
                <span className="hero-badge-dot" /> Multilingual AI-Powered
              </MotionReveal>
              <AnimatedHeadline />
              <MotionReveal className="hero-promise" delay={0.25}>
                <span className="hero-promise-label">Your forms, made simple:</span> <ScrambleSubtitle />
              </MotionReveal>
              <WordReveal text="TechForm Buddy helps you understand and complete forms in your language. Review every suggestion, keep sensitive details in your hands, and submit on the official site yourself." />
              <MotionReveal className="hero-actions" delay={0.36}>
                <MagneticCTA />
                <Link href="/login" className="btn btn-secondary btn-lg">Sign in</Link>
              </MotionReveal>
              <div className="hero-trust-row">
                <span><i /> You stay in control</span>
                <span><i /> Sensitive fields stay manual</span>
              </div>
            </div>
            <div className="hero-visual">
              <div className="hero-visual-glow" />
              <LiveFormDemo />
              <RotatingLanguageChip />
              <div className="floating-note floating-note-safe"><span>✓</span> You review everything before submitting</div>
            </div>
          </div>
        </div>
      </LandingHero>
      <SectionWave tone="cherry" />

      {/* Features */}
      <section id="features" className="features" data-mimmy-mood="happy">
        <div className="container">
          <div className="features-header">
            <KineticHeading text="Everything you need, nothing you don’t." />
            <p>Support that keeps your choices, your details, and your time in your hands.</p>
          </div>
          <FeatureStory />
          <HorizontalJourney />
          <LanguageMarquee />
          <FeatureGrid className="features-grid">
            <FeatureCard className="feature-card glass-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
              </div>
              <h3>Voice Input</h3>
              <p>Speak in your native language. The app understands and fills forms for you.</p>
            </FeatureCard>
            <FeatureCard className="feature-card glass-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
              </div>
              <h3>17+ Languages</h3>
              <p>Support for Hindi, Tamil, Telugu, Bengali, and many more Indian and global languages.</p>
            </FeatureCard>
            <FeatureCard className="feature-card glass-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              </div>
              <h3>Document Upload</h3>
              <p>Store documents encrypted. File contents are not currently analyzed or used for autofill.</p>
            </FeatureCard>
            <FeatureCard className="feature-card glass-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              </div>
              <h3>Smart Auto-fill</h3>
              <p>Use available profile data for supported fields, review each suggestion, and leave unknown or sensitive fields blank.</p>
            </FeatureCard>
            <FeatureCard className="feature-card glass-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </div>
              <h3>Form Watch</h3>
              <p>Search supported sources and receive alerts when a notice is detected. Always verify details on the official portal.</p>
            </FeatureCard>
            <FeatureCard className="feature-card glass-card extension-feature-card">
              <div className="feature-icon">
                <MimmyBot size={72} className="feature-buddy" mood="happy" label="Mimmy Bot mascot" />
              </div>
              <h3>Meet the Buddy Extension</h3>
              <p>Bring friendly, careful form guidance to your browser. Review every suggested value; Buddy never submits forms for you.</p>
              <Link href="/extension" className="feature-link">Meet your browser buddy <span aria-hidden="true">↗</span></Link>
            </FeatureCard>
            <FeatureCard className="feature-card glass-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /></svg>
              </div>
              <h3>Real-Time Reading (Audio)</h3>
              <p>Listen to forms read aloud in your native language. Hear questions and spoken answers clearly.</p>
            </FeatureCard>
            <FeatureCard className="feature-card glass-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2a8 8 0 0 0-8 8c0 3.3 2 6.2 5 7.4V20a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-2.6c3-1.2 5-4.1 5-7.4a8 8 0 0 0-8-8z"/><path d="M10 10h4"/></svg>
              </div>
              <h3>Domain Automation Hub</h3>
              <p>Instant guidance, document checklists, and grievance tracking across Government, Healthcare, Banking, and Education.</p>
            </FeatureCard>
          </FeatureGrid>
        </div>
      </section>
      <SectionWave tone="blush" />

      <div id="metrics"><LandingMetrics /></div>

      <SectionWave tone="cherry" />
      <section id="security" className="landing-security" data-mimmy-mood="thinking">
        <div className="container">
          <div className="landing-security-card">
            <SecurityShield />
            <div>
              <p className="landing-kicker">Your information stays yours</p>
              <KineticHeading text="Helpful, without taking over." />
              <p>Review every suggestion on the official page. Sensitive details stay manual, and you press Submit yourself.</p>
            </div>
            <div className="landing-security-points">
              <span><i /> Review before submitting</span>
              <span><i /> No automatic form submission</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="credits" className="landing-footer" data-mimmy-mood="sleepy">
        <div className="container">
          <FooterCelebration />
          <CreditsReel />
          <div className="footer-content">
            <div className="landing-brand">
              <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
                <defs><linearGradient id="landing-footer-gradient" x1="0" y1="0" x2="32" y2="32"><stop stopColor="var(--cherry-bright)"/><stop offset=".52" stopColor="var(--cherry)"/><stop offset="1" stopColor="var(--cherry-deep)"/></linearGradient></defs>
                <rect width="32" height="32" rx="8" fill="url(#landing-footer-gradient)"/>
                <path d="M8 12h16M8 16h12M8 20h14M22 10l4 4-4 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>TechForm Buddy</span>
            </div>
            <p className="text-xs text-muted">Multilingual AI Form Assistant</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
