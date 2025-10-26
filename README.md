# JUST INSTRUMENTS - Calibration Certificate Management Platform

## 🏢 **About**
A comprehensive calibration certificate management platform for JUST INSTRUMENTS Inc. featuring admin dashboard, staff management, customer portal, and automated certificate generation.

## 🚀 **Features**

### **👨‍💼 Admin Dashboard**
- Complete system management
- User and staff management
- Certificate creation and editing
- Reports and analytics
- Test equipment management
- Calibration staff management

### **👨‍🔧 Staff Dashboard**
- Certificate management
- Customer service tools
- Calibration tracking
- Equipment management
- PDF generation and sharing

### **👤 Customer Portal**
- Certificate viewing and downloads
- Profile management
- Notification preferences
- Instrument tracking
- OTP authentication

### **🔐 Authentication**
- Unified login system
- Auto-detection of user types (Admin/Staff/Customer)
- Supabase integration
- Local authentication fallback
- Active Directory integration support

## 🛠️ **Technology Stack**

- **Frontend:** HTML5, CSS3, JavaScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL)
- **Authentication:** JWT, OTP
- **PDF Generation:** jsPDF, HTML2Canvas
- **Icons:** Lucide Icons
- **Charts:** Chart.js
- **Deployment:** Netlify

## 📋 **Prerequisites**

- Modern web browser
- Internet connection (for Supabase)
- GitHub account (for deployment)

## 🚀 **Quick Start**

### **Local Development**
1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/just-instruments.git
   cd just-instruments
   ```

2. **Open the platform:**
   ```bash
   # Open main page
   start index.html
   
   # Or open login directly
   start login.html
   ```

### **Demo Credentials**
- **Admin:** `admin@justinstruments.com` / `admin123`
- **Staff:** `staff001` / `staff123`
- **Customer:** `CUST-001` / `123456`

## 🔧 **Configuration**

### **Supabase Setup**
1. **Create Supabase project** at [supabase.com](https://supabase.com)
2. **Update `supabase-config.js`** with your credentials:
   ```javascript
   const SUPABASE_CONFIG = {
       url: 'YOUR_SUPABASE_URL',
       anonKey: 'YOUR_SUPABASE_ANON_KEY',
       serviceRoleKey: 'YOUR_SUPABASE_SERVICE_ROLE_KEY'
   };
   ```
3. **Run database schema** in Supabase SQL Editor:
   ```sql
   -- Copy contents of supabase-schema.sql
   ```

### **Environment Variables**
For production deployment, set these in Netlify:
```
SUPABASE_URL = your-supabase-url
SUPABASE_ANON_KEY = your-anon-key
SUPABASE_SERVICE_ROLE_KEY = your-service-role-key
```

## 📱 **Pages Overview**

### **Main Pages**
- `index.html` - Main entry point
- `login.html` - Unified login page
- `modern-dashboard.html` - Admin/Staff dashboard
- `customer-dashboard.html` - Customer portal

### **Utility Pages**
- `test-supabase.html` - Database connection test
- `supabase-database-manager.html` - Database management
- `test-offline.html` - Offline functionality test

### **Configuration Files**
- `supabase-config.js` - Database configuration
- `supabase-schema.sql` - Database schema
- `netlify.toml` - Netlify deployment config
- `_redirects` - URL redirects

## 🚀 **Deployment**

### **Netlify Deployment (Recommended)**
1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Connect to Netlify:**
   - Go to [netlify.com](https://netlify.com)
   - Click "New site from Git"
   - Connect your GitHub repository
   - Deploy automatically

### **Manual Deployment**
1. **Zip the project folder**
2. **Go to [netlify.com](https://netlify.com)**
3. **Drag and drop** the zip file
4. **Your site is live!**

## 🔒 **Security Features**

- **HTTPS encryption** (automatic with Netlify)
- **XSS protection** headers
- **Content Security Policy**
- **Secure authentication** with JWT
- **Row Level Security** (RLS) in Supabase
- **Environment variable** protection

## 📊 **Database Schema**

### **Tables**
- `users` - Admin and staff users
- `customers` - Customer information
- `instruments` - Customer instruments
- `certificates` - Calibration certificates
- `test_equipment` - Calibration equipment
- `calibration_staff` - Staff members
- `notifications` - System notifications
- `reports` - Generated reports
- `customer_otp` - OTP authentication

### **Relationships**
- Customers have many instruments
- Instruments have many certificates
- Certificates belong to customers and instruments
- Users can create certificates
- Staff can manage equipment

## 🎯 **User Roles**

### **Admin**
- Full system access
- User management
- System configuration
- Reports and analytics
- Database management

### **Staff**
- Certificate management
- Customer service
- Equipment management
- Calibration tracking
- PDF generation

### **Customer**
- View certificates
- Download PDFs
- Manage profile
- Set notifications
- Track instruments

## 🔧 **Development**

### **Local Development**
```bash
# Start local server (if Python available)
python -m http.server 8000

# Or open directly in browser
start index.html
```

### **Testing**
- **Connection test:** `test-supabase.html`
- **Offline test:** `test-offline.html`
- **Database manager:** `supabase-database-manager.html`

## 📞 **Support**

### **Documentation**
- [Supabase Setup Guide](SUPABASE_SETUP.md)
- [Netlify Deployment Guide](netlify-deploy.md)
- [Active Directory Integration](AD_INTEGRATION_GUIDE.md)
- [Troubleshooting Guide](TROUBLESHOOTING.md)

### **Common Issues**
1. **Supabase connection failed** - Check credentials and database schema
2. **PDF generation not working** - Check browser console for errors
3. **Login not working** - Verify credentials and Supabase connection
4. **Mobile issues** - Check responsive design and touch events

## 🤝 **Contributing**

1. **Fork the repository**
2. **Create feature branch:** `git checkout -b feature/new-feature`
3. **Commit changes:** `git commit -m 'Add new feature'`
4. **Push to branch:** `git push origin feature/new-feature`
5. **Create Pull Request**

## 📄 **License**

This project is proprietary software for JUST INSTRUMENTS Inc. All rights reserved.

## 🎉 **Acknowledgments**

- **Supabase** for backend services
- **Netlify** for hosting and deployment
- **Tailwind CSS** for styling
- **Lucide Icons** for icons
- **Chart.js** for analytics

---

**JUST INSTRUMENTS - Calibration Certificate Management Platform** 🚀