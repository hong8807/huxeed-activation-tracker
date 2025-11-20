const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../app/api/meetings/export/route.ts');
let content = fs.readFileSync(filePath, 'utf-8');

// Add permission check after creating supabase client
const permissionCheck = `
    // 1. 세션 확인
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      );
    }

    // 2. 다운로드 권한 확인
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('can_download_meetings, name')
      .eq('email', session.user.email)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: '사용자 정보를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    if (!user.can_download_meetings) {
      return NextResponse.json(
        { error: '다운로드 권한이 없습니다', message: '권한이 필요한 경우 관리자에게 문의하세요' },
        { status: 403 }
      );
    }
`;

content = content.replace(
  /(const supabase = await createClient\(\);)\n(\s+const \{ searchParams \})/,
  `$1${permissionCheck}\n$2`
);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('✅ Added permission check to export API');
