require('dotenv').config({ path: './backend/.env' });
const { supabase } = require('./backend/config/database');

async function testCreateRegion() {
  console.log('🧪 Testing region creation with English UI language...\n');

  // First, let's see what a typical region looks like
  console.log('1. Fetching existing regions...');
  const { data: existingRegions, error: fetchError } = await supabase
    .from('regions')
    .select('*')
    .limit(1);

  if (fetchError) {
    console.error('❌ Error fetching regions:', fetchError);
  } else {
    console.log('✅ Sample region:', JSON.stringify(existingRegions, null, 2));
  }

  // Test creating a region with en UI language but different available languages
  console.log('\n2. Attempting to create test region...');
  const testRegion = {
    name: 'Test Region Claude',
    slug: 'test-region-claude-' + Date.now(),
    description: 'Test region to debug UI language issue',
    included_category_ids: [1], // Assuming category 1 exists
    excluded_course_ids: [],
    available_languages: ['es', 'pt'], // Spanish and Portuguese courses
    preferred_ui_language: 'en', // English UI
    is_active: true
  };

  console.log('📝 Test data:', JSON.stringify(testRegion, null, 2));

  const { data: newRegion, error: createError } = await supabase
    .from('regions')
    .insert(testRegion)
    .select()
    .single();

  if (createError) {
    console.error('❌ Error creating region:', createError);
    console.error('   Code:', createError.code);
    console.error('   Message:', createError.message);
    console.error('   Details:', createError.details);
    console.error('   Hint:', createError.hint);
  } else {
    console.log('✅ Region created successfully!');
    console.log('📄 Created region:', JSON.stringify(newRegion, null, 2));

    // Clean up: delete the test region
    console.log('\n3. Cleaning up test region...');
    const { error: deleteError } = await supabase
      .from('regions')
      .delete()
      .eq('id', newRegion.id);

    if (deleteError) {
      console.error('❌ Error deleting test region:', deleteError);
    } else {
      console.log('✅ Test region deleted successfully');
    }
  }
}

testCreateRegion();
