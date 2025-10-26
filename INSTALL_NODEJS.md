# 🚀 Install Node.js to Run Your Application

## The Problem
Your buttons aren't working because **Node.js is not installed** on your system. The Node.js application requires Node.js to run.

## ✅ Solution: Install Node.js

### **Option 1: Download from Official Website (Recommended)**

1. **Go to Node.js website**: https://nodejs.org/
2. **Download LTS version** (Long Term Support)
3. **Run the installer** and follow the setup wizard
4. **Restart your computer** after installation

### **Option 2: Using Chocolatey (Windows Package Manager)**

If you have Chocolatey installed:
```bash
choco install nodejs
```

### **Option 3: Using Winget (Windows 10/11)**

```bash
winget install OpenJS.NodeJS
```

## 🔍 Verify Installation

After installing Node.js, open a **new** command prompt and run:
```bash
node --version
npm --version
```

You should see version numbers like:
```
v18.17.0
9.6.7
```

## 🚀 Start Your Application

Once Node.js is installed:

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the application:**
   ```bash
   node start.js
   ```

3. **Open your browser:**
   - Go to: http://localhost:3000/
   - Login with: admin@justinstruments.com / admin123
   - All buttons should now work!

## 🎯 What This Fixes

- ✅ **All buttons will work** (sidebar, modals, forms)
- ✅ **Forms will save to Supabase**
- ✅ **Navigation will work**
- ✅ **Charts will display**
- ✅ **Real-time data sync**

## 📞 Need Help?

If you're still having issues after installing Node.js:

1. **Check Node.js is installed**: `node --version`
2. **Check dependencies**: `npm install`
3. **Check environment**: Create `.env` file with Supabase credentials
4. **Check console**: Open browser console (F12) for error messages

Your calibration platform will work perfectly once Node.js is installed! 🎉
