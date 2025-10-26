@echo off
echo Setting up Supabase Database...
echo.
echo STEP 1: Open Supabase Dashboard
echo.
echo 1. Go to: https://supabase.com/dashboard/project/tomvzmhaarpfmiccldly
echo 2. Click "SQL Editor" in the left sidebar
echo 3. Click "New Query"
echo.
echo STEP 2: Copy Database Schema
echo.
echo 4. Open supabase-schema.sql in your editor
echo 5. Copy ALL the contents (Ctrl+A, Ctrl+C)
echo 6. Paste into the SQL Editor (Ctrl+V)
echo 7. Click "Run" button
echo.
echo STEP 3: Verify Tables Created
echo.
echo 8. Go to "Table Editor" in Supabase
echo 9. You should see these tables:
echo    - users
echo    - customers  
echo    - instruments
echo    - certificates
echo    - test_equipment
echo    - calibration_staff
echo    - notifications
echo    - reports
echo    - customer_otp
echo.
echo STEP 4: Test Your Application
echo.
echo 10. Open test-supabase.html to test connection
echo 11. Open unified-login-fixed.html to test login
echo.
echo Opening Supabase dashboard...
start https://supabase.com/dashboard/project/tomvzmhaarpfmiccldly
echo.
echo Opening database schema file...
start supabase-schema.sql
echo.
echo Opening test page...
start test-supabase.html
echo.
pause
