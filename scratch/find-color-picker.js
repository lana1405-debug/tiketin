const fs = require('fs');
const lines = fs.readFileSync('app/explore/profile/page.tsx', 'utf8').split('\n');
lines.forEach((line, idx) => {
  if (line.includes('color') || line.includes('primary') || line.includes('palette') || line.includes('primaryColor')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
