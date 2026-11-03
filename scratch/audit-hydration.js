const fs = require('fs');
const path = require('path');

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  let inEffectOrCallback = 0;
  let inRender = true;

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('/*')) return;
    
    // Check if line accesses window or localStorage outside functions or at top level of component
    if (/typeof window !== ['"]undefined['"]/.test(trimmed)) {
      console.log(`Potential window check during render: ${filePath}:${idx + 1}: ${trimmed}`);
    } else if (/(window\.|localStorage\.|sessionStorage\.)/.test(trimmed)) {
      // Check if this is within useEffect or useCallback or event handler
      // We will print for manual inspection
      if (!trimmed.includes('useEffect') && !trimmed.includes('useCallback')) {
        // print if it might be top level
        if (/const |let |var |return |if \(/.test(trimmed) && !trimmed.includes('() =>') && !trimmed.includes('function')) {
          console.log(`Direct access: ${filePath}:${idx + 1}: ${trimmed}`);
        }
      }
    }
  });
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!['node_modules', '.next', '.git', 'dist'].includes(entry.name)) {
        walk(p);
      }
    } else if (/\.(tsx|jsx)$/.test(entry.name)) {
      checkFile(p);
    }
  }
}

walk('src/app');
walk('src/components');

