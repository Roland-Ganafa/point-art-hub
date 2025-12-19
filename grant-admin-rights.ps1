# Grant Admin Edit and Delete Rights
# This script helps you apply the admin policies

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  GRANT ADMIN EDIT AND DELETE RIGHTS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$migrationFile = Join-Path $PSScriptRoot "supabase\migrations\20251108000000_add_admin_edit_delete_policies.sql"

if (-not (Test-Path $migrationFile)) {
    Write-Host "❌ Migration file not found!" -ForegroundColor Red
    Write-Host "   Expected: $migrationFile" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Migration file found!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 This migration will:" -ForegroundColor Yellow
Write-Host "   - Create is_admin() helper function" -ForegroundColor White
Write-Host "   - Grant admins full edit rights on all tables" -ForegroundColor White
Write-Host "   - Grant admins full delete rights on all tables" -ForegroundColor White
Write-Host "   - Allow regular users to edit inventory" -ForegroundColor White
Write-Host "   - Restrict deletion to admins only" -ForegroundColor White
Write-Host ""

Write-Host "To apply these policies, you have 2 options:" -ForegroundColor Cyan
Write-Host ""
Write-Host "OPTION 1: Apply via Supabase CLI (if installed)" -ForegroundColor Yellow
Write-Host "   1. Run: npx supabase db push" -ForegroundColor White
Write-Host ""

Write-Host "OPTION 2: Apply via Supabase Dashboard (Recommended)" -ForegroundColor Yellow
Write-Host "   1. Open: https://app.supabase.com/project/uizibdtiuvjjikbrkdcv/sql" -ForegroundColor White
Write-Host "   2. Click 'New Query'" -ForegroundColor White
Write-Host "   3. Copy the SQL from the file below:" -ForegroundColor White
Write-Host "      $migrationFile" -ForegroundColor Cyan
Write-Host "   4. Paste and run the SQL" -ForegroundColor White
Write-Host ""

Write-Host "Would you like to:" -ForegroundColor Cyan
Write-Host "  [1] Open the migration file in notepad" -ForegroundColor White
Write-Host "  [2] Open Supabase SQL Editor in browser" -ForegroundColor White
Write-Host "  [3] Show the SQL in console" -ForegroundColor White
Write-Host "  [4] Exit" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter your choice (1-4)"

switch ($choice) {
    "1" {
        Write-Host "📂 Opening migration file..." -ForegroundColor Green
        notepad $migrationFile
    }
    "2" {
        Write-Host "🌐 Opening Supabase SQL Editor..." -ForegroundColor Green
        Start-Process "https://app.supabase.com/project/uizibdtiuvjjikbrkdcv/sql"
        Write-Host "✅ Browser opened! Copy the SQL from the migration file." -ForegroundColor Green
    }
    "3" {
        Write-Host ""
        Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
        Write-Host "  SQL MIGRATION CONTENT" -ForegroundColor Cyan
        Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
        Write-Host ""
        Get-Content $migrationFile
        Write-Host ""
        Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
        Write-Host "  END OF SQL" -ForegroundColor Cyan
        Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
        Write-Host ""
    }
    "4" {
        Write-Host "👋 Exiting..." -ForegroundColor Yellow
        exit 0
    }
    default {
        Write-Host "❌ Invalid choice!" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "After applying the SQL:" -ForegroundColor Yellow
Write-Host "  1. Admins will have full edit and delete rights" -ForegroundColor Green
Write-Host "  2. Regular users can edit but not delete" -ForegroundColor Green
Write-Host "  3. All policies will be properly configured" -ForegroundColor Green
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
