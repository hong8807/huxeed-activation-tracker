// scripts/generate-shared-password.js
// 공용 계정(huxeed@huxeed.com) 임시 비밀번호 생성 스크립트

const bcrypt = require('bcryptjs');

async function generatePassword() {
  // 임시 비밀번호 (원하는 비밀번호로 변경 가능)
  const password = 'Huxeed2025!';

  // bcrypt 해시 생성 (salt rounds: 10)
  const hash = await bcrypt.hash(password, 10);

  console.log('═══════════════════════════════════════════════════════');
  console.log('📧 공용 계정 임시 비밀번호 생성');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  console.log('✅ 이메일:', 'huxeed@huxeed.com');
  console.log('✅ 임시 비밀번호:', password);
  console.log('');
  console.log('🔒 bcrypt 해시:', hash);
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('📝 Supabase SQL 쿼리 (아래 쿼리를 복사해서 실행하세요)');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  console.log(`UPDATE users`);
  console.log(`SET password_hash = '${hash}',`);
  console.log(`    updated_at = now()`);
  console.log(`WHERE email = 'huxeed@huxeed.com' AND role = 'shared';`);
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('✨ 테스트 방법');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  console.log('1. 위 SQL 쿼리를 Supabase SQL Editor에서 실행');
  console.log('2. http://localhost:3000/login 접속');
  console.log('3. 이메일: huxeed@huxeed.com');
  console.log('4. 비밀번호:', password);
  console.log('5. "공용 계정 로그인" 버튼 클릭');
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
}

// 실행
generatePassword().catch(console.error);
