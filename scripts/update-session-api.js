const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../app/api/auth/session/route.ts');
let content = fs.readFileSync(filePath, 'utf-8');

// Add supabase import
content = content.replace(
  /(import \{ NextRequest, NextResponse \} from 'next\/server')\n(import \{ cookies \} from 'next\/headers')/,
  `$1\n$2\nimport { createClient } from '@/lib/supabase/server'`
);

// Add database query for can_download_meetings
content = content.replace(
  /(const session = JSON\.parse\(sessionCookie\.value\))\n\n(\s+return NextResponse\.json\(\{)/,
  `$1

    // Get user's download permission from database
    const supabase = await createClient()
    const { data: user } = await supabase
      .from('users')
      .select('can_download_meetings')
      .eq('email', session.email)
      .single()

$2`
);

// Add can_download_meetings to response
content = content.replace(
  /(accessorName: session\.accessorName \|\| null,)\n(\s+\}\))/,
  `$1
      can_download_meetings: user?.can_download_meetings || false,$2`
);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('✅ Updated session API to include can_download_meetings');
