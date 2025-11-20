const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../app/meetings/page.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// Step 1: Add canDownload state
content = content.replace(
  /(const \[editData, setEditData\] = useState<\{[\s\S]*?\n  \}\))\n/,
  `$1
  const [canDownload, setCanDownload] = useState<boolean>(false)\n`
);

// Step 2: Add permission check in fetchItems
content = content.replace(
  /(const fetchItems = async \(\) => \{\s*try \{\s*const response = await fetch\('\/api\/meetings'\)\s*if \(!response\.ok\) \{[\s\S]*?\}\s*const data = await response\.json\(\)\s*setItems\(data\))/,
  `$1

      // Check download permission
      const sessionRes = await fetch('/api/auth/session')
      if (sessionRes.ok) {
        const sessionData = await sessionRes.json()
        if (sessionData.can_download_meetings) {
          setCanDownload(true)
        }
      }`
);

// Step 3: Make download button conditional - wrap button with conditional
content = content.replace(
  /(<div className="flex gap-2">\s*<button\s*onClick=\{handleExportExcel\}\s*className="inline-flex[\s\S]*?엑셀 다운로드\s*<\/button>)/,
  `<div className="flex gap-2">
              {canDownload && (
                $1
              )}`
);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('✅ Added download permission UI to Meetings page');
