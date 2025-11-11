// scripts/run-tariff-migration.js
// targets 테이블에 관세율/부대비용율 필드 추가 마이그레이션

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// .env.local 로드
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

// Supabase 클라이언트 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Supabase credentials not found')
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function runMigration() {
  console.log('🚀 Starting tariff migration...\n')

  try {
    // 마이그레이션 파일 읽기
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250106_add_tariff_to_targets.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')

    console.log('📄 Migration file loaded:', migrationPath)
    console.log('📝 SQL Preview:')
    console.log(migrationSQL.split('\n').slice(0, 10).join('\n'))
    console.log('...\n')

    // SQL 실행 (여러 문장이므로 개별 실행)
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    console.log(`📊 Executing ${statements.length} SQL statements...\n`)

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      console.log(`[${i + 1}/${statements.length}] Executing...`)

      const { data, error } = await supabase.rpc('exec_sql', { sql: statement })

      if (error) {
        console.error(`❌ Error in statement ${i + 1}:`, error)
        // ALTER TABLE과 COMMENT는 rpc가 아닌 직접 실행 필요
        console.log('⚠️  This migration requires manual execution in Supabase SQL Editor')
        console.log('Please copy and paste the migration file content into Supabase SQL Editor')
        console.log('Location: https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new')
        break
      } else {
        console.log(`✅ Statement ${i + 1} executed successfully`)
      }
    }

    console.log('\n📋 Verifying migration...')

    // 필드 추가 확인
    const { data: columns, error: columnsError } = await supabase
      .from('targets')
      .select('curr_tariff_rate, curr_additional_cost_rate, our_tariff_rate, our_additional_cost_rate')
      .limit(1)

    if (columnsError) {
      console.error('❌ Verification failed:', columnsError)
      console.log('\n⚠️  Manual migration required!')
      console.log('Please execute the SQL file in Supabase SQL Editor:')
      console.log(migrationPath)
      return
    }

    console.log('✅ New columns verified:')
    console.log('   - curr_tariff_rate')
    console.log('   - curr_additional_cost_rate')
    console.log('   - our_tariff_rate')
    console.log('   - our_additional_cost_rate')

    // 데이터 확인
    const { count, error: countError } = await supabase
      .from('targets')
      .select('*', { count: 'exact', head: true })

    if (!countError) {
      console.log(`\n📊 Total targets with new fields: ${count}`)
    }

    console.log('\n✅ Migration completed successfully!')

  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

// 실행
runMigration()
