// Load environment variables from .env file
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Check if environment variables are set
const requiredVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_APP_ENV',
  'VITE_APP_NAME'
];

console.log('🔍 Checking environment variables...\n');

let allVarsPresent = true;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  const status = value ? '✅' : '❌';
  console.log(`${status} ${varName}: ${value || 'Not set'}`);
  
  if (!value) {
    allVarsPresent = false;
  }
});

if (allVarsPresent) {
  console.log('\n✅ All required environment variables are present!');
} else {
  console.log('\n❌ Some required environment variables are missing.');
  process.exit(1);
}
