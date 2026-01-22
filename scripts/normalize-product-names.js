require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

/**
 * 품목명 정규화: 첫 글자 대문자, 나머지 소문자
 * @param {string} name
 * @returns {string}
 */
function capitalizeProductName(name) {
  if (!name) return name
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
}

async function normalizeProductNames() {
  console.log('=== Starting Product Name Normalization ===\n')

  // 1. 대소문자 중복이 있는 품목명 식별
  const { data: allTargets } = await supabase
    .from('targets')
    .select('id, product_name')

  const productNamesMap = new Map()
  allTargets.forEach(t => {
    const lower = t.product_name?.toLowerCase()
    if (lower) {
      if (!productNamesMap.has(lower)) {
        productNamesMap.set(lower, [])
      }
      productNamesMap.get(lower).push({ id: t.id, original: t.product_name })
    }
  })

  // 중복 품목 찾기
  const duplicates = []
  productNamesMap.forEach((entries, lower) => {
    const uniqueVariants = [...new Set(entries.map(e => e.original))]
    if (uniqueVariants.length > 1) {
      duplicates.push({ lower, variants: uniqueVariants, entries })
    }
  })

  if (duplicates.length === 0) {
    console.log('✅ No case duplicates found in targets.')
  } else {
    console.log(`Found ${duplicates.length} products with case variations:\n`)

    for (const dup of duplicates) {
      const canonical = capitalizeProductName(dup.lower)
      console.log(`📦 "${dup.lower}" → "${canonical}"`)
      console.log(`   Variants: ${dup.variants.join(', ')}`)
      console.log(`   Affected targets: ${dup.entries.length}`)

      // 정규화된 이름으로 업데이트
      for (const entry of dup.entries) {
        if (entry.original !== canonical) {
          const { error } = await supabase
            .from('targets')
            .update({ product_name: canonical })
            .eq('id', entry.id)

          if (error) {
            console.error(`   ❌ Error updating target ${entry.id}:`, error.message)
          } else {
            console.log(`   ✅ Updated: "${entry.original}" → "${canonical}"`)
          }
        }
      }
      console.log('')
    }
  }

  // 2. suppliers 테이블도 정규화
  console.log('\n--- Normalizing suppliers table ---\n')

  const { data: allSuppliers } = await supabase
    .from('suppliers')
    .select('id, product_name')

  const supplierNamesMap = new Map()
  allSuppliers.forEach(s => {
    const lower = s.product_name?.toLowerCase()
    if (lower) {
      if (!supplierNamesMap.has(lower)) {
        supplierNamesMap.set(lower, [])
      }
      supplierNamesMap.get(lower).push({ id: s.id, original: s.product_name })
    }
  })

  const supplierDuplicates = []
  supplierNamesMap.forEach((entries, lower) => {
    const uniqueVariants = [...new Set(entries.map(e => e.original))]
    if (uniqueVariants.length > 1) {
      supplierDuplicates.push({ lower, variants: uniqueVariants, entries })
    }
  })

  if (supplierDuplicates.length === 0) {
    console.log('✅ No case duplicates found in suppliers.')
  } else {
    console.log(`Found ${supplierDuplicates.length} products with case variations:\n`)

    for (const dup of supplierDuplicates) {
      const canonical = capitalizeProductName(dup.lower)
      console.log(`📦 "${dup.lower}" → "${canonical}"`)
      console.log(`   Variants: ${dup.variants.join(', ')}`)
      console.log(`   Affected suppliers: ${dup.entries.length}`)

      for (const entry of dup.entries) {
        if (entry.original !== canonical) {
          const { error } = await supabase
            .from('suppliers')
            .update({ product_name: canonical })
            .eq('id', entry.id)

          if (error) {
            console.error(`   ❌ Error updating supplier ${entry.id}:`, error.message)
          } else {
            console.log(`   ✅ Updated: "${entry.original}" → "${canonical}"`)
          }
        }
      }
      console.log('')
    }
  }

  console.log('=== Normalization Complete ===')
}

normalizeProductNames().catch(console.error)
