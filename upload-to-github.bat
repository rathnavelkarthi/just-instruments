@echo off
echo Uploading JUST INSTRUMENTS to GitHub...
echo.
echo OPTION 1: GitHub Web Interface (Easiest - No Git Required)
echo.
echo 1. Go to https://github.com
echo 2. Sign up/login to your account
echo 3. Click "New repository"
echo 4. Name: just-instruments
echo 5. Description: Calibration Certificate Management Platform
echo 6. Make it Public (for free Netlify deployment)
echo 7. Click "Create repository"
echo 8. Click "uploading an existing file"
echo 9. Drag and drop this entire folder
echo 10. Add commit message: "Initial commit: JUST INSTRUMENTS Platform"
echo 11. Click "Commit changes"
echo.
echo OPTION 2: Install Git First (Advanced)
echo.
echo 1. Download Git from https://git-scm.com/download/win
echo 2. Install with default settings
echo 3. Restart your terminal
echo 4. Run: git init
echo 5. Run: git add .
echo 6. Run: git commit -m "Initial commit"
echo 7. Run: git remote add origin https://github.com/YOUR_USERNAME/just-instruments.git
echo 8. Run: git push -u origin main
echo.
echo OPTION 3: Use GitHub Desktop (User-Friendly)
echo.
echo 1. Download GitHub Desktop from https://desktop.github.com
echo 2. Install and login to your GitHub account
echo 3. Click "Add an Existing Repository"
echo 4. Select this folder
echo 5. Click "Publish repository"
echo 6. Make it Public
echo 7. Click "Publish repository"
echo.
echo After uploading to GitHub:
echo.
echo 1. Go to https://netlify.com
echo 2. Click "New site from Git"
echo 3. Connect your GitHub repository
echo 4. Deploy automatically!
echo.
echo Opening GitHub...
start https://github.com
echo.
echo Opening GitHub Desktop download...
start https://desktop.github.com
echo.
echo Opening Netlify...
start https://netlify.com
echo.
echo Your project is ready for GitHub and Netlify deployment!
echo.
echo Benefits:
echo - Free hosting with Netlify
echo - Automatic deployments
echo - Professional URL
echo - Global CDN
echo - HTTPS security
echo.
pause
