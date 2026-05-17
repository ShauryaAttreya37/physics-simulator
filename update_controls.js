/* global require, __dirname */
const fs = require('fs');
const path = require('path');

function getFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getFiles(filePath, fileList);
    } else if (file.endsWith('.js')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const files = getFiles(path.join(__dirname, 'src/simulations'));
let totalChanges = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // 1. Replace boolean-like controls with toggle
  // Before: { key: 'showVectors', label: 'Vectors', min: 0, max: 1, step: 1 }
  // After: { key: 'showVectors', label: 'Vectors', type: 'toggle' }
  content = content.replace(
    /\{([^}]+)min:\s*0\s*,\s*max:\s*1\s*,\s*step:\s*1([^}]*)\}/g,
    (match, before, after) => {
      if (before.includes('type:')) return match;
      // Most 0/1 integer controls in these simulations are display toggles.
      return `{${before}type: 'toggle'${after}}`;
    },
  );

  // 2. Add counter type for discrete counts
  content = content.replace(
    /\{([^}]+key:\s*'([^']+)'[^}]+step:\s*1[^}]*)\}/g,
    (match, inner, key) => {
      if (inner.includes('type:')) return match;

      // Test if key implies an integer counter
      const isCount =
        /^(num|count|N|n|particles|charges|turns|loops)$/i.test(key) ||
        key.includes('Count') ||
        key.includes('Number');

      if (isCount) {
        return match.replace(/(label:\s*'[^']+',)/, `$1 type: 'counter',`);
      }
      return match;
    },
  );

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log('Updated ' + path.basename(file));
    totalChanges++;
  }
}
console.log('Total files updated: ' + totalChanges);
