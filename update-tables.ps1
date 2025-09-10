# Script to update Point Art Hub database tables
# This script applies the latest migrations to your Supabase database

Write-Host "🚀 Starting Point Art Hub database update..." -ForegroundColor Green

# Check if Supabase CLI is installed
try {
    $supabaseVersion = supabase --version
    Write-Host "✅ Supabase CLI found: $supabaseVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Supabase CLI could not be found" -ForegroundColor Red
    Write-Host "Please install Supabase CLI: https://supabase.com/docs/guides/cli" -ForegroundColor Yellow
    exit 1
}

# Check if we're in the correct directory
if (-not (Test-Path "supabase")) {
    Write-Host "❌ Supabase directory not found" -ForegroundColor Red
    Write-Host "Please run this script from the root of your Point Art Hub project" -ForegroundColor Yellow
    exit 1
}

# Apply the latest migration
Write-Host "🔄 Applying latest migration..." -ForegroundColor Yellow
supabase db push

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database updated successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Next steps:" -ForegroundColor Cyan
    Write-Host "1. Restart your development server" -ForegroundColor Cyan
    Write-Host "2. Test the new features in the application" -ForegroundColor Cyan
    Write-Host "3. Check that all existing functionality still works" -ForegroundColor Cyan
} else {
    Write-Host "❌ Failed to update database" -ForegroundColor Red
    exit 1
}