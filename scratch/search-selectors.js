const fs = require('fs');
const path = require('path');

const patterns = [
  /:has-text/,
  /:text\(/,
  /:visible/,
  /:has\(/, // Note: standard CSS :has() might exist, but let's check
  /querySelector(All)?\([^)]*>>/
];

function searchDir(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.next' && entry.name !== '.git' && entry.name !== 'test-results') {
        searchDir(fullPath);
      }
    } else if (/\.(ts|tsx|js|mjs)$/.test(entry.name) && !entry.name.includes('.spec.')) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      for (const p of patterns) {
        if (p.test(content)) {
          console.log(`Match ${p} in:`, fullPath);
          const lines = content.split('\n');
          lines.forEach((l, i) => {
            if (p.test(l)) {
              console.log(`  Line ${i + 1}: ${l.trim()}`);
            }
          });
        }
      }
    }
  }
}

searchDir('src');
searchDir('packages');
