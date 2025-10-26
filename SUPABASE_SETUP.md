# Supabase Setup Guide for JUST INSTRUMENTS

## 🚀 Quick Setup

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up/Login to your account
3. Click "New Project"
4. Choose your organization
5. Enter project details:
   - **Name:** `just-instruments`
   - **Database Password:** (generate a strong password)
   - **Region:** Choose closest to your users
6. Click "Create new project"

### 2. Get Project Credentials
1. Go to **Settings** → **API**
2. Copy the following:
   - **Project URL** (e.g., `https://your-project.supabase.co`)
   - **anon public** key
   - **service_role** key (keep this secret!)

### 3. Update Configuration
1. Open `supabase-config.js`
2. Replace the placeholder values:
   ```javascript
   const SUPABASE_CONFIG = {
       url: 'YOUR_SUPABASE_URL', // Replace with your Project URL
       anonKey: 'YOUR_SUPABASE_ANON_KEY', // Replace with your anon key
       serviceRoleKey: 'YOUR_SUPABASE_SERVICE_ROLE_KEY' // Replace with service role key
   };
   ```

### 4. Set Up Database
1. Go to **SQL Editor** in your Supabase dashboard
2. Copy the contents of `supabase-schema.sql`
3. Paste and run the SQL script
4. This will create all necessary tables and sample data

### 5. Configure Authentication
1. Go to **Authentication** → **Settings**
2. Enable **Email** authentication
3. Configure **Site URL** to your domain
4. Set up **Redirect URLs** for your app

### 6. Set Up Row Level Security (RLS)
The SQL schema includes RLS policies, but you may need to:
1. Go to **Authentication** → **Policies**
2. Review and adjust the policies as needed
3. Test with different user types

## 🔧 Configuration Details

### Environment Variables
Create a `.env` file in your project root:
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Database Tables Created
- `users` - Admin and staff users
- `customers` - Customer information
- `instruments` - Customer instruments
- `certificates` - Calibration certificates
- `test_equipment` - Calibration equipment
- `calibration_staff` - Staff members
- `notifications` - System notifications
- `reports` - Generated reports
- `customer_otp` - OTP authentication for customers

### Sample Data Included
- **Admin User:** admin@justinstruments.com / admin123
- **Staff User:** staff001 / staff123
- **Customer:** CUST-001 / OTP: 123456
- **Sample Certificate:** JIC-20241201-001
- **Sample Instruments and Equipment**

## 🔐 Authentication Flow

### Admin/Staff Authentication
1. User enters email/username and password
2. Supabase authenticates via email/password
3. User role is determined from database
4. Redirected to appropriate dashboard

### Customer Authentication
1. Customer enters Customer ID
2. System sends OTP to registered phone
3. Customer enters OTP code
4. System validates OTP and redirects to customer portal

## 📱 Real-time Features

### Subscriptions
The platform supports real-time updates for:
- New certificates
- Certificate status changes
- Notification updates
- Dashboard statistics

### WebSocket Connection
Supabase automatically handles WebSocket connections for real-time data synchronization.

## 🚀 Deployment

### Netlify Deployment
1. Connect your GitHub repository to Netlify
2. Set environment variables in Netlify dashboard
3. Deploy automatically on push

### Vercel Deployment
1. Import your project to Vercel
2. Add environment variables
3. Deploy with automatic builds

### Custom Domain
1. Configure your domain in Supabase
2. Update CORS settings
3. Set up SSL certificates

## 🔍 Testing

### Local Testing
1. Open `unified-login.html` in browser
2. Use demo credentials to test authentication
3. Check browser console for any errors

### Production Testing
1. Deploy to your hosting platform
2. Test all authentication flows
3. Verify real-time features work
4. Test on different devices and browsers

## 🛠️ Troubleshooting

### Common Issues

#### Authentication Not Working
- Check if Supabase URL and keys are correct
- Verify RLS policies are properly configured
- Check browser console for errors

#### Database Connection Issues
- Verify database is accessible
- Check if tables were created properly
- Test with sample data

#### Real-time Features Not Working
- Check WebSocket connection
- Verify subscription setup
- Test with different browsers

### Debug Mode
Enable debug mode by adding to your HTML:
```javascript
localStorage.setItem('debug', 'true');
```

## 📊 Monitoring

### Supabase Dashboard
- Monitor database usage
- Check authentication logs
- View real-time connections
- Monitor API usage

### Application Monitoring
- Check browser console for errors
- Monitor user authentication success rates
- Track certificate generation metrics

## 🔒 Security Best Practices

### API Keys
- Never expose service role key in client-side code
- Use environment variables for sensitive data
- Rotate keys regularly

### Database Security
- Enable RLS on all tables
- Use proper authentication policies
- Regular security audits

### Authentication
- Implement proper session management
- Use secure password policies
- Enable two-factor authentication for admin users

## 📞 Support

### Supabase Support
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Community](https://github.com/supabase/supabase/discussions)
- [Supabase Discord](https://discord.supabase.com)

### Project Support
- Check the GitHub repository for issues
- Review the documentation
- Contact the development team

## 🎯 Next Steps

1. **Set up your Supabase project** using this guide
2. **Configure the database** with the provided schema
3. **Update the configuration** with your credentials
4. **Test the authentication** with demo credentials
5. **Deploy to production** when ready

Your JUST INSTRUMENTS platform will be fully functional with Supabase backend! 🚀
