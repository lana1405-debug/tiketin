const fs = require('fs');
const lines = fs.readFileSync('app/explore/page.tsx', 'utf8').split('\n');
lines.forEach((line, idx) => {
  if (line.includes('userProfile') && line.includes('useState')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
