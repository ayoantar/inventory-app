// Production configuration management
export const config = {
  // Environment
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',

  // Database
  database: {
    url: process.env.DATABASE_URL!,
    connectionLimit: parseInt(process.env.DATABASE_CONNECTION_LIMIT || '20'),
    poolTimeout: parseInt(process.env.DATABASE_POOL_TIMEOUT || '20'),
    statementTimeout: parseInt(process.env.DATABASE_STATEMENT_TIMEOUT || '30000'),
  },

  // Authentication
  auth: {
    nextAuthUrl: process.env.NEXTAUTH_URL!,
    nextAuthSecret: process.env.NEXTAUTH_SECRET!,
    sessionMaxAge: parseInt(process.env.SESSION_MAX_AGE || '86400'), // 24 hours
    sessionUpdateAge: parseInt(process.env.SESSION_UPDATE_AGE || '3600'), // 1 hour
  },

  // Security
  security: {
    csrfSecret: process.env.CSRF_SECRET || 'default-csrf-secret-change-in-production',
    encryptionKey: process.env.ENCRYPTION_KEY || 'default-encryption-key-32-chars!!',
    enableHsts: process.env.ENABLE_HSTS === 'true',
    hstsMaxAge: parseInt(process.env.HSTS_MAX_AGE || '31536000'),
    enableCsp: process.env.ENABLE_CSP === 'true',
  },

  // Rate Limiting
  rateLimit: {
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
  },

  // File Upload
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
    allowedTypes: (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/webp,application/pdf').split(','),
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'error' : 'debug'),
    enableAuditLogs: process.env.ENABLE_AUDIT_LOGS === 'true',
    retentionDays: parseInt(process.env.LOG_RETENTION_DAYS || '90'),
  },

  // Performance
  performance: {
    enableCompression: process.env.ENABLE_COMPRESSION === 'true',
    staticFileCacheMaxAge: parseInt(process.env.STATIC_FILE_CACHE_MAX_AGE || '86400'),
  },

  // Email
  email: {
    smtpHost: process.env.SMTP_HOST,
    smtpPort: parseInt(process.env.SMTP_PORT || '587'),
    smtpSecure: process.env.SMTP_SECURE === 'true',
    smtpUser: process.env.SMTP_USER,
    smtpPass: process.env.SMTP_PASS,
    fromEmail: process.env.FROM_EMAIL || 'noreply@lsvr-inventory.com',
  },

  // Monitoring
  monitoring: {
    enableHealthChecks: process.env.ENABLE_HEALTH_CHECKS === 'true',
    healthCheckEndpoint: process.env.HEALTH_CHECK_ENDPOINT || '/api/health',
  },

  // Backup
  backup: {
    enableAutomatedBackups: process.env.ENABLE_AUTOMATED_BACKUPS === 'true',
    schedule: process.env.BACKUP_SCHEDULE || '0 2 * * *', // Daily at 2 AM
    retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30'),
  },
}

// Validate required configuration
export function validateConfig() {
  const required = [
    'DATABASE_URL',
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET'
  ]

  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }

  // Additional production validations
  if (config.isProduction) {
    if (config.auth.nextAuthSecret.length < 32) {
      throw new Error('NEXTAUTH_SECRET must be at least 32 characters long in production')
    }

    if (config.security.encryptionKey.length !== 32) {
      throw new Error('ENCRYPTION_KEY must be exactly 32 characters long')
    }

    if (!config.database.url.includes('ssl=true') && !config.database.url.includes('sslmode=require')) {
      console.warn('⚠️  Database SSL is not explicitly enabled. Consider enabling SSL for production.')
    }
  }
}

// Initialize configuration on load
try {
  validateConfig()
  console.log(`✅ Configuration loaded for ${config.nodeEnv} environment`)
} catch (error) {
  console.error('❌ Configuration validation failed:', error)
  if (config.isProduction) {
    process.exit(1)
  }
}