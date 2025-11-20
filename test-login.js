require('dotenv').config({ path: '.env.local' });
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Testing login with:');
console.log('URL:', supabaseUrl);
console.log('Service Role Key:', supabaseKey ? 'Present' : 'MISSING');

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testLogin() {
  // 1. 모든 사용자 조회
  console.log('\n📊 Fetching all users...');
  const { data: allUsers, error: allError } = await supabase
    .from('users')
    .select('*');

  if (allError) {
    console.error('❌ Error fetching users:', allError);
    return;
  }

  console.log(`\n✅ Found ${allUsers.length} users:`);
  allUsers.forEach((user, i) => {
    console.log(`\n[${i + 1}] ${user.email}`);
    console.log('   Role:', user.role);
    console.log('   Active:', user.is_active);
    console.log('   Password Hash:', user.password_hash.substring(0, 30) + '...');
  });

  // 2. 테스트 비밀번호로 해시 생성
  console.log('\n\n🔐 Testing password hashing...');
  const testPasswords = ['admin123', 'shared123', 'Admin123!', 'Shared123!'];

  for (const pwd of testPasswords) {
    const hash = await bcrypt.hash(pwd, 10);
    console.log(`\nPassword: "${pwd}"`);
    console.log('Hash:', hash.substring(0, 30) + '...');

    // 각 사용자의 해시와 비교
    for (const user of allUsers) {
      const match = await bcrypt.compare(pwd, user.password_hash);
      if (match) {
        console.log(`✅ MATCH for ${user.email}!`);
      }
    }
  }
}

testLogin().catch(console.error);
