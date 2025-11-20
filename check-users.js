require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'MISSING');

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsers() {
  console.log('\n🔍 Checking users table...\n');
  
  const { data, error } = await supabase
    .from('users')
    .select('*');
  
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  console.log('📊 Users found:', data.length);
  data.forEach(user => {
    console.log('\n---');
    console.log('Email:', user.email);
    console.log('Role:', user.role);
    console.log('Password Hash:', user.password_hash.substring(0, 20) + '...');
    console.log('Created:', user.created_at);
  });
}

checkUsers();
