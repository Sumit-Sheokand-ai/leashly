const fs = require('fs');
const path = require('path');
const b64 = require('fs').readFileSync(path.join(__dirname, 'og-image.b64'), 'utf8').trim();
fs.writeFileSync(
  path.join(__dirname, 'public', 'og-image.png'),
  Buffer.from(b64, 'base64')
);
console.log('✓ Written: public/og-image.png');
