/**
 * Client Configuration System
 * Allows per-deployment customization without code changes
 */

export interface ClientConfig {
  branding: {
    companyName: string
    logoUrl?: string
    primaryColor: string
    secondaryColor: string
    theme: 'default' | 'dark' | 'light' | 'custom'
    favicon?: string
  }
  features: {
    maintenanceModule: boolean
    qrCodes: boolean
    analytics: boolean
    bulkOperations: boolean
    excelImport: boolean
    customFields: boolean
  }
  ui: {
    defaultPageSize: number
    dateFormat: 'US' | 'EU' | 'ISO'
    currency: string
    timezone: string
  }
  auth: {
    allowRegistration: boolean
    requireEmailVerification: boolean
    passwordMinLength: number
    sessionTimeout: number // minutes
  }
  notifications: {
    email: boolean
    inApp: boolean
    overdueReminders: boolean
    maintenanceAlerts: boolean
  }
}

const getEnvBoolean = (key: string, defaultValue: boolean = false): boolean => {
  const value = process.env[key]
  if (value === undefined) return defaultValue
  return value.toLowerCase() === 'true'
}

const getEnvString = (key: string, defaultValue: string = ''): string => {
  return process.env[key] || defaultValue
}

const getEnvNumber = (key: string, defaultValue: number): number => {
  const value = process.env[key]
  if (value === undefined) return defaultValue
  const parsed = parseInt(value, 10)
  return isNaN(parsed) ? defaultValue : parsed
}

export const getClientConfig = (): ClientConfig => ({
  branding: {
    companyName: getEnvString('CLIENT_NAME', 'LSVR'),
    logoUrl: getEnvString('CLIENT_LOGO_URL'),
    primaryColor: getEnvString('CLIENT_PRIMARY_COLOR', '#f97316'),
    secondaryColor: getEnvString('CLIENT_SECONDARY_COLOR', '#64748b'),
    theme: getEnvString('CLIENT_THEME', 'default') as ClientConfig['branding']['theme'],
    favicon: getEnvString('CLIENT_FAVICON_URL')
  },
  features: {
    maintenanceModule: getEnvBoolean('ENABLE_MAINTENANCE', true),
    qrCodes: getEnvBoolean('ENABLE_QR_CODES', true),
    analytics: getEnvBoolean('ENABLE_ANALYTICS', true),
    bulkOperations: getEnvBoolean('ENABLE_BULK_OPERATIONS', true),
    excelImport: getEnvBoolean('ENABLE_EXCEL_IMPORT', true),
    customFields: getEnvBoolean('ENABLE_CUSTOM_FIELDS', false)
  },
  ui: {
    defaultPageSize: getEnvNumber('DEFAULT_PAGE_SIZE', 20),
    dateFormat: getEnvString('DATE_FORMAT', 'US') as ClientConfig['ui']['dateFormat'],
    currency: getEnvString('CURRENCY', 'USD'),
    timezone: getEnvString('TIMEZONE', 'America/New_York')
  },
  auth: {
    allowRegistration: getEnvBoolean('ALLOW_REGISTRATION', false),
    requireEmailVerification: getEnvBoolean('REQUIRE_EMAIL_VERIFICATION', false),
    passwordMinLength: getEnvNumber('PASSWORD_MIN_LENGTH', 8),
    sessionTimeout: getEnvNumber('SESSION_TIMEOUT_MINUTES', 480) // 8 hours default
  },
  notifications: {
    email: getEnvBoolean('ENABLE_EMAIL_NOTIFICATIONS', false),
    inApp: getEnvBoolean('ENABLE_IN_APP_NOTIFICATIONS', true),
    overdueReminders: getEnvBoolean('ENABLE_OVERDUE_REMINDERS', true),
    maintenanceAlerts: getEnvBoolean('ENABLE_MAINTENANCE_ALERTS', true)
  }
})

// Type-safe environment variable validation
export const validateClientConfig = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []
  
  if (!process.env.NEXTAUTH_SECRET) {
    errors.push('NEXTAUTH_SECRET is required')
  }
  
  if (!process.env.DATABASE_URL) {
    errors.push('DATABASE_URL is required')
  }
  
  if (!process.env.NEXTAUTH_URL) {
    errors.push('NEXTAUTH_URL is required')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Export singleton instance
export const clientConfig = getClientConfig()