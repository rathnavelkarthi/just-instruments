@echo off
echo Initializing Git Repository for JUST INSTRUMENTS...
echo.
echo This will set up your project folder as a Git repository.
echo.
echo STEP 1: Initialize Git Repository
echo.
echo In GitHub Desktop:
echo 1. Click "File" menu
echo 2. Click "Add Local Repository"
echo 3. Click "Create a Repository"
echo 4. Choose a name: just-instruments
echo 5. Local path: %CD%
echo 6. Click "Create Repository"
echo.
echo STEP 2: Add Your Files
echo.
echo After creating the repository:
echo 1. GitHub Desktop will show all your files
echo 2. Add commit message: "Initial commit: JUST INSTRUMENTS Platform"
echo 3. Click "Commit to main"
echo 4. Click "Publish repository"
echo.
echo STEP 3: Publish to GitHub
echo.
echo 1. Repository name: just-instruments
echo 2. Description: Calibration Certificate Management Platform
echo 3. Make sure "Keep this code private" is UNCHECKED
echo 4. Click "Publish Repository"
echo.
echo STEP 4: Deploy to Netlify
echo.
echo 1. Go to https://netlify.com
echo 2. Click "New site from Git"
echo 3. Connect your GitHub account
echo 4. Select "just-instruments" repository
echo 5. Deploy settings:
echo    - Build command: (leave empty)
echo    - Publish directory: . (root)
echo 6. Click "Deploy site"
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
start GITHUB_DESKTOP_GUIDE.md
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
