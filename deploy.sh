#!/bin/bash

# JUST INSTRUMENTS - Production Deployment Script
# This script deploys the calibration platform to production

set -e

echo "🚀 Starting JUST INSTRUMENTS Platform Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

print_status "Node.js version: $(node --version)"
print_status "npm version: $(npm --version)"

# Install dependencies
print_status "Installing dependencies..."
npm install --production

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p uploads logs ssl

# Set proper permissions
print_status "Setting permissions..."
chmod 755 uploads logs
chmod 644 *.html *.js *.json

# Copy environment file
if [ ! -f .env ]; then
    print_status "Creating .env file from template..."
    cp env.production .env
    print_warning "Please update .env file with your production values!"
fi

# Build application (if needed)
print_status "Building application..."
npm run build

# Start the application
print_status "Starting application..."

# Check if PM2 is available
if command -v pm2 &> /dev/null; then
    print_status "Using PM2 for process management..."
    pm2 start server.js --name "just-instruments" --env production
    pm2 save
    pm2 startup
    print_success "Application started with PM2"
else
    print_status "Starting with Node.js directly..."
    print_warning "Consider installing PM2 for production: npm install -g pm2"
    node server.js &
    print_success "Application started"
fi

print_success "🎉 JUST INSTRUMENTS Platform deployed successfully!"
print_status "Application is running on port 3000"
print_status "Access the platform at: http://localhost:3000"
print_status "Dashboard: http://localhost:3000/dashboard"

echo ""
echo "📋 Next Steps:"
echo "1. Update .env file with your production values"
echo "2. Set up SSL certificates in ./ssl/ directory"
echo "3. Configure your domain name"
echo "4. Set up database connection"
echo "5. Configure email and SMS services"
echo ""
echo "🔐 Default Login Credentials:"
echo "Admin: admin@justinstruments.com / admin123"
echo "Staff: staff001 / staff123"
echo ""
echo "📚 Documentation: README.md"
echo "🐳 Docker: docker-compose up -d"
echo "☁️  Cloud: Deploy to your preferred cloud provider"
