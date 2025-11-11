const bcrypt = require('bcryptjs');

async function generateHash() {
  const password = '1111';
  const hash = await bcrypt.hash(password, 10);

  console.log('\n=================================');
  console.log('비밀번호 해시 생성 결과');
  console.log('=================================\n');
  console.log('입력 비밀번호:', password);
  console.log('\nbcrypt 해시 (10 rounds):\n');
  console.log(hash);
  console.log('\n=================================\n');

  // 검증
  const isValid = await bcrypt.compare(password, hash);
  console.log('검증 결과:', isValid ? '✅ 성공' : '❌ 실패');
  console.log('\n=================================\n');
}

generateHash();
