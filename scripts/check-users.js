const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkUsers() {
  console.log('🔍 Checking users table...\n');

  const { data, error } = await supabase
    .from('users')
    .select('*');

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  console.log(`✅ Found ${data.length} users:\n`);
  data.forEach(user => {
    console.log(`📧 Email: ${user.email}`);
    console.log(`👤 Role: ${user.role}`);
    console.log(`🔐 Password Hash: ${user.password_hash.substring(0, 20)}...`);
    console.log(`✓ Active: ${user.is_active}`);
    console.log('---\n');
  });
}

checkUsers();
