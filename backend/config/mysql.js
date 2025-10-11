const mysql = require('mysql2/promise');

// Configuration for external MySQL database (EvoGlobal system)
const mysqlConfig = {
  host: '15.235.42.59',
  port: 3306,
  database: 'eeducation_evoglobal',
  user: 'eeducation',
  password: '1oP9?2QM%_LZ',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
};

// Create connection pool
let pool = null;

const getPool = () => {
  if (!pool) {
    console.log('🔧 Creating MySQL connection pool...');
    console.log(`   Host: ${mysqlConfig.host}:${mysqlConfig.port}`);
    console.log(`   Database: ${mysqlConfig.database}`);
    pool = mysql.createPool(mysqlConfig);
    console.log('✅ MySQL pool created successfully');
  }
  return pool;
};

// Test MySQL connection
const testMySQLConnection = async () => {
  console.log('🔍 Testing MySQL connection...');

  try {
    const connection = await getPool().getConnection();
    console.log('✅ MySQL connection successful!');

    // Test a simple query
    const [rows] = await connection.query('SELECT 1 as test');
    console.log('📊 Test query result:', rows);

    connection.release();
    return true;
  } catch (error) {
    console.error('❌ MySQL connection failed:');
    console.error('   Error Code:', error.code || 'Unknown');
    console.error('   Error Message:', error.message || 'No message');
    console.error('   SQL State:', error.sqlState || 'Unknown');
    return false;
  }
};

module.exports = {
  getPool,
  testMySQLConnection
};
