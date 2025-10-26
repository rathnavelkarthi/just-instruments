@echo off
echo Git Commands for JUST INSTRUMENTS...
echo.
echo BASIC GIT COMMANDS:
echo.
echo 1. Initialize repository:
echo    git init
echo.
echo 2. Add all files:
echo    git add .
echo.
echo 3. Create commit:
echo    git commit -m "Your commit message"
echo.
echo 4. Add remote repository:
echo    git remote add origin https://github.com/YOUR_USERNAME/just-instruments.git
echo.
echo 5. Push to GitHub:
echo    git push -u origin main
echo.
echo DAILY WORKFLOW:
echo.
echo 1. Check status:
echo    git status
echo.
echo 2. Add changes:
echo    git add .
echo.
echo 3. Commit changes:
echo    git commit -m "Description of changes"
echo.
echo 4. Push to GitHub:
echo    git push
echo.
echo USEFUL COMMANDS:
echo.
echo - View commit history: git log
echo - Check differences: git diff
echo - Create branch: git checkout -b feature-name
echo - Switch branch: git checkout main
echo - Merge branch: git merge feature-name
echo - Delete branch: git branch -d feature-name
echo.
echo AUTOMATIC DEPLOYMENT:
echo.
echo Once connected to Netlify:
echo - Every push to main branch = automatic deployment
echo - Pull requests = preview deployments
echo - Easy rollback to previous versions
echo.
echo Opening GitHub...
start https://github.com
echo.
echo Opening Netlify...
start https://netlify.com
echo.
pause
