@echo off
title Point Art Hub Database Update

echo 🚀 Starting Point Art Hub database update...

REM Check if Supabase CLI is installed
where supabase >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Supabase CLI could not be found
    echo Please install Supabase CLI: https://supabase.com/docs/guides/cli
    pause
    exit /b 1
)

REM Check if we're in the correct directory
if not exist "supabase\" (
    echo ❌ Supabase directory not found
    echo Please run this script from the root of your Point Art Hub project
    pause
    exit /b 1
)

REM Apply the latest migration
echo 🔄 Applying latest migration...
supabase db push

if %errorlevel% equ 0 (
    echo ✅ Database updated successfully!
    echo.
    echo 📋 Next steps:
    echo 1. Restart your development server
    echo 2. Test the new features in the application
    echo 3. Check that all existing functionality still works
) else (
    echo ❌ Failed to update database
    pause
    exit /b 1
)

pause