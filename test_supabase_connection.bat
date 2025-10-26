@echo off
echo Testing Supabase Connection...
echo.
echo This will help diagnose the "requested path is invalid" error.
echo.
echo Opening test page...
start test-supabase.html
echo.
echo Test page opened in browser.
echo.
echo Common issues and solutions:
echo.
echo 1. Database Schema Not Created:
echo    - Go to Supabase Dashboard
echo    - Click "SQL Editor"
echo    - Run the contents of supabase-schema.sql
echo.
echo 2. Wrong URL Format:
echo    - Should be: https://your-project-id.supabase.co
echo    - NOT: https://supabase.com/dashboard/project/your-project-id
echo.
echo 3. API Keys Incorrect:
echo    - Check anon key in Supabase Dashboard
echo    - Verify service role key
echo.
echo 4. Project Not Active:
echo    - Check if project is paused
echo    - Verify billing status
echo.
pause
