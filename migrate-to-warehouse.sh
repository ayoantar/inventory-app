#!/bin/bash

# LSVR Inventory - Simple Migration Script
# Target: warehouse.lightsailvr.com:4000
# Usage: ./migrate-to-warehouse.sh

set -e  # Exit on any error

echo "🚀 LSVR Inventory Migration to warehouse.lightsailvr.com:4000"
echo "================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TARGET_DIR="/home/apps/lsvr-apps/lsvr-inventory"
APP_PORT=4000
SERVICE_NAME="lsvr-inventory-warehouse"

echo -e "${BLUE}📋 Migration Configuration:${NC}"
echo "   Target Directory: $TARGET_DIR"
echo "   Port: $APP_PORT"
echo "   Service Name: $SERVICE_NAME"
echo "   Domain: warehouse.lightsailvr.com:4000"
echo ""

# Check if running as root or with sudo
if [[ $EUID -eq 0 ]]; then
   echo -e "${YELLOW}⚠️  Running as root. Consider using a non-root user for deployment.${NC}"
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "${BLUE}🔍 Checking prerequisites...${NC}"

# Check Node.js
if command_exists node; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js found: $NODE_VERSION${NC}"
else
    echo -e "${RED}❌ Node.js not found. Installing...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Check npm
if command_exists npm; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✅ npm found: $NPM_VERSION${NC}"
else
    echo -e "${RED}❌ npm not found. Please install Node.js first.${NC}"
    exit 1
fi

# Check PM2
if command_exists pm2; then
    echo -e "${GREEN}✅ PM2 found${NC}"
else
    echo -e "${YELLOW}⚠️  PM2 not found. Installing globally...${NC}"
    sudo npm install -g pm2
fi

# Check git
if command_exists git; then
    echo -e "${GREEN}✅ Git found${NC}"
else
    echo -e "${RED}❌ Git not found. Installing...${NC}"
    sudo apt update
    sudo apt install -y git
fi

echo ""

# Check if port is available
echo -e "${BLUE}🔍 Checking port availability...${NC}"
if netstat -tulpn 2>/dev/null | grep -q ":$APP_PORT "; then
    echo -e "${RED}❌ Port $APP_PORT is already in use!${NC}"
    echo "Current processes using port $APP_PORT:"
    netstat -tulpn | grep ":$APP_PORT "
    echo ""
    read -p "Do you want to continue anyway? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Migration cancelled."
        exit 1
    fi
else
    echo -e "${GREEN}✅ Port $APP_PORT is available${NC}"
fi

echo ""

# Create target directory
echo -e "${BLUE}📁 Setting up target directory...${NC}"
if [ -d "$TARGET_DIR" ]; then
    echo -e "${YELLOW}⚠️  Directory $TARGET_DIR already exists${NC}"
    read -p "Do you want to backup and replace it? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Creating backup..."
        sudo mv "$TARGET_DIR" "${TARGET_DIR}.backup.$(date +%Y%m%d-%H%M%S)"
        echo -e "${GREEN}✅ Backup created${NC}"
    else
        echo "Using existing directory..."
    fi
else
    echo "Creating directory $TARGET_DIR..."
    sudo mkdir -p "$TARGET_DIR"
fi

# Change ownership to current user (or apps user if exists)
DEPLOY_USER=${DEPLOY_USER:-$USER}
if id "apps" >/dev/null 2>&1; then
    DEPLOY_USER="apps"
    echo -e "${BLUE}📋 Using 'apps' user for deployment${NC}"
fi

sudo chown -R $DEPLOY_USER:$DEPLOY_USER "$TARGET_DIR"
echo -e "${GREEN}✅ Directory setup complete for user: $DEPLOY_USER${NC}"

echo ""

# Clone or update repository
echo -e "${BLUE}📦 Setting up application code...${NC}"
cd "$TARGET_DIR"

if [ -d ".git" ]; then
    echo "Updating existing repository..."
    git pull origin main
else
    echo "Cloning repository to $TARGET_DIR..."
    git clone https://github.com/ayoantar/inventory-app.git .
    git checkout main
fi

# Verify essential files exist
REQUIRED_FILES=(".env.warehouse" "package.json" "ecosystem.config.js")
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ Required file not found: $file${NC}"
        echo "Please ensure all necessary files are present."
        exit 1
    fi
done

echo -e "${GREEN}✅ Code setup complete${NC}"

echo ""

# Install dependencies
echo -e "${BLUE}📦 Installing dependencies...${NC}"
npm ci --only=production
echo -e "${GREEN}✅ Dependencies installed${NC}"

echo ""

# Setup environment
echo -e "${BLUE}⚙️  Setting up environment...${NC}"
cp .env.warehouse .env
echo -e "${GREEN}✅ Environment configuration copied${NC}"

# Generate Prisma client
echo -e "${BLUE}🗄️  Setting up database client...${NC}"
npx prisma generate
echo -e "${GREEN}✅ Prisma client generated${NC}"

echo ""

# Build application
echo -e "${BLUE}🔨 Building application...${NC}"
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build completed successfully${NC}"
else
    echo -e "${YELLOW}⚠️  Build completed with warnings (non-blocking)${NC}"
fi

echo ""

# Setup PM2
echo -e "${BLUE}🔧 Setting up PM2 process management...${NC}"

# Stop existing process if running
if pm2 list | grep -q "$SERVICE_NAME"; then
    echo "Stopping existing process..."
    pm2 stop "$SERVICE_NAME"
    pm2 delete "$SERVICE_NAME"
fi

# Update ecosystem.config.js with correct path
sed -i "s|cwd: '/path/to/lsvr-inventory'|cwd: '$TARGET_DIR'|g" ecosystem.config.js

# Start with PM2
pm2 start ecosystem.config.js --env production
echo -e "${GREEN}✅ PM2 process started${NC}"

echo ""

# Setup auto-start
echo -e "${BLUE}🔄 Setting up auto-start on boot...${NC}"
pm2 startup | tail -n 1 | sudo bash || echo "Startup script generation failed (may need manual setup)"
pm2 save
echo -e "${GREEN}✅ Auto-start configured${NC}"

echo ""

# Setup firewall
echo -e "${BLUE}🔥 Configuring firewall...${NC}"
if command_exists ufw; then
    sudo ufw allow $APP_PORT/tcp
    echo -e "${GREEN}✅ Firewall rule added for port $APP_PORT${NC}"
else
    echo -e "${YELLOW}⚠️  UFW not found. Please manually configure firewall to allow port $APP_PORT${NC}"
fi

echo ""

# Create logs directory
echo -e "${BLUE}📊 Setting up logging...${NC}"
mkdir -p logs
echo -e "${GREEN}✅ Logs directory created${NC}"

echo ""

# Wait for application to start
echo -e "${BLUE}⏳ Waiting for application to start...${NC}"
sleep 10

# Health check
echo -e "${BLUE}🏥 Performing health check...${NC}"
APP_URL="http://localhost:$APP_PORT"

# Try health check endpoint
if curl -f "$APP_URL/api/health" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Application is healthy!${NC}"
elif curl -f "$APP_URL" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Application is responding!${NC}"
else
    echo -e "${YELLOW}⚠️  Application may not be ready yet.${NC}"
    echo "Check logs with: pm2 logs $SERVICE_NAME"
fi

echo ""
echo "🎉 Migration completed!"
echo "================================================="
echo -e "${GREEN}📋 Deployment Summary:${NC}"
echo "   Application: LSVR Inventory"
echo "   Directory: $TARGET_DIR"
echo "   Port: $APP_PORT"
echo "   URL: http://localhost:$APP_PORT"
echo "   Domain: warehouse.lightsailvr.com:$APP_PORT"
echo "   PM2 Service: $SERVICE_NAME"
echo ""
echo -e "${BLUE}🔧 Management Commands:${NC}"
echo "   View logs:    pm2 logs $SERVICE_NAME"
echo "   Stop app:     pm2 stop $SERVICE_NAME"
echo "   Start app:    pm2 start $SERVICE_NAME"
echo "   Restart app:  pm2 restart $SERVICE_NAME"
echo "   App status:   pm2 status"
echo "   Monitor:      pm2 monit"
echo ""
echo -e "${BLUE}🌐 Next Steps:${NC}"
echo "   1. Configure DNS: warehouse.lightsailvr.com → $(curl -s ifconfig.me || echo 'YOUR_SERVER_IP')"
echo "   2. Test access: http://warehouse.lightsailvr.com:$APP_PORT"
echo "   3. Setup SSL certificate (optional)"
echo "   4. Change default passwords in production"
echo ""
echo -e "${YELLOW}📝 Default Login (CHANGE IN PRODUCTION):${NC}"
echo "   Admin: admin@lsvr.com / password123"
echo "   Manager: manager@lsvr.com / password123"
echo ""
echo -e "${GREEN}✅ Migration to warehouse.lightsailvr.com:$APP_PORT complete!${NC}"