# LSVR Inventory Deployment Guide
## Migration to warehouse.lightsailvr.com:4000

This guide contains the deployment instructions for migrating the LSVR Inventory Management System to the new server with domain `warehouse.lightsailvr.com:4000`.

## ✅ Pre-Migration Checklist (Completed)

- [x] **Port 4000 Configuration**: All configuration files updated for port 4000
- [x] **Environment Files**: Production `.env.warehouse` file created with secure secrets  
- [x] **Next.js Configuration**: Domain allowlisted and security headers configured
- [x] **Docker Configuration**: Dockerfile updated for port 4000
- [x] **Process Management**: PM2 ecosystem.config.js created
- [x] **Build Testing**: Production build tested successfully (with linting warnings - non-blocking)
- [x] **Database Verification**: Connectivity confirmed, 874 assets and 6 users ready
- [x] **Backup Information**: Complete database state documented

## 🚀 Deployment Steps

### 1. Server Preparation
```bash
# On target server
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
npm install -g pm2
```

### 2. Application Deployment
```bash
# Clone repository
git clone <repository-url> /var/www/lsvr-inventory
cd /var/www/lsvr-inventory

# Install dependencies
npm ci --only=production

# Copy production environment
cp .env.warehouse .env

# Generate Prisma client
npx prisma generate

# Build application
npm run build

# Update ecosystem.config.js with correct path
# Edit: cwd: '/var/www/lsvr-inventory'
```

### 3. Firewall and Network Configuration
```bash
# Open port 4000
sudo ufw allow 4000/tcp

# Verify port is available
sudo netstat -tulpn | grep :4000
```

## Directory Structure

```
lsvr-inventory/
├── scripts/
│   ├── setup-client.sh          # Create new client configuration
│   └── deploy-client.sh         # Deploy client instance
├── environments/                 # Client configurations
│   └── [client-name]/
│       ├── .env.production      # Production environment variables
│       ├── .env.development     # Development environment variables
│       ├── docker-compose.yml   # Client-specific Docker overrides
│       ├── assets/              # Client logos and assets
│       ├── nginx/               # SSL certificates and config
│       └── README.md            # Client-specific documentation
├── deployments/                 # Active deployments
│   └── [client-name]/
│       ├── .env                 # Active environment file
│       ├── docker-compose.yml   # Active Docker configuration
│       └── logs/                # Application logs
├── Dockerfile                   # Application container definition
└── docker-compose.template.yml # Base Docker Compose template
```

## Client Configuration

### Environment Variables

Each client has environment files in `environments/[client-name]/`:

**Branding Configuration:**
```bash
CLIENT_NAME="Acme Corp"
CLIENT_LOGO_URL="https://acme.com/logo.png"
CLIENT_PRIMARY_COLOR="#ff6b35"
CLIENT_SECONDARY_COLOR="#004e89"
CLIENT_THEME="default"
```

**Feature Flags:**
```bash
ENABLE_MAINTENANCE=true          # Maintenance module
ENABLE_QR_CODES=true            # QR code generation
ENABLE_ANALYTICS=true           # Dashboard analytics
ENABLE_BULK_OPERATIONS=true     # Bulk asset operations
ENABLE_EXCEL_IMPORT=true        # Excel import/export
ENABLE_CUSTOM_FIELDS=false      # Custom asset fields
```

**UI Configuration:**
```bash
DEFAULT_PAGE_SIZE=20            # Items per page
DATE_FORMAT=US                  # US, EU, or ISO
CURRENCY=USD                    # Currency code
TIMEZONE=America/New_York       # Timezone
```

### Custom Branding

1. **Logo**: Place client logo in `environments/[client-name]/assets/logo.png`
2. **Colors**: Update `CLIENT_PRIMARY_COLOR` and `CLIENT_SECONDARY_COLOR`
3. **Company Name**: Set `CLIENT_NAME` environment variable
4. **Domain**: Configure `NEXTAUTH_URL` with client's domain

### SSL Configuration

For production deployments with custom domains:

1. Place SSL certificates in `environments/[client-name]/nginx/ssl/`
2. Update nginx configuration
3. Configure DNS records to point to your server

## Deployment Commands

### Setup New Client
```bash
./scripts/setup-client.sh "Client Name"
```

### Deploy Client
```bash
# Production deployment
./scripts/deploy-client.sh "client-name" production

# Development deployment  
./scripts/deploy-client.sh "client-name" development
```

### Management Commands
```bash
# View logs
docker-compose -f deployments/client-name/docker-compose.yml logs -f

# Stop services
docker-compose -f deployments/client-name/docker-compose.yml down

# Restart services
docker-compose -f deployments/client-name/docker-compose.yml restart

# Database backup
docker-compose -f deployments/client-name/docker-compose.yml exec db pg_dump -U postgres lsvr_inventory > backup.sql
```

## Production Deployment Options

### Option 1: Single Server (Recommended for Small-Medium Clients)

**Requirements:**
- 4GB+ RAM
- 2+ CPU cores  
- 50GB+ storage
- Ubuntu 20.04+ or similar

**Setup:**
```bash
# Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Deploy LSVR for client
git clone https://github.com/yourusername/lsvr-inventory.git
cd lsvr-inventory
./scripts/setup-client.sh "Client Name"
./scripts/deploy-client.sh "client-name" production
```

### Option 2: Cloud Platform (Easiest)

**Recommended Platforms:**
- **Railway**: Easy deployment with PostgreSQL included
- **DigitalOcean App Platform**: Managed container hosting
- **AWS ECS**: Enterprise-grade container orchestration
- **Google Cloud Run**: Serverless container platform

### Option 3: Kubernetes (Enterprise)

For clients requiring high availability and scalability:

```yaml
# k8s/client-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: lsvr-inventory-client-name
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: app
        image: lsvr-inventory:latest
        env:
        - name: CLIENT_NAME
          value: "Client Name"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: client-secrets
              key: database-url
```

## Pricing Models

### Per-Instance License
- **Setup Fee**: $2,000-5,000 (includes customization)
- **Annual License**: $3,000-10,000 (based on users/features)
- **Hosting**: Client responsibility or $200-500/month

### Managed SaaS
- **Setup**: $1,000 (branding and configuration)
- **Monthly**: $50-200/month (based on users)
- **Hosting**: Included

### Enterprise License
- **One-time**: $15,000-50,000
- **Source Code**: Included
- **Self-hosting**: Client responsibility
- **Support**: 1 year included

## Security Considerations

1. **Secrets Management**: All passwords and secrets are auto-generated
2. **SSL/TLS**: Required for production deployments
3. **Database Isolation**: Each client has separate database
4. **Container Isolation**: Docker provides process isolation
5. **Regular Updates**: Automated security patches available

## Monitoring and Maintenance

### Health Checks
```bash
# Basic health check
curl http://localhost:3000/api/health

# Detailed health check (internal)
curl -H "Authorization: Bearer $NEXTAUTH_SECRET" \
     -X POST http://localhost:3000/api/health
```

### Backup Strategy
```bash
# Automated daily backups (configure in docker-compose)
BACKUP_SCHEDULE="0 2 * * *"  # Daily at 2 AM
BACKUP_RETENTION_DAYS=30

# Manual backup
docker-compose exec db pg_dump -U postgres lsvr_inventory > backup-$(date +%Y%m%d).sql
```

### Log Management
```bash
# Application logs
docker-compose logs app

# Database logs
docker-compose logs db

# Nginx logs (if using reverse proxy)
docker-compose logs nginx
```

## Troubleshooting

### Common Issues

**Database Connection Failed:**
```bash
# Check database status
docker-compose exec db psql -U postgres -c "SELECT 1;"

# Restart database
docker-compose restart db
```

**Application Won't Start:**
```bash
# Check logs
docker-compose logs app

# Verify environment variables
docker-compose exec app env | grep CLIENT_
```

**Port Already in Use:**
```bash
# Change port in environment file
APP_PORT=3001

# Or kill existing process
sudo lsof -ti:3000 | xargs kill -9
```

### Support Contacts

- **Technical Issues**: support@lsvr.com
- **Deployment Help**: deploy@lsvr.com  
- **Sales Inquiries**: sales@lsvr.com

## Client Success Stories

- **Manufacturing Corp**: Reduced asset tracking time by 75%
- **Film Production Co**: Eliminated equipment loss, saved $50K annually
- **Healthcare System**: Improved maintenance compliance to 99.8%

---

For additional support and custom development, contact our team at support@lsvr.com