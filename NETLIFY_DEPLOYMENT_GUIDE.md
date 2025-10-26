# Netlify Deployment Guide

## Prerequisites
- GitHub repository with your code
- Netlify account
- Supabase project (if using Supabase functions)

## Deployment Steps

### 1. Connect Repository to Netlify
1. Go to [Netlify Dashboard](https://app.netlify.com/)
2. Click "New site from Git"
3. Choose "GitHub" and select your repository
4. Configure build settings:
   - **Build command**: `echo 'Static site - no build required'`
   - **Publish directory**: `.` (root directory)
   - **Functions directory**: `netlify/functions`

### 2. Set Environment Variables
In your Netlify dashboard, go to Site settings > Environment variables and add:

```
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NODE_ENV=production
```

### 3. Deploy
1. Click "Deploy site"
2. Netlify will automatically build and deploy your site
3. Your site will be available at `https://your-site-name.netlify.app`

## File Structure for Netlify

```
├── netlify/
│   └── functions/
│       ├── auth.js          # Authentication function
│       └── supabase.js      # Supabase operations function
├── netlify.toml             # Netlify configuration
├── package.json             # Dependencies (includes @supabase/supabase-js)
└── [your HTML files]
```

## Configuration Files

### netlify.toml
- Contains build settings, redirects, and headers
- Functions are automatically detected in `netlify/functions/`
- Redirects handle API routes and SPA routing

### package.json
- Must include `@supabase/supabase-js` dependency
- Netlify will install dependencies automatically

## Troubleshooting

### Common Issues

1. **"Cannot find module '@supabase/supabase-js'"**
   - Ensure `@supabase/supabase-js` is in your `package.json` dependencies
   - Check that the version is compatible

2. **Function timeout errors**
   - Netlify functions have a 10-second timeout limit
   - Optimize your database queries

3. **CORS errors**
   - Functions include CORS headers
   - Check that your frontend is making requests to the correct endpoints

4. **Environment variables not working**
   - Ensure variables are set in Netlify dashboard
   - Variable names must match exactly (case-sensitive)

### Testing Functions Locally

You can test your Netlify functions locally using the Netlify CLI:

```bash
npm install -g netlify-cli
netlify dev
```

## API Endpoints

Your deployed functions will be available at:
- `https://your-site.netlify.app/.netlify/functions/auth`
- `https://your-site.netlify.app/.netlify/functions/supabase`

## Security Notes

- Never commit environment variables to your repository
- Use Netlify's environment variable system
- The `SUPABASE_SERVICE_ROLE_KEY` should only be used in server-side functions
- The `SUPABASE_ANON_KEY` is safe to use in client-side code

## Monitoring

- Check Netlify dashboard for build logs
- Monitor function execution in the Functions tab
- Set up notifications for failed deployments
