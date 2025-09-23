# LSVR Inventory Management System - Production Setup

## Quick Deployment

Your LSVR Inventory Management System is now ready for production deployment on **port 8082** with **HTTP** to avoid SSL authentication issues.

### 🚀 Deploy to Production

```bash
# Run the deployment script
./deploy-production.sh
```

This script will:
- Stop any existing processes on port 8082
- Configure production environment
- Generate Prisma client
- Start the application with PM2
- Show status and access information

### 🌐 Access Information

- **URL**: `http://192.168.1.108:8082`
- **Port**: 8082 (configurable)
- **Protocol**: HTTP (avoids SSL authentication issues)

### 🔐 Default Login Credentials

```
Admin:   admin@lsvr.com / password123
Manager: manager@lsvr.com / password123
User:    john.doe@lsvr.com / password123
User:    jane.smith@lsvr.com / password123
```

**⚠️ IMPORTANT: Change these passwords immediately in production!**

## Manual Deployment Steps

If you prefer manual deployment:

### 1. Environment Setup
```bash
# Copy production environment
cp .env.production .env

# Generate Prisma client
npx prisma generate
```

### 2. Start with PM2
```bash
# Create logs directory
mkdir -p logs

# Start application
pm2 start ecosystem.config.js --env production

# View status
pm2 status
```

### 3. Production Management Commands

```bash
# View application status
pm2 status

# View logs
pm2 logs lsvr-inventory-warehouse

# Restart application
pm2 restart lsvr-inventory-warehouse

# Stop application
pm2 stop lsvr-inventory-warehouse

# Monitor in real-time
pm2 monit
```

## Port Configuration

### Current Setup: Port 8082
- Configured in `.env.production`
- PM2 ecosystem configured
- NEXTAUTH_URL set to `http://192.168.1.108:8082`

### To Change Port (e.g., to 8082):

1. **Update .env.production**:
   ```bash
   PORT=8082
   NEXTAUTH_URL="http://192.168.1.108:8082"
   ```

2. **Update ecosystem.config.js**:
   ```javascript
   env_production: {
     PORT: 8082,
     ...
   }
   ```

3. **Restart application**:
   ```bash
   pm2 restart lsvr-inventory-warehouse
   ```

## System Health

### Health Check Endpoint
- **URL**: `http://192.168.1.108:8082/api/health`
- **Returns**: Database status and system information

### Database
- **Type**: PostgreSQL (Supabase)
- **Status**: External hosted (no migration required)
- **Connection**: Configured in DATABASE_URL

### Authentication
- **System**: NextAuth.js with credentials provider
- **Session**: 24-hour sessions with 1-hour refresh
- **Security**: Production secrets configured

## Security Configuration

### Current Settings (HTTP Mode)
- HSTS disabled (for HTTP compatibility)
- CSRF protection enabled
- Rate limiting: 100 requests/minute
- Session security: Secure tokens and encryption

### For HTTPS (if needed later):
1. Obtain SSL certificate
2. Update NEXTAUTH_URL to https://
3. Enable HSTS in .env.production
4. Configure reverse proxy (nginx/apache)

## Monitoring and Maintenance

### PM2 Process Management
```bash
# Setup PM2 startup script (run as root)
pm2 startup
pm2 save

# View detailed process info
pm2 show lsvr-inventory-warehouse

# Reload application (zero-downtime)
pm2 reload lsvr-inventory-warehouse
```

### Log Management
- **Location**: `./logs/`
- **Files**: app.log, out.log, error.log
- **Rotation**: Configured for 90-day retention

### Backup
- **Database**: External Supabase (handles backups)
- **Application**: Standard file backup of project directory
- **Recommended**: Daily backups of logs and configuration

## Troubleshooting

### Common Issues

1. **Port Already in Use**:
   ```bash
   sudo lsof -ti:8082 | xargs kill -9
   ```

2. **PM2 Process Issues**:
   ```bash
   pm2 delete lsvr-inventory-warehouse
   pm2 start ecosystem.config.js --env production
   ```

3. **Database Connection**:
   - Check DATABASE_URL in .env
   - Test with: `npx prisma db pull`

4. **Authentication Issues**:
   - Verify NEXTAUTH_URL matches your access URL
   - Check NEXTAUTH_SECRET is set

### Useful Commands

```bash
# Check if port is available
netstat -tulpn | grep :8082

# View system resources
free -h
df -h

# Check application process
ps aux | grep node

# Test database connection
curl http://192.168.1.108:8082/api/health
```

## Production Validation

After deployment, verify:

1. ✅ Application accessible at `http://192.168.1.108:8082`
2. ✅ Login with default credentials works
3. ✅ Dashboard loads correctly
4. ✅ Database connectivity (check health endpoint)
5. ✅ PM2 process running stably
6. ✅ All main features functional

## Support

- **Health Check**: `/api/health`
- **Logs**: `pm2 logs lsvr-inventory-warehouse`
- **Status**: `pm2 status`
- **Configuration**: Check `.env` and `ecosystem.config.js`

---

**System Status**: ✅ Production Ready
**Deployment Method**: PM2 with ecosystem configuration
**Database**: External Supabase PostgreSQL
**Security**: Production environment with HTTP for local access