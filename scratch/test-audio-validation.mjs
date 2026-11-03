function isValidAudioBuffer(buf) {
  if (!buf || buf.byteLength < 32) return false;
  const prefix = String.fromCharCode(...buf.slice(0, 16)).trim().toLowerCase();
  if (prefix.startsWith('<') || prefix.startsWith('{') || prefix.startsWith('[') || prefix.includes('html') || prefix.includes('doctype')) {
    return false;
  }
  const b0 = buf[0];
  const b1 = buf[1];
  const b2 = buf[2];
  const isID3 = b0 === 0x49 && b1 === 0x44 && b2 === 0x33;
  const isMPEGSync = b0 === 0xff && (b1 & 0xe0) === 0xe0;
  const isWAV = b0 === 0x52 && b1 === 0x49 && b2 === 0x46;
  const isOGG = b0 === 0x4f && b1 === 0x67 && b2 === 0x67;
  return isID3 || isMPEGSync || isWAV || isOGG;
}

const validMp3 = Buffer.from([0xff, 0xf3, 0x84, 0xc4, ...new Array(30).fill(0)]);
const html = Buffer.from('<!DOCTYPE html><html><body>Error</body></html>');
const json = Buffer.from('{"error": "Failed to synthesize audio"}');
const empty = Buffer.from([]);

console.log('validMp3:', isValidAudioBuffer(validMp3));
console.log('html:', isValidAudioBuffer(html));
console.log('json:', isValidAudioBuffer(json));
console.log('empty:', isValidAudioBuffer(empty));
