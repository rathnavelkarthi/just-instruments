@echo off
echo Deploying to Netlify...
echo.
echo OPTION 1: Drag and Drop (Easiest)
echo 1. Go to https://netlify.com
echo 2. Sign up/login to your account
echo 3. Drag and drop this entire folder
echo 4. Your site will be live instantly!
echo.
echo OPTION 2: GitHub Integration (Recommended)
echo 1. Push your code to GitHub
echo 2. Connect Netlify to your GitHub repo
echo 3. Automatic deployments on every push
echo.
echo OPTION 3: Netlify CLI (Advanced)
echo 1. Install: npm install -g netlify-cli
echo 2. Login: netlify login
echo 3. Deploy: netlify deploy --prod
echo.
echo Opening Netlify website...
start https://netlify.com
echo.
echo Opening deployment guide...
start netlify-deploy.md
echo.
echo Your platform is ready for Netlify deployment!
echo.
echo Benefits:
echo - Free hosting
echo - Automatic HTTPS
echo - Global CDN
echo - Custom domains
echo - Easy deployment
echo.
pause
