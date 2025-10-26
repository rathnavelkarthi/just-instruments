@echo off
echo Testing Offline Platform...
echo.
echo This tests the platform without Supabase dependencies.
echo.
echo Features that work offline:
echo - Local authentication
echo - PDF generation
echo - Dashboard functionality
echo - Certificate management
echo - Export options
echo.
echo Demo Credentials:
echo Admin: admin@justinstruments.com / admin123
echo Staff: staff001 / staff123
echo Customer: CUST-001 / 123456
echo.
start test-offline.html
echo.
echo Offline test page opened in browser.
echo.
echo If this works, your platform is fully functional!
echo.
pause
