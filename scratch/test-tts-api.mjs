const baseUrl = 'http://localhost:3000/api/tts';

async function testEndpoint() {
  console.log('--- Testing /api/tts Endpoint ---');

  // Test 1: Empty text
  const rEmpty = await fetch(baseUrl + '?lang=en&text=');
  console.log('Empty text status:', rEmpty.status, await rEmpty.json());

  // Test 2: Invalid language
  const rInvalid = await fetch(baseUrl + '?lang=xyz123&text=Hello');
  console.log('Invalid language status:', rInvalid.status, await rInvalid.json());

  // Test 3: POST request with Unicode in Hindi
  const rPostHindi = await fetch(baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lang: 'hi', text: 'नमस्ते! यह टेकफॉर्म बडी की बहुभाषी आवाज़ प्रणाली का परीक्षण है।' })
  });
  console.log('POST Hindi status:', rPostHindi.status, 'Content-Type:', rPostHindi.headers.get('content-type'), 'Provider:', rPostHindi.headers.get('x-tts-provider'), 'Bytes:', (await rPostHindi.arrayBuffer()).byteLength);

  // Test 4: Long text multi-chunk test in Tamil
  const longTamil = 'வணக்கம்! இது டெக்ஃபார்ம் படி. உங்கள் தமிழ் குரல் வெற்றிகரமாக அமைக்கப்பட்டது. படிவங்களை நிரப்புவதற்கும் அரசாங்க சேவைகளைப் பெறுவதற்கும் நீங்கள் இந்த அமைப்பைப் பயன்படுத்தலாம். அனைத்து தகவல்களும் பாதுகாப்பாக சேமிக்கப்படும்.';
  const rLongTamil = await fetch(baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lang: 'ta-IN', text: longTamil })
  });
  console.log('POST Long Tamil status:', rLongTamil.status, 'Chunks:', rLongTamil.headers.get('x-tts-chunks'), 'Bytes:', (await rLongTamil.arrayBuffer()).byteLength);

  // Test 5: All 17 languages brief check
  const testPhrases = {
    en: 'Hello world',
    hi: 'नमस्ते दुनिया',
    ta: 'வணக்கம் உலகம்',
    te: 'నమస్కారం ప్రపంచం',
    bn: 'নমস্কার বিশ্ব',
    mr: 'नमस्कार जग',
    gu: 'નમસ્તે વિશ્વ',
    kn: 'ನಮಸ್ಕಾರ ವಿಶ್ವ',
    ml: 'നമസ്കാരം ലോകമേ',
    pa: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਦੁਨਿਆ',
    ur: 'ہیلو دنیا',
    es: 'Hola mundo',
    fr: 'Bonjour le monde',
    de: 'Hallo Welt',
    ar: 'مرحبا بالعالم',
    zh: '你好世界',
    ja: 'こんにちは世界'
  };

  let allPass = true;
  for (const [lang, phrase] of Object.entries(testPhrases)) {
    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lang, text: phrase })
    });
    const bytes = (await res.arrayBuffer()).byteLength;
    if (res.status !== 200 || bytes < 100) {
      console.error(`FAILED for ${lang}: status=${res.status}, bytes=${bytes}`);
      allPass = false;
    } else {
      console.log(`✓ ${lang.toUpperCase()}: status=${res.status}, bytes=${bytes}, provider=${res.headers.get('x-tts-provider')}`);
    }
  }

  console.log('\nAll 17 languages passed live API test:', allPass);
}

testEndpoint().catch(console.error);
