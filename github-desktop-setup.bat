@echo off
echo Setting up JUST INSTRUMENTS with GitHub Desktop...
echo.
echo STEP 1: Open GitHub Desktop
echo 1. Open GitHub Desktop application
echo 2. Sign in to your GitHub account
echo 3. Click "Add an Existing Repository from your Hard Drive"
echo 4. Browse to this folder: %CD%
echo 5. Click "Add Repository"
echo.
echo STEP 2: Create GitHub Repository
echo 1. In GitHub Desktop, click "Publish repository"
echo 2. Repository name: just-instruments
echo 3. Description: Calibration Certificate Management Platform
echo 4. Make sure "Keep this code private" is UNCHECKED (for free Netlify deployment)
echo 5. Click "Publish Repository"
echo.
echo STEP 3: Deploy to Netlify
echo 1. Go to https://netlify.com
echo 2. Sign up/login to your account
echo 3. Click "New site from Git"
echo 4. Connect your GitHub account
echo 5. Select "just-instruments" repository
echo 6. Deploy settings:
echo    - Build command: (leave empty)
echo    - Publish directory: . (root directory)
echo 7. Click "Deploy site"
echo.
echo STEP 4: Configure Environment Variables
echo 1. In Netlify dashboard, go to Site Settings
echo 2. Click "Environment Variables"
echo 3. Add these variables:
echo    SUPABASE_URL = https://tomvzmhaarpfmiccldly.supabase.co
echo    SUPABASE_ANON_KEY = your-anon-key
echo    SUPABASE_SERVICE_ROLE_KEY = your-service-role-key
echo.
echo Your platform will be live at: https://your-site-name.netlify.app
echo.
echo Opening GitHub Desktop...
start "" "C:\Users\%USERNAME%\AppData\Local\GitHubDesktop\GitHubDesktop.exe"
echo.
echo Opening Netlify...
start https://netlify.com
echo.
echo Opening setup guide...
start GITHUB_SETUP_GUIDE.md
echo.
echo Your project is ready for GitHub Desktop!
echo.
echo Benefits:
echo - Easy version control
echo - Visual interface
echo - Automatic sync with GitHub
echo - Easy collaboration
echo - Professional hosting
echo.
pause
