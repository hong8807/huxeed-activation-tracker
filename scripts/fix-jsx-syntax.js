const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../app/meetings/page.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// Fix the JSX syntax error: remove extra braces and closing parenthesis
content = content.replace(
  /\) : \(\s*\{!item\.is_record \? \(/,
  ') : !item.is_record ? ('
);

content = content.replace(
  /\}\n\s*\)\}/,
  '}'
);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('✅ Fixed JSX syntax in app/meetings/page.tsx');
