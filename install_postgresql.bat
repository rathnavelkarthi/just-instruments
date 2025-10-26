@echo off
echo Installing PostgreSQL for psql access...
echo.
echo This will download and install PostgreSQL which includes psql.
echo.
echo Downloading PostgreSQL installer...
echo.
echo Please visit: https://www.postgresql.org/download/windows/
echo.
echo Or use chocolatey (if installed):
echo choco install postgresql
echo.
echo Or use winget (Windows 10/11):
echo winget install PostgreSQL.PostgreSQL
echo.
echo After installation, you can use:
echo psql -h db.tomvzmhaarpfmiccldly.supabase.co -p 5432 -d postgres -U postgres
echo.
pause
