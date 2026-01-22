require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkCaseIssue() {
  console.log('=== Checking Case Sensitivity Issues ===\n')

  // 1. Check targets with valsartan (case insensitive)
  console.log('1. Targets with "valsartan" (case insensitive):')
  const { data: targets, error: targetError } = await supabase
    .from('targets')
    .select('id, product_name, account_name, current_stage')
    .ilike('product_name', '%valsartan%')

  if (targetError) {
    console.error('Error:', targetError)
  } else {
    console.log(`   Found ${targets.length} targets:`)
    targets.forEach(t => {
      console.log(`   - "${t.product_name}" | ${t.account_name} | ${t.current_stage}`)
    })
  }

  // 2. Check suppliers with valsartan (case insensitive)
  console.log('\n2. Suppliers with "valsartan" (case insensitive):')
  const { data: suppliers, error: supplierError } = await supabase
    .from('suppliers')
    .select('id, product_name, supplier_name')
    .ilike('product_name', '%valsartan%')

  if (supplierError) {
    console.error('Error:', supplierError)
  } else {
    console.log(`   Found ${suppliers.length} suppliers:`)
    suppliers.forEach(s => {
      console.log(`   - "${s.product_name}" | supplier: ${s.supplier_name}`)
    })
  }

  // 3. Check all unique product_name values in targets
  console.log('\n3. All unique product_name values in targets:')
  const { data: allTargets } = await supabase
    .from('targets')
    .select('product_name')

  const uniqueProducts = [...new Set(allTargets.map(t => t.product_name))]
  console.log(`   Total unique products: ${uniqueProducts.length}`)

  // Find case duplicates
  const lowerCaseMap = new Map()
  uniqueProducts.forEach(p => {
    const lower = p?.toLowerCase()
    if (lower && lowerCaseMap.has(lower)) {
      lowerCaseMap.get(lower).push(p)
    } else if (lower) {
      lowerCaseMap.set(lower, [p])
    }
  })

  const caseDuplicates = Array.from(lowerCaseMap.entries())
    .filter(([_, variants]) => variants.length > 1)

  if (caseDuplicates.length > 0) {
    console.log('\n   Case duplicates found:')
    caseDuplicates.forEach(([lower, variants]) => {
      console.log(`   - ${variants.join(' | ')}`)
    })
  } else {
    console.log('   No case duplicates in targets.')
  }

  // 4. Check all unique product_name values in suppliers
  console.log('\n4. All unique product_name values in suppliers:')
  const { data: allSuppliers } = await supabase
    .from('suppliers')
    .select('product_name')

  const uniqueSupplierProducts = [...new Set(allSuppliers.map(s => s.product_name))]
  console.log(`   Total unique products: ${uniqueSupplierProducts.length}`)

  // 5. Check mismatches between targets and suppliers
  console.log('\n5. Checking mismatches (targets vs suppliers):')

  // Get all targets with suppliers-related stages
  const { data: sourcingTargets } = await supabase
    .from('targets')
    .select('id, product_name, current_stage')
    .in('current_stage', [
      'SOURCING_COMPLETED', 'QUOTE_SENT', 'SAMPLE_SHIPPED',
      'QUALIFICATION', 'DMF_RA_REVIEW', 'PRICE_AGREED',
      'TRIAL_PO', 'REGISTRATION', 'COMMERCIAL_PO', 'WON'
    ])

  for (const target of sourcingTargets || []) {
    // Case-sensitive query (original problem)
    const { data: exactMatch } = await supabase
      .from('suppliers')
      .select('id')
      .eq('product_name', target.product_name)

    // Case-insensitive query
    const { data: caseInsensitiveMatch } = await supabase
      .from('suppliers')
      .select('id')
      .ilike('product_name', target.product_name)

    if ((exactMatch?.length || 0) !== (caseInsensitiveMatch?.length || 0)) {
      console.log(`   MISMATCH: "${target.product_name}"`)
      console.log(`     - Exact match: ${exactMatch?.length || 0}`)
      console.log(`     - Case-insensitive match: ${caseInsensitiveMatch?.length || 0}`)
    }
  }

  console.log('\n=== Done ===')
}

checkCaseIssue().catch(console.error)
