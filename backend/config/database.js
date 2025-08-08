const { createClient } = require('@supabase/supabase-js');

// Validate required environment variables
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    console.error('Please check your .env file and ensure all Supabase credentials are set.');
    process.exit(1);
  }
}

// Create Supabase client
console.log('🔧 Creating Supabase client...');
console.log(`   URL: ${process.env.SUPABASE_URL}`);
console.log(`   Key starts with: ${process.env.SUPABASE_ANON_KEY?.substring(0, 20)}...`);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: false
    },
    global: {
      headers: {
        'apikey': process.env.SUPABASE_ANON_KEY
      }
    }
  }
);

console.log('✅ Supabase client created successfully');

// Test database connection
const testConnection = async () => {
  console.log('🔍 Starting database connection test...');
  console.log('📋 Environment variables check:');
  console.log(`   SUPABASE_URL: ${process.env.SUPABASE_URL ? 'SET' : 'MISSING'}`);
  console.log(`   SUPABASE_ANON_KEY: ${process.env.SUPABASE_ANON_KEY ? 'SET (length: ' + process.env.SUPABASE_ANON_KEY.length + ')' : 'MISSING'}`);
  
  try {
    console.log('🔌 Attempting to connect to Supabase...');
    console.log(`   URL: ${process.env.SUPABASE_URL}`);
    
    // Try a very simple request first
    console.log('🗣️ Making request to Supabase...');
    const { data, error } = await supabase
      .from('courses')
      .select('id', { count: 'exact' })
      .limit(1);
    
    if (error) {
      console.error('❌ Database connection failed with Supabase error:');
      console.error('   Error Code:', error.code || 'Unknown');
      console.error('   Error Message:', error.message || 'No message provided');
      console.error('   Error Details:', error.details || 'No details provided');
      console.error('   Error Hint:', error.hint || 'No hint provided');
      console.error('   Full error object:', JSON.stringify(error, null, 2));
      return false;
    }
    
    console.log('✅ Database connection successful!');
    console.log('📊 Query result:', data);
    return true;
  } catch (error) {
    console.error('❌ Database connection error (caught exception):');
    console.error('   Error Name:', error.name || 'Unknown');
    console.error('   Error Message:', error.message || 'No message');
    console.error('   Error Stack:', error.stack || 'No stack trace');
    console.error('   Full error object:', JSON.stringify(error, null, 2));
    return false;
  }
};

// Test simple SELECT query on courses table
const testSimpleQuery = async () => {
  console.log('\n🧪 Testing simple SELECT query on courses table...');
  
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Simple query failed:');
      console.error('   Error Code:', error.code || 'Unknown');
      console.error('   Error Message:', error.message || 'No message');
      console.error('   Full error:', JSON.stringify(error, null, 2));
      return false;
    }
    
    console.log('✅ Simple query successful!');
    console.log('📋 Sample data:', data?.length ? data[0] : 'No data found');
    return true;
  } catch (error) {
    console.error('❌ Simple query error (exception):');
    console.error('   Message:', error.message);
    console.error('   Stack:', error.stack);
    return false;
  }
};

module.exports = {
  supabase,
  testConnection,
  testSimpleQuery
};