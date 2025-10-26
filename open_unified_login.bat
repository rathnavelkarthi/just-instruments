@echo off
echo Opening Unified Login Portal...
echo.
echo Features:
echo - Single login page for all user types
echo - Auto-detects Admin, Staff, or Customer
echo - Supabase integration ready
echo - Real-time authentication
echo.
echo Login Credentials:
echo Admin: admin@justinstruments.com / admin123
echo Staff: staff001 / staff123  
echo Customer: CUST-001 / 123456
echo.
start unified-login.html
echo.
echo Unified login portal opened in browser.
echo.
echo To connect Supabase:
echo 1. Create Supabase project
echo 2. Update supabase-config.js with your credentials
echo 3. Run supabase-schema.sql in Supabase SQL editor
echo.
pause
