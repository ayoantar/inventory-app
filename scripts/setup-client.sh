#!/bin/bash

# LSVR Inventory - Client Setup Script
# Usage: ./setup-client.sh <client-name>

set -e

CLIENT_NAME=$1

if [ -z "$CLIENT_NAME" ]; then
    echo "Error: Client name is required"
    echo "Usage: ./setup-client.sh <client-name>"
    exit 1
fi

echo "🏗️  Setting up new client: $CLIENT_NAME"

# Create client directory structure
CLIENT_DIR="./environments/${CLIENT_NAME}"
mkdir -p "$CLIENT_DIR"
mkdir -p "./deployments/${CLIENT_NAME}"
mkdir -p "$CLIENT_DIR/assets"  # For logos, custom assets
mkdir -p "$CLIENT_DIR/backups"

# Generate secure secrets
NEXTAUTH_SECRET=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
DB_PASSWORD=$(openssl rand -base64 16 | tr -d "=+/" | cut -c1-16)

echo "🔐 Generated secure secrets"

# Create environment file template
cat > "$CLIENT_DIR/.env.production" << EOF
# LSVR Inventory - Client Configuration for $CLIENT_NAME
# Generated on $(date)

# Client Information
CLIENT_NAME=$CLIENT_NAME

# Application Configuration
APP_PORT=3000
NEXTAUTH_URL=https://${CLIENT_NAME,,}.yourdomain.com
NEXTAUTH_SECRET=$NEXTAUTH_SECRET

# Database Configuration
DATABASE_URL=postgresql://postgres:$DB_PASSWORD@db:5432/lsvr_inventory
DB_NAME=lsvr_inventory
DB_USER=postgres
DB_PASSWORD=$DB_PASSWORD
DB_PORT=5432

# Client Branding
CLIENT_LOGO_URL=
CLIENT_PRIMARY_COLOR=#f97316
CLIENT_SECONDARY_COLOR=#64748b
CLIENT_THEME=default

# Feature Flags
ENABLE_MAINTENANCE=true
ENABLE_QR_CODES=true
ENABLE_ANALYTICS=true
ENABLE_BULK_OPERATIONS=true
ENABLE_EXCEL_IMPORT=true
ENABLE_CUSTOM_FIELDS=false

# UI Configuration
DEFAULT_PAGE_SIZE=20
DATE_FORMAT=US
CURRENCY=USD
TIMEZONE=America/New_York

# Authentication
ALLOW_REGISTRATION=false
REQUIRE_EMAIL_VERIFICATION=false
PASSWORD_MIN_LENGTH=8
SESSION_TIMEOUT_MINUTES=480

# Notifications
ENABLE_EMAIL_NOTIFICATIONS=false
ENABLE_IN_APP_NOTIFICATIONS=true
ENABLE_OVERDUE_REMINDERS=true
ENABLE_MAINTENANCE_ALERTS=true

# Email Configuration (optional)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=

# Backup Configuration
BACKUP_SCHEDULE="0 2 * * *"  # Daily at 2 AM
BACKUP_RETENTION_DAYS=30

# Monitoring (optional)
ENABLE_MONITORING=false
SENTRY_DSN=

# Additional client-specific variables
# Add any custom environment variables below:

EOF

# Create development environment file
cp "$CLIENT_DIR/.env.production" "$CLIENT_DIR/.env.development"
sed -i 's/https:\/\//http:\/\//g' "$CLIENT_DIR/.env.development"
sed -i 's/:443/:3000/g' "$CLIENT_DIR/.env.development"
sed -i 's/yourdomain.com/localhost/g' "$CLIENT_DIR/.env.development"

# Create client-specific docker-compose file
cat > "$CLIENT_DIR/docker-compose.yml" << EOF
# Docker Compose configuration for $CLIENT_NAME
# Extends the base template with client-specific overrides

version: '3.8'

services:
  app:
    build: ../..
    container_name: lsvr-inventory-${CLIENT_NAME,,}
    environment:
      - CLIENT_NAME=$CLIENT_NAME
    volumes:
      - ./assets:/app/public/client-assets:ro
      - ./backups:/app/backups

  db:
    container_name: lsvr-db-${CLIENT_NAME,,}
    volumes:
      - postgres_data_${CLIENT_NAME,,}:/var/lib/postgresql/data

volumes:
  postgres_data_${CLIENT_NAME,,}:
    driver: local

networks:
  default:
    name: lsvr-network-${CLIENT_NAME,,}
EOF

# Create README for the client
cat > "$CLIENT_DIR/README.md" << EOF
# LSVR Inventory - $CLIENT_NAME

This directory contains the deployment configuration for **$CLIENT_NAME**.

## Quick Start

\`\`\`bash
# Deploy to production
../scripts/deploy-client.sh $CLIENT_NAME production

# Deploy to development
../scripts/deploy-client.sh $CLIENT_NAME development
\`\`\`

## Configuration Files

- \`.env.production\` - Production environment variables
- \`.env.development\` - Development environment variables  
- \`docker-compose.yml\` - Client-specific Docker Compose overrides
- \`assets/\` - Client logos and custom assets
- \`backups/\` - Database backup location

## Customization

### Branding
1. Add your logo to \`assets/logo.png\`
2. Update \`CLIENT_LOGO_URL\` in environment file
3. Modify colors in \`CLIENT_PRIMARY_COLOR\` and \`CLIENT_SECONDARY_COLOR\`

### Features
Enable/disable features by setting the corresponding environment variables:
- \`ENABLE_MAINTENANCE\` - Maintenance module
- \`ENABLE_QR_CODES\` - QR code generation
- \`ENABLE_ANALYTICS\` - Dashboard analytics

### Domain Setup
1. Update \`NEXTAUTH_URL\` with your domain
2. Configure SSL certificates in nginx directory
3. Update DNS records to point to your server

## Support

Contact support for assistance with:
- Custom feature development
- Advanced configuration
- Deployment issues
- Training and onboarding

---
Generated on $(date)
EOF

# Create basic nginx configuration
mkdir -p "$CLIENT_DIR/nginx"
cat > "$CLIENT_DIR/nginx/nginx.conf" << EOF
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:3000;
    }

    server {
        listen 80;
        server_name ${CLIENT_NAME,,}.yourdomain.com;
        
        # Redirect HTTP to HTTPS
        return 301 https://\$server_name\$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name ${CLIENT_NAME,,}.yourdomain.com;

        # SSL configuration
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        location / {
            proxy_pass http://app;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }
    }
}
EOF

echo "✅ Client setup completed successfully!"
echo ""
echo "📁 Created files:"
echo "   $CLIENT_DIR/.env.production"
echo "   $CLIENT_DIR/.env.development"
echo "   $CLIENT_DIR/docker-compose.yml"
echo "   $CLIENT_DIR/README.md"
echo "   $CLIENT_DIR/nginx/nginx.conf"
echo ""
echo "📝 Next steps:"
echo "   1. Review and customize $CLIENT_DIR/.env.production"
echo "   2. Add client logo to $CLIENT_DIR/assets/logo.png"
echo "   3. Configure domain and SSL certificates"
echo "   4. Deploy with: ./scripts/deploy-client.sh $CLIENT_NAME production"
echo ""
echo "🔐 Generated secrets (save these securely):"
echo "   Database Password: $DB_PASSWORD"
echo "   NextAuth Secret: $NEXTAUTH_SECRET"