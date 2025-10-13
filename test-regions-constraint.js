require('dotenv').config({ path: './backend/.env' });
const { supabase } = require('./backend/config/database');

async function testRegionsConstraint() {
  console.log('🧪 Testing regions table constraints...\n');

  // Query PostgreSQL information schema to get CHECK constraints
  const { data, error } = await supabase.rpc('get_table_constraints', {
    table_name: 'regions'
  }).catch(async () => {
    // If the RPC doesn't exist, try a direct query using raw SQL
    console.log('Trying direct query to pg_constraint...');

    const query = `
      SELECT conname, pg_get_constraintdef(oid) as definition
      FROM pg_constraint
      WHERE conrelid = 'regions'::regclass
    `;

    return await supabase.from('regions').select('*').limit(0);
  });

  console.log('Result:', { data, error });

  // Also try to describe the table structure
  console.log('\n📋 Attempting to fetch regions table structure...');

  const { data: tableData, error: tableError } = await supabase
    .from('regions')
    .select('*')
    .limit(1);

  if (tableError) {
    console.error('❌ Error:', tableError);
  } else {
    console.log('✅ Sample region:', tableData);
  }
}

testRegionsConstraint();
