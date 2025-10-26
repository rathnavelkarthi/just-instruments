@echo off
echo 🚀 Starting JUST INSTRUMENTS Platform Locally...

REM Check if Node.js is available
node --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Node.js found, starting production server...
    echo 📦 Installing dependencies...
    npm install
    echo 🚀 Starting server on http://localhost:3000
    start http://localhost:3000
    node server.js
) else (
    echo ⚠️  Node.js not found, starting simple HTTP server...
    echo 🌐 Opening platform in browser...
    
    REM Try to start Python HTTP server
    python --version >nul 2>&1
    if %errorlevel% equ 0 (
        echo 🐍 Starting Python HTTP server on port 8000...
        start http://localhost:8000/modern-login.html
        python -m http.server 8000
    ) else (
        echo 📁 Opening files directly in browser...
        start modern-login.html
        echo.
        echo 📋 Manual Instructions:
        echo 1. Open modern-login.html in your browser
        echo 2. Use these credentials to login:
        echo    Admin: admin@justinstruments.com / admin123
        echo    Staff: staff001 / staff123
        echo 3. After login, you'll be redirected to modern-dashboard.html
        echo.
        echo 💡 For full functionality, install Node.js from https://nodejs.org
        pause
    )
)
