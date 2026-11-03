import Link from 'next/link';
import BuddyBot from '@/components/BuddyBot';
import './extension.css';

export default function ExtensionIndexPage() {
  return (
    <main className="extension-welcome-page">
      <section className="extension-welcome-card glass-card">
        <div className="extension-welcome-copy">
          <span className="extension-welcome-kicker">Meet your browser buddy</span>
          <h1 className="extension-welcome-title">A little help.<br /><span>A lot more confidence.</span></h1>
          <p className="extension-welcome-description">
            The TechForm Buddy browser extension can guide you through supported form fields on the real website. You stay in control: review every suggestion and submit the form yourself.
          </p>
          <div className="extension-welcome-actions">
            <Link href="/extension/connect" className="btn btn-primary btn-lg">Connect Buddy</Link>
            <Link href="/browser" className="btn btn-secondary btn-lg">Explore portal launcher</Link>
          </div>
          <p className="extension-safety-note">Passwords, OTPs, sensitive identity fields, and payment details must always be entered by you.</p>
        </div>
        <div className="extension-welcome-art">
          <BuddyBot size={270} label="Friendly TechForm Buddy extension mascot" />
        </div>
      </section>
    </main>
  );
}
