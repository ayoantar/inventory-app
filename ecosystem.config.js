// PM2 Ecosystem Configuration for LSVR Inventory Production Deployment
module.exports = {
  apps: [{
    name: 'lsvr-inventory-warehouse',
    script: 'npm',
    args: 'run start:prod',
    cwd: '/home/apps/lsvr-apps/lsvr-inventory',
    
    // Environment variables
    env: {
      NODE_ENV: 'production',
      PORT: 4000,
      HOSTNAME: '0.0.0.0'
    },
    
    // Production environment variables (loaded from .env.warehouse)
    env_production: {
      NODE_ENV: 'production',
      PORT: 4000,
      HOSTNAME: '0.0.0.0'
    },
    
    // Process management
    instances: 1, // Single instance for initial deployment
    exec_mode: 'fork', // Use 'cluster' for multiple instances if needed
    
    // Restart policy
    autorestart: true,
    watch: false, // Disable in production
    max_memory_restart: '2G',
    
    // Logging
    log_file: './logs/app.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Advanced process management
    min_uptime: '10s',
    max_restarts: 3,
    restart_delay: 4000,
    
    // Environment file
    env_file: './.env.warehouse'
  }],
  
  // Deployment configuration (optional)
  deploy: {
    production: {
      user: 'deploy', // Update with actual user
      host: 'your-server-ip', // Update with actual server IP
      ref: 'origin/main',
      repo: 'git@github.com:your-username/lsvr-inventory.git', // Update with actual repo
      path: '/var/www/lsvr-inventory',
      
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npx prisma generate && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
}