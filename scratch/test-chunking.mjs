export function splitIntoChunks(text, maxLen = 150) {
  const trimmed = (text || '').trim();
  if (!trimmed) return [];
  if (trimmed.length <= maxLen) return [trimmed];

  // Comprehensive sentence & phrase delimiters across all supported scripts:
  // Indic: । (U+0964), ॥ (U+0965)
  // Arabic/Urdu: ۔ (U+06D4), ؟ (U+061F), ، (U+060C), ؛ (U+061B)
  // CJK: 。 (U+3002), ！ (U+FF01), ？ (U+FF1F), ； (U+FF1B), ， (U+FF0C), 、 (U+3001)
  // Latin & Standard: . ? ! ; : \n \r
  const delimiterRegex = /([^।॥۔؟،؛。！？；，、.?!\n\r;:,"'()]+[।॥۔؟،؛。！？；，、.?!\n\r;:,"'()]*)/gu;
  const segments = [];
  let match;

  while ((match = delimiterRegex.exec(trimmed)) !== null) {
    const s = match[0].trim();
    if (s) segments.push(s);
  }

  if (segments.length === 0) {
    segments.push(trimmed);
  }

  const atomicParts = [];
  for (const seg of segments) {
    if (seg.length <= maxLen) {
      atomicParts.push(seg);
    } else if (seg.includes(' ')) {
      const words = seg.split(/\s+/);
      let buf = '';
      for (const w of words) {
        if (!w) continue;
        if (buf.length + w.length + 1 <= maxLen) {
          buf = buf ? `${buf} ${w}` : w;
        } else {
          if (buf) atomicParts.push(buf);
          if (w.length > maxLen) {
            for (let i = 0; i < w.length; i += maxLen) {
              atomicParts.push(w.slice(i, i + maxLen));
            }
            buf = '';
          } else {
            buf = w;
          }
        }
      }
      if (buf) atomicParts.push(buf);
    } else {
      // Continuous text without spaces (e.g. Chinese, Japanese)
      // Use Array.from to avoid breaking surrogate pairs
      const chars = Array.from(seg);
      for (let i = 0; i < chars.length; i += maxLen) {
        atomicParts.push(chars.slice(i, i + maxLen).join(''));
      }
    }
  }

  const chunks = [];
  let currentChunk = '';
  for (const part of atomicParts) {
    if (!currentChunk) {
      currentChunk = part;
    } else if (currentChunk.length + part.length + 1 <= maxLen) {
      currentChunk += ' ' + part;
    } else {
      chunks.push(currentChunk.trim());
      currentChunk = part;
    }
  }
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

const testCases = {
  englishLong: 'This is a very long paragraph that goes on and on. It explains in great detail how the form works, what fields are required, and how the user should prepare their identity documents. Every sentence is carefully crafted to test whether our chunking algorithm preserves punctuation and avoids creating chunks that exceed the maximum length limit allowed by text-to-speech providers.',
  hindiLong: 'नमस्ते! यह टेकफॉर्म बडी है। आपकी हिन्दी आवाज़ सफलतापूर्वक सेट हो गई है। यह एक बहुत लंबा अनुच्छेद है जो यह जांचने के लिए लिखा गया है कि क्या हमारा एल्गोरिदम देवनागरी पूर्ण विराम यानी दंडा चिन्ह के आधार पर वाक्यों को ठीक से विभाजित करता है या नहीं। यदि वाक्य बहुत बड़ा है तो उसे शब्दों के आधार पर तोड़ा जाएगा।',
  arabicLong: 'مرحباً بكم في تيك فورم بودي! هذا النص العربي تم إعداده لاختبار تقسيم الجمل والفقرات الطويلة. هل تعمل علامات الترقيم العربية مثل علامة الاستفهام والفاصلة المنقوطة والنقطة بشكل سليم؟ نأمل أن يتم التقسيم بشكل ممتاز دون تجاوز الحد الأقصى للطول.',
  chineseContinuous: '这是一个非常长的连续中文字符串没有任何空格用来测试当中文句子非常长而且包含各种中文标点符号例如句号逗号感叹号时分块逻辑是否能正确工作。如果一个句子超过了一百五十个字符而且中间没有标点，它应该被安全地切分成多个不超过限定长度的块，从而避免语音合成接口因为单次请求过长而报错。',
  japaneseContinuous: 'これは非常に長い日本語の文章です。句読点を含みながら、１５０文字を超える場合にも適切に分割されるかをテストします。空白のない言語であっても、文字単位で安全に分割されるため、音声合成エンジンに送信する際にエラーが発生することはありません。',
  singleHugeWord: 'A'.repeat(320)
};

let allPass = true;
for (const [name, text] of Object.entries(testCases)) {
  const chunks = splitIntoChunks(text, 150);
  const oversized = chunks.filter(c => c.length > 150);
  console.log(`${name}: ${chunks.length} chunks. Max len: ${Math.max(...chunks.map(c => c.length))}. Oversized: ${oversized.length}`);
  if (oversized.length > 0) allPass = false;
}
console.log('All pass:', allPass);
