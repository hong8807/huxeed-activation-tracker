const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../app/meetings/page.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// Step 1: Add is_record to interface
content = content.replace(
  /interface MeetingItem \{[\s\S]*?\n\}/,
  `interface MeetingItem {
  id: number
  meeting_type: string
  meeting_date: string
  account_name: string | null
  content: string
  assignee_name: string | null
  reply_text: string | null
  is_done: boolean
  is_record: boolean
  created_at: string
  updated_at: string
}`
);

// Step 2: Add yellow badge after meeting type badge
const badgePattern = /(<span className=\{`inline-flex items-center px-2\.5 py-0\.5 rounded-md text-xs font-semibold border \$\{MEETING_TYPE_COLORS\[item\.meeting_type\]\}`\}>\s*\{highlightKeyword\(item\.meeting_type\)\}\s*<\/span>)/;

content = content.replace(
  badgePattern,
  `$1
                      {item.is_record && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-300">
                          📋 단순 기록
                        </span>
                      )}`
);

// Step 3: Wrap assignee/response section with conditional rendering
const assigneeSectionPattern = /(<div className="space-y-2">\s*\{item\.assignee_name && \(\s*<div className="text-sm">[\s\S]*?<\/div>\s*\)\}\s*\{!item\.assignee_name && !item\.reply_text && \(\s*<p className="text-sm text-gray-400 italic">담당자 및 답변이 아직 입력되지 않았습니다<\/p>\s*\)\}\s*<\/div>)/;

content = content.replace(
  assigneeSectionPattern,
  `{!item.is_record ? (
                      $1
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm text-gray-500 italic">
                          📋 이 항목은 단순 기록입니다 (담당자/답변 불필요)
                        </p>
                      </div>
                    )}`
);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('✅ Successfully updated app/meetings/page.tsx');
