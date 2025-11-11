const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Read .env.local file
const envPath = path.join(__dirname, '..', '.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')
const envVars = {}

envContent.split('\n').forEach(line => {
  const trimmed = line.trim()
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=')
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim()
    }
  }
})

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function cleanStageHistory() {
  try {
    console.log('🧹 Cleaning stage_history table...')

    // First, check how many records exist
    const { count: beforeCount, error: countError } = await supabase
      .from('stage_history')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.error('❌ Error counting records:', countError)
      process.exit(1)
    }

    console.log(`📊 Found ${beforeCount} records in stage_history table`)

    if (beforeCount === 0) {
      console.log('✅ Table is already empty!')
      return
    }

    // Delete all records
    const { error: deleteError } = await supabase
      .from('stage_history')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all records (using a condition that matches all)

    if (deleteError) {
      console.error('❌ Error deleting records:', deleteError)
      process.exit(1)
    }

    // Verify deletion
    const { count: afterCount, error: verifyError } = await supabase
      .from('stage_history')
      .select('*', { count: 'exact', head: true })

    if (verifyError) {
      console.error('❌ Error verifying deletion:', verifyError)
      process.exit(1)
    }

    console.log(`✅ Successfully deleted ${beforeCount} records`)
    console.log(`📊 Current count: ${afterCount} records`)
    console.log('🎉 stage_history table cleaned!')

  } catch (error) {
    console.error('💥 Unexpected error:', error)
    process.exit(1)
  }
}

cleanStageHistory()
