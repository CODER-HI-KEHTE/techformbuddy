const LANGUAGES = ['हिंदी · Hindi', 'मराठी · Marathi', 'தமிழ் · Tamil', 'বাংলা · Bengali', 'తెలుగు · Telugu', 'ગુજરાતી · Gujarati', 'ಕನ್ನಡ · Kannada', 'ਪੰਜਾਬੀ · Punjabi'];

export default function LanguageMarquee() {
  const loop = [...LANGUAGES, ...LANGUAGES];
  return (
    <section className="language-marquee" aria-label="Languages supported by TechForm Buddy">
      <div className="language-marquee-heading">Help that speaks your language</div>
      <div className="language-marquee-viewport">
        {[0, 1].map((row) => (
          <div className={`language-marquee-track language-marquee-track-${row + 1}`} key={row}>
            {loop.map((language, index) => (
              <span className="language-marquee-item" key={`${language}-${index}`} aria-hidden={row === 1 || index >= LANGUAGES.length}>
                <i aria-hidden="true">✦</i>{language}
              </span>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
