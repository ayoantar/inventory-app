#!/bin/bash

# LSVR Inventory Production Deployment Script
# Configures and deploys the application on port 8082 with HTTP

echo "🚀 Starting LSVR Inventory Production Deployment..."

# Stop any existing processes on port 8002
echo "📱 Stopping existing processes on port 8002..."
sudo lsof -ti:8002 | xargs kill -9 2>/dev/null || true

# Stop PM2 if running
echo "🛑 Stopping existing PM2 processes..."
pm2 stop lsvr-inventory-warehouse 2>/dev/null || true
pm2 delete lsvr-inventory-warehouse 2>/dev/null || true

# Copy production environment
echo "⚙️  Setting up production environment..."
cp .env.production .env

# Generate Prisma client
echo "🗄️  Generating Prisma client..."
npx prisma generate

# Create logs directory
echo "📝 Creating logs directory..."
mkdir -p logs

# Start application with PM2
echo "🚀 Starting application with PM2..."
pm2 start ecosystem.config.js --env production

# Show status
echo "📊 Application Status:"
pm2 status

# Show logs
echo "📋 Recent logs:"
pm2 logs lsvr-inventory-warehouse --lines 10

echo ""
echo "✅ Deployment Complete!"
echo "🌐 Application is running at: http://192.168.1.108:8002"
echo "📈 Monitor with: pm2 status"
echo "📜 View logs with: pm2 logs lsvr-inventory-warehouse"
echo "🔄 Restart with: pm2 restart lsvr-inventory-warehouse"
echo "🛑 Stop with: pm2 stop lsvr-inventory-warehouse"
echo ""
echo "🔐 Default login credentials:"
echo "   Admin: admin@lsvr.com / password123"
echo "   Manager: manager@lsvr.com / password123"
echo "   User: john.doe@lsvr.com / password123"
echo ""
echo "⚠️  Remember to change default passwords in production!"