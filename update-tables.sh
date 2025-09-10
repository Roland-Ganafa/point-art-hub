#!/bin/bash

# Script to update Point Art Hub database tables
# This script applies the latest migrations to your Supabase database

echo "🚀 Starting Point Art Hub database update..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null
then
    echo "❌ Supabase CLI could not be found"
    echo "Please install Supabase CLI: https://supabase.com/docs/guides/cli"
    exit 1
fi

# Check if we're in the correct directory
if [ ! -d "supabase" ]; then
    echo "❌ Supabase directory not found"
    echo "Please run this script from the root of your Point Art Hub project"
    exit 1
fi

# Apply the latest migration
echo "🔄 Applying latest migration..."
supabase db push

if [ $? -eq 0 ]; then
    echo "✅ Database updated successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Restart your development server"
    echo "2. Test the new features in the application"
    echo "3. Check that all existing functionality still works"
else
    echo "❌ Failed to update database"
    exit 1
fi