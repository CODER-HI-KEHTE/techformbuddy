const fs = require('fs');
const path = require('path');

function search(dir) {
  for (const f of fs.readdirSync(dir, {withFileTypes: true})) {
    const p = path.join(dir, f.name);
    if (f.isDirectory() && !['node_modules', '.next', '.git'].includes(f.name)) search(p);
    else if (/\.(tsx|jsx)$/.test(f.name)) {
      const c = fs.readFileSync(p, 'utf8');
      const lines = c.split('\n');
      lines.forEach((l, idx) => {
        // Look for localStorage/sessionStorage/navigator/window accessed outside useEffect/useCallback/handlers
        if (/localStorage|sessionStorage|navigator\.|window\./.test(l)) {
          // let's print the line and file
          console.log(`${p}:${idx + 1}: ${l.trim()}`);
        }
      });
    }
  }
}
search('src');

