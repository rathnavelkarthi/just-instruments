# Troubleshooting "requested path is invalid" Error

## 🔍 **Common Causes and Solutions**

### **1. Database Schema Not Created**
**Problem:** Supabase project exists but tables don't exist yet.

**Solution:**
1. Go to your Supabase dashboard
2. Click "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy the entire contents of `supabase-schema.sql`
5. Paste and run the SQL script
6. Verify tables were created in "Table Editor"

### **2. Wrong Supabase URL Format**
**Problem:** Using dashboard URL instead of API URL.

**❌ Wrong:**
```
https://supabase.com/dashboard/project/tomvzmhaarpfmiccldly
```

**✅ Correct:**
```
https://tomvzmhaarpfmiccldly.supabase.co
```

### **3. Project Not Active**
**Problem:** Supabase project is paused or inactive.

**Solution:**
1. Check your Supabase dashboard
2. Verify project status
3. Check billing if applicable
4. Reactivate project if needed

### **4. API Keys Incorrect**
**Problem:** Wrong or expired API keys.

**Solution:**
1. Go to Settings → API in Supabase dashboard
2. Copy the correct keys
3. Update `supabase-config.js`

### **5. CORS Issues**
**Problem:** Browser blocking requests due to CORS.

**Solution:**
1. Test with different browsers
2. Check browser console for CORS errors
3. Verify Supabase CORS settings

## 🧪 **Testing Steps**

### **Step 1: Test Supabase Connection**
```bash
# Open test page
start test-supabase.html
```

### **Step 2: Check Configuration**
1. Open `test-supabase.html`
2. Verify URL and keys are displayed correctly
3. Click "Test Connection"
4. Check for error messages

### **Step 3: Test Authentication**
1. Use the fixed login page: `unified-login-fixed.html`
2. Try demo credentials
3. Check browser console for errors

### **Step 4: Verify Database**
1. Go to Supabase dashboard
2. Check "Table Editor"
3. Verify all tables exist:
   - users
   - customers
   - instruments
   - certificates
   - test_equipment
   - calibration_staff
   - notifications
   - reports
   - customer_otp

## 🔧 **Quick Fixes**

### **Fix 1: Use Local Authentication**
If Supabase isn't working, the app will automatically fall back to local authentication.

### **Fix 2: Check Browser Console**
1. Open Developer Tools (F12)
2. Look for specific error messages
3. Check Network tab for failed requests

### **Fix 3: Verify Supabase Project**
1. Go to [supabase.com](https://supabase.com)
2. Check if your project is listed
3. Verify it's not paused or deleted

## 📱 **Alternative Access Methods**

### **Method 1: Direct Dashboard Access**
```bash
# Open staff dashboard directly
start modern-dashboard.html
```

### **Method 2: Customer Portal**
```bash
# Open customer dashboard directly
start customer-dashboard.html
```

### **Method 3: Test Pages**
```bash
# Test Supabase connection
start test-supabase.html

# Test fixed login
start unified-login-fixed.html
```

## 🚀 **Production Setup**

### **For Production Deployment:**

1. **Set up Supabase properly:**
   - Create project
   - Run database schema
   - Configure authentication
   - Set up RLS policies

2. **Update configuration:**
   - Use production Supabase URL
   - Use production API keys
   - Configure CORS settings

3. **Test thoroughly:**
   - Test all user types
   - Verify real-time features
   - Check error handling

## 🆘 **Emergency Fallback**

If Supabase continues to have issues:

1. **Use the fixed login page:** `unified-login-fixed.html`
2. **It will automatically fall back to local authentication**
3. **All features will work without Supabase**
4. **You can set up Supabase later**

## 📞 **Getting Help**

### **Check These First:**
1. ✅ Supabase project is active
2. ✅ Database schema is created
3. ✅ URL format is correct
4. ✅ API keys are valid
5. ✅ Browser console shows no errors

### **If Still Having Issues:**
1. Try different browsers
2. Clear browser cache
3. Check Supabase status page
4. Verify project permissions
5. Test with simple queries first

## 🎯 **Success Indicators**

### **✅ Working Correctly:**
- Connection status shows "✅ Supabase Connected"
- Authentication works with demo credentials
- No "requested path is invalid" errors
- Tables visible in Supabase dashboard

### **⚠️ Partial Success:**
- Shows "⚠️ Using Local Authentication"
- Login still works with demo credentials
- All features functional without Supabase

### **❌ Still Failing:**
- Check browser console for specific errors
- Verify Supabase project setup
- Test with different credentials
- Try the troubleshooting steps above

## 🔄 **Reset and Retry**

If nothing works:

1. **Create a new Supabase project**
2. **Run the database schema again**
3. **Update configuration with new credentials**
4. **Test with the fixed login page**

The platform will work with or without Supabase - you can always set up the database connection later!
