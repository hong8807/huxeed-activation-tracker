const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// .env.local 파일 읽기
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

// 환경 변수 파싱
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
);

async function updatePassword() {
  console.log('\n🔐 Updating admin password...\n');

  const correctHash = '$2b$10$33k4ztmq6lJjv8qUAvuTAux1pW6IKg7DK4swlCA9B1raYClZ.u0.i';

  const { data, error } = await supabase
    .from('users')
    .update({ password_hash: correctHash })
    .eq('email', 'hsj@huxeed.com')
    .select();

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log('✅ Password updated successfully!');
  console.log('📊 Updated user:', data);
  console.log('\n✨ You can now login with:');
  console.log('   Email: hsj@huxeed.com');
  console.log('   Password: 1111\n');
}

updatePassword();
