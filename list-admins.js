#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config()

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

if (!url || !key) {
  console.error('❌ Missing Supabase env vars (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)')
  process.exit(1)
}

const supabase = createClient(url, key)

async function main() {
  console.log('🔎 Listing admin profiles...')
  const { data, error } = await supabase.from('profiles').select('*').eq('role', 'admin').order('created_at', { ascending: true })
  if (error) {
    console.error('❌ Error fetching admins:', error.message)
    process.exit(1)
  }
  if (!data || data.length === 0) {
    console.log('⚠️  No admins found in profiles table.')
    process.exit(0)
  }
  console.log(`✅ Found ${data.length} admin(s):`)
  for (const p of data) {
    console.log(`- id: ${p.id} | user_id: ${p.user_id} | name: ${p.full_name ?? 'N/A'} | initials: ${p.sales_initials ?? 'N/A'} | created: ${p.created_at}`)
  }
}

main().catch((e) => {
  console.error('❌ Unexpected error:', e)
  process.exit(1)
})
