#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting JUST INSTRUMENTS Calibration Platform...\n');

// Check if .env file exists
const fs = require('fs');
const envPath = path.join(__dirname, '.env');

if (!fs.existsSync(envPath)) {
    console.log('⚠️  No .env file found. Creating from .env.example...');
    
    if (fs.existsSync('.env.example')) {
        fs.copyFileSync('.env.example', '.env');
        console.log('✅ .env file created. Please update with your Supabase credentials.\n');
    } else {
        console.log('❌ No .env.example file found. Please create a .env file with your Supabase credentials.\n');
    }
}

// Start the application
const app = spawn('node', ['app.js'], {
    stdio: 'inherit',
    shell: true
});

app.on('error', (err) => {
    console.error('❌ Failed to start application:', err);
    process.exit(1);
});

app.on('close', (code) => {
    console.log(`\n📊 Application exited with code ${code}`);
    process.exit(code);
});

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down application...');
    app.kill('SIGINT');
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down application...');
    app.kill('SIGTERM');
});
