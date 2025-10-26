# Netlify Database Setup Guide

## Prerequisites
- Node.js and npm installed
- Netlify CLI installed globally
- Netlify account with a deployed site

## Option 1: Using Netlify Dashboard (Recommended)

### Step 1: Add Database via Dashboard
1. Go to your Netlify dashboard
2. Select your site
3. Go to **Functions** tab
4. Click **"Add database"** button
5. Choose **"PostgreSQL"** as database type
6. Click **"Add database"**

### Step 2: Get Database Connection Details
1. In your site dashboard, go to **Environment variables**
2. You'll see new variables like:
   - `DATABASE_URL`
   - `DB_HOST`
   - `DB_USER`
   - `DB_PASSWORD`
   - `DB_NAME`

## Option 2: Using Netlify CLI

### Step 1: Install Prerequisites
```bash
# Install Node.js from https://nodejs.org/
# Then install Netlify CLI globally
npm install -g netlify-cli
```

### Step 2: Initialize Database
```bash
# Login to Netlify
netlify login

# Link your site
netlify link

# Initialize database
npx netlify db init
```

### Step 3: Create Database Schema
```bash
# Generate migration
npx netlify db generate

# Apply migration
npx netlify db push
```

## Database Schema for JUST INSTRUMENTS

### Tables Structure

#### 1. Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL, -- 'admin', 'staff', 'customer'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. Customers Table
```sql
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    customer_id VARCHAR(50) UNIQUE NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 3. Instruments Table
```sql
CREATE TABLE instruments (
    id SERIAL PRIMARY KEY,
    instrument_name VARCHAR(255) NOT NULL,
    model VARCHAR(100),
    serial_number VARCHAR(100) UNIQUE,
    customer_id INTEGER REFERENCES customers(id),
    specifications JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 4. Certificates Table
```sql
CREATE TABLE certificates (
    id SERIAL PRIMARY KEY,
    certificate_number VARCHAR(100) UNIQUE NOT NULL,
    instrument_id INTEGER REFERENCES instruments(id),
    customer_id INTEGER REFERENCES customers(id),
    calibration_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'valid',
    pdf_path VARCHAR(500),
    qr_code VARCHAR(500),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 5. Test Equipment Table
```sql
CREATE TABLE test_equipment (
    id SERIAL PRIMARY KEY,
    equipment_name VARCHAR(255) NOT NULL,
    model VARCHAR(100),
    serial_number VARCHAR(100) UNIQUE,
    last_calibration DATE,
    next_calibration DATE,
    accuracy_specs JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 6. Calibration Staff Table
```sql
CREATE TABLE calibration_staff (
    id SERIAL PRIMARY KEY,
    staff_name VARCHAR(255) NOT NULL,
    designation VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    signature_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 7. Notifications Table
```sql
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    message TEXT,
    type VARCHAR(50), -- 'certificate_expiry', 'calibration_due', etc.
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Environment Variables

Add these to your Netlify environment variables:

```
DATABASE_URL=postgresql://username:password@host:port/database
DB_HOST=your-db-host
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=your-db-name
```

## Update Netlify Functions

### 1. Update package.json
```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.38.4",
    "pg": "^8.11.3",
    "drizzle-orm": "^0.29.0",
    "drizzle-kit": "^0.20.4"
  }
}
```

### 2. Create Database Connection
Create `netlify/functions/database.js`:

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = pool;
```

### 3. Update Functions
Update your Netlify functions to use the new database instead of Supabase.

## Testing Database Connection

### Test Function
Create `netlify/functions/test-db.js`:

```javascript
const pool = require('./database');

exports.handler = async (event, context) => {
  try {
    const result = await pool.query('SELECT NOW() as current_time');
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Database connected successfully',
        time: result.rows[0].current_time
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};
```

## Deployment

1. Commit your changes
2. Push to your repository
3. Netlify will automatically deploy with the new database
4. Test your functions at `https://your-site.netlify.app/.netlify/functions/test-db`

## Benefits of Netlify Database

- ✅ **Zero Configuration** - No server setup required
- ✅ **Automatic Scaling** - Handles traffic spikes
- ✅ **Integrated** - Works seamlessly with Netlify Functions
- ✅ **Secure** - Built-in security and backups
- ✅ **Cost Effective** - Pay only for what you use
- ✅ **PostgreSQL** - Full SQL database with advanced features

## Next Steps

1. Set up the database using one of the methods above
2. Update your Netlify functions to use the new database
3. Test the connection and functionality
4. Deploy and monitor your application

Your JUST INSTRUMENTS calibration platform will now have a robust, scalable database backend! 🎉
