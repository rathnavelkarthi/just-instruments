@echo off
REM JUST INSTRUMENTS - Production Deployment Script for Windows
REM This script deploys the calibration platform to production

echo 🚀 Starting JUST INSTRUMENTS Platform Deployment...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    exit /b 1
)

echo ✅ Node.js version: 
node --version
echo ✅ npm version: 
npm --version

REM Install dependencies
echo 📦 Installing dependencies...
npm install --production

REM Create necessary directories
echo 📁 Creating necessary directories...
if not exist "uploads" mkdir uploads
if not exist "logs" mkdir logs
if not exist "ssl" mkdir ssl

REM Copy environment file
if not exist ".env" (
    echo 📝 Creating .env file from template...
    copy env.production .env
    echo ⚠️  Please update .env file with your production values!
)

REM Build application
echo 🔨 Building application...
npm run build

REM Start the application
echo 🚀 Starting application...

REM Check if PM2 is available
pm2 --version >nul 2>&1
if %errorlevel% equ 0 (
    echo 📊 Using PM2 for process management...
    pm2 start server.js --name "just-instruments" --env production
    pm2 save
    pm2 startup
    echo ✅ Application started with PM2
) else (
    echo 📊 Starting with Node.js directly...
    echo ⚠️  Consider installing PM2 for production: npm install -g pm2
    start /b node server.js
    echo ✅ Application started
)

echo.
echo 🎉 JUST INSTRUMENTS Platform deployed successfully!
echo 📱 Application is running on port 3000
echo 🌐 Access the platform at: http://localhost:3000
echo 📊 Dashboard: http://localhost:3000/dashboard
echo.
echo 📋 Next Steps:
echo 1. Update .env file with your production values
echo 2. Set up SSL certificates in ./ssl/ directory
echo 3. Configure your domain name
echo 4. Set up database connection
echo 5. Configure email and SMS services
echo.
echo 🔐 Default Login Credentials:
echo Admin: admin@justinstruments.com / admin123
echo Staff: staff001 / staff123
echo.
echo 📚 Documentation: README.md
echo 🐳 Docker: docker-compose up -d
echo ☁️  Cloud: Deploy to your preferred cloud provider

pause
