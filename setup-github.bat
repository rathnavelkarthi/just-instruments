@echo off
echo Setting up GitHub for JUST INSTRUMENTS...
echo.
echo This will help you connect your project to GitHub for easy deployment.
echo.
echo STEP 1: Create GitHub Repository
echo 1. Go to https://github.com
echo 2. Sign in to your account
echo 3. Click "New repository"
echo 4. Name: just-instruments
echo 5. Description: Calibration Certificate Management Platform
echo 6. Make it Public (for free Netlify deployment)
echo 7. Click "Create repository"
echo.
echo STEP 2: Initialize Git Repository
echo.
echo Initializing git repository...
git init
echo.
echo Adding all files...
git add .
echo.
echo Creating initial commit...
git commit -m "Initial commit: JUST INSTRUMENTS Calibration Platform"
echo.
echo STEP 3: Connect to GitHub
echo.
echo After creating the repository on GitHub, run these commands:
echo git remote add origin https://github.com/YOUR_USERNAME/just-instruments.git
echo git branch -M main
echo git push -u origin main
echo.
echo STEP 4: Deploy to Netlify
echo.
echo 1. Go to https://netlify.com
echo 2. Click "New site from Git"
echo 3. Connect your GitHub repository
echo 4. Deploy automatically!
echo.
echo Opening GitHub...
start https://github.com
echo.
echo Opening Netlify...
start https://netlify.com
echo.
echo Your project is ready for GitHub and Netlify deployment!
echo.
echo Benefits:
echo - Version control with Git
echo - Easy collaboration
echo - Automatic deployments
echo - Professional hosting
echo - Free hosting with Netlify
echo.
pause
