const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../app/meetings/page.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// Find and fix the line with extra closing parenthesis
const lines = content.split('\n');
let fixed = false;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim() === ')}' && !fixed && i > 660 && i < 670) {
    // Check if previous line ends with closing brace
    if (lines[i-1].trim().endsWith('}')) {
      lines[i] = '                  </div>';
      fixed = true;
      console.log(`Fixed line ${i+1}: removed extra ) and added closing div`);
    }
  }
}

content = lines.join('\n');
fs.writeFileSync(filePath, content, 'utf-8');
console.log('✅ Fixed extra parenthesis in app/meetings/page.tsx');
