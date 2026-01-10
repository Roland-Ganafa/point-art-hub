
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyDataAccess() {
    console.log('Testing Dashboard Queries...');

    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

    try {
        const results = await Promise.all([
            supabase.from("stationery").select("*"),
            supabase.from("gift_store").select("*"),
            supabase.from("embroidery").select("*"),
            supabase.from("machines").select("*"),
            supabase.from("art_services").select("*"),
            supabase.from("stationery_sales").select("*").gte("date", startOfDay).lte("date", endOfDay)
        ]);

        console.log('Query Results:');
        const tableNames = ['stationery', 'gift_store', 'embroidery', 'machines', 'art_services', 'stationery_sales'];

        results.forEach((res, index) => {
            if (res.error) {
                console.error(`❌ ${tableNames[index]} Error:`, res.error);
            } else {
                console.log(`✅ ${tableNames[index]}: ${res.data?.length} rows`);
            }
        });

    } catch (err) {
        console.error('Promise.all failed:', err);
    }
}

verifyDataAccess();
