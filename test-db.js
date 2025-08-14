require('dotenv').config({ path: './backend/.env' });
const { supabase } = require('./backend/config/database');

async function testDatabase() {
  console.log('🧪 Testing database connection and schema...\n');
  
  // Test 1: Basic connection
  console.log('1. Testing basic connection...');
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Connection failed:', error);
      return;
    }
    console.log('✅ Basic connection successful');
  } catch (err) {
    console.error('❌ Connection error:', err.message);
    return;
  }
  
  // Test 2: Check if lessons table exists
  console.log('\n2. Testing lessons table...');
  try {
    const { data, error } = await supabase
      .from('lessons')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Lessons table error:');
      console.error('   Code:', error.code);
      console.error('   Message:', error.message);
      console.error('   Details:', error.details);
      console.error('   Hint:', error.hint);
    } else {
      console.log('✅ Lessons table accessible');
    }
  } catch (err) {
    console.error('❌ Lessons table error:', err.message);
  }
  
  // Test 3: Check lessons with joins (the problematic query)
  console.log('\n3. Testing lessons with joins...');
  try {
    const { data, error } = await supabase
      .from('lessons')
      .select(`
        id,
        module_id,
        title,
        video_url,
        support_content,
        order,
        drip_content,
        modules (
          id,
          title,
          course_id,
          courses (
            id,
            title,
            slug
          )
        )
      `)
      .limit(1);
    
    if (error) {
      console.error('❌ Lessons join query error:');
      console.error('   Code:', error.code);
      console.error('   Message:', error.message);
      console.error('   Details:', error.details);
      console.error('   Hint:', error.hint);
    } else {
      console.log('✅ Lessons join query successful');
      console.log('📄 Sample data:', JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error('❌ Lessons join query error:', err.message);
  }
  
  // Test 4: Check modules table
  console.log('\n4. Testing modules table...');
  try {
    const { data, error } = await supabase
      .from('modules')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Modules table error:');
      console.error('   Code:', error.code);
      console.error('   Message:', error.message);
    } else {
      console.log('✅ Modules table accessible');
      console.log('📄 Sample module:', JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error('❌ Modules table error:', err.message);
  }
}

testDatabase();