const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../app/meetings/page.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// Step 1: Add canDownload state after other state variables
content = content.replace(
  /(const \[editData, setEditData\] = useState<\{[\s\S]*?\}\)\n)/,
  `$1  const [canDownload, setCanDownload] = useState<boolean>(false)\n`
);

// Step 2: Add permission check in fetchItems function
content = content.replace(
  /(const fetchItems = async \(\) => \{\s*try \{\s*const response = await fetch\('\/api\/meetings'\))/,
  `$1

      // Check download permission
      const sessionRes = await fetch('/api/auth/session')
      if (sessionRes.ok) {
        const { session } = await sessionRes.json()
        if (session?.user?.email) {
          const userRes = await fetch('/api/auth/session')
          const { user } = await userRes.json()
          if (user?.can_download_meetings) {
            setCanDownload(true)
          }
        }
      }`
);

// Step 3: Make download button conditional
content = content.replace(
  /(<div className="flex gap-2">\s*<button\s+onClick=\{handleExportExcel\})/,
  `<div className="flex gap-2">
              {canDownload && (
                <button
                  onClick={handleExportExcel}`
);

content = content.replace(
  /(엑셀 다운로드\s*<\/button>)\s*(<Link)/,
  `엑셀 다운로드
                </button>
              )}
              $2`
);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('✅ Added download permission UI to Meetings page');
