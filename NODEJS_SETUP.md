# 🚀 JUST INSTRUMENTS - Node.js Application Setup

## Overview
Your calibration platform has been converted to a full Node.js application with Express server, EJS templating, and Supabase integration.

## 📁 Project Structure
```
just-instruments/
├── app.js                 # Main Express application
├── start.js               # Application starter script
├── package.json           # Dependencies and scripts
├── .env                   # Environment variables
├── views/                 # EJS templates
│   ├── login.ejs         # Login page template
│   ├── dashboard.ejs     # Dashboard template
│   └── partials/         # Template partials
│       ├── modals.ejs    # Modal templates
│       └── scripts.ejs   # JavaScript functions
├── public/               # Static assets (CSS, JS, images)
└── netlify/             # Netlify functions (for deployment)
```

## 🛠️ Installation & Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file with your Supabase credentials:
```env
SUPABASE_URL=https://tomvzmhaarpfmiccldly.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
PORT=3000
NODE_ENV=development
```

### 3. Start the Application
```bash
# Option 1: Using the start script
node start.js

# Option 2: Direct start
node app.js

# Option 3: Development mode with auto-restart
npm run dev
```

## 🌐 Application URLs
- **Login Page**: http://localhost:3000/
- **Dashboard**: http://localhost:3000/dashboard
- **API Endpoints**: http://localhost:3000/api/

## 🔧 Features

### ✅ Server-Side Rendering
- EJS templates for dynamic content
- Server-side data loading from Supabase
- SEO-friendly HTML generation

### ✅ API Integration
- RESTful API endpoints for customers and instruments
- Supabase database integration
- Error handling and validation

### ✅ Authentication
- Login system with role-based access
- Session management
- Secure authentication flow

### ✅ Real-time Data
- Automatic data loading from Supabase
- Form submissions save to database
- Page refresh shows updated data

## 📊 API Endpoints

### Authentication
- `POST /api/auth` - User login

### Customers
- `POST /api/customers` - Create customer
- `GET /api/customers` - Get all customers
- `PUT /api/customers` - Update customer
- `DELETE /api/customers` - Delete customer

### Instruments
- `POST /api/instruments` - Create instrument
- `GET /api/instruments` - Get all instruments
- `PUT /api/instruments` - Update instrument
- `DELETE /api/instruments` - Delete instrument

## 🚀 Deployment Options

### 1. Local Development
```bash
node start.js
```

### 2. Production Deployment
```bash
NODE_ENV=production node app.js
```

### 3. Netlify Deployment
The existing Netlify functions are still available for serverless deployment.

## 🔍 Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Kill process on port 3000
   npx kill-port 3000
   ```

2. **Missing environment variables**
   - Check `.env` file exists
   - Verify Supabase credentials are correct

3. **Database connection issues**
   - Verify Supabase URL and keys
   - Check network connectivity

### Debug Mode
```bash
DEBUG=* node app.js
```

## 📝 Development Notes

- **Templates**: Use EJS syntax `<%= variable %>` for server-side rendering
- **Static Files**: Place CSS/JS/images in `public/` directory
- **API Routes**: Add new routes in `app.js`
- **Database**: All data operations go through Supabase

## 🎯 Next Steps

1. **Customize Templates**: Modify EJS files in `views/`
2. **Add Features**: Extend API endpoints in `app.js`
3. **Styling**: Add custom CSS to `public/` directory
4. **Testing**: Add unit tests for API endpoints
5. **Deployment**: Deploy to your preferred hosting platform

## 📞 Support

For issues or questions:
- Check the console logs for error messages
- Verify Supabase connection and credentials
- Ensure all dependencies are installed correctly

Your calibration platform is now a full Node.js application! 🎉
