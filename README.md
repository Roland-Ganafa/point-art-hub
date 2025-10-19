# Point Art Hub - Inventory Management System

A modern inventory and services management system for Stationery, Gift Store, Embroidery, Machines, and Art Services. Built with React + TypeScript + Supabase.

## Quick Start
1. Install deps: 
pm install
2. Configure env: copy .env.example to .env and set:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY
3. Initialize DB: run the SQL in database_setup.sql on your Supabase project
4. Run dev server: 
pm run dev

## Features
- Dashboard with live stats
- Role-based access (admin/user)
- Inventory & sales tracking (stationery, gifts)
- Services modules (embroidery, machines, art)
- CSV export, offline support, retries & error handling

## Scripts
- 
pm run dev – start dev server
- 
pm run build – typecheck + build
- 
pm run lint – lint code
- 
pm run debug:comprehensive – deep diagnostics

## Environment
Create .env:
`
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_APP_ENV=development
VITE_APP_NAME=Point Art Hub
`

## Database
Run database_setup.sql in Supabase SQL Editor. Tables: stationery, gift_store, embroidery, machines, rt_services, stationery_sales, gift_daily_sales, profiles.

## Troubleshooting
- If dashboard can’t load: check .env values and network
- If schema errors (e.g. missing columns): re-run migrations in supabase/migrations
- Use src/utils/connectionMonitor.ts for connection diagnostics

## License
MIT