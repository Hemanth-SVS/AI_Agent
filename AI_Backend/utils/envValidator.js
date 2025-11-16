/**
 * Validates required environment variables on startup
 */
const validateEnv = () => {
  const required = ['GEMINI_API_KEY', 'MONGO_URI'];
  const missing = [];

  required.forEach(key => {
    if (!process.env[key]) {
      missing.push(key);
    }
  });

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(key => console.error(`   - ${key}`));
    console.error('\nPlease set these in your .env file');
    process.exit(1);
  }

  console.log('✅ Environment variables validated');
};

module.exports = validateEnv;

