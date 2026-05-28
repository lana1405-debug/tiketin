const fs = require('fs');
const lines = fs.readFileSync('app/explore/page.tsx', 'utf8').split('\n');
lines.forEach((line, idx) => {
  if (line.includes('setChatOpen') || line.includes('chatOpen') || line.includes('ChatDrawer')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
