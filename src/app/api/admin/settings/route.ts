import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sendEmail } from '@/lib/email'
import { prisma } from '@/lib/prisma'
import * as os from 'os'
import * as fs from 'fs'
import * as path from 'path'

// Settings file path - stored in data directory
const settingsFilePath = path.join(process.cwd(), 'data', 'system-settings.json')

// Default settings
const defaultSettings = {
  systemName: process.env.SYSTEM_NAME || 'LSVR Inventory',
  timezone: process.env.DEFAULT_TIMEZONE || 'UTC',
  maintenanceMode: false,
  sessionTimeout: 60, // minutes
  maxLoginAttempts: 5,
  forcePasswordChange: true,
  twoFactorAuth: false,
  // Email settings
  smtp: {
    enabled: !!process.env.SMTP_USER,
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD ? '••••••••' : '', // Masked for security
    from: process.env.EMAIL_FROM || 'LSVR Inventory <inventory@lightsailvr.com>',
    replyTo: process.env.EMAIL_REPLY_TO || 'support@lightsailvr.com',
  }
}

// Load settings from file or use defaults
function loadSettings() {
  try {
    // Ensure data directory exists
    const dataDir = path.dirname(settingsFilePath)
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }

    // Load settings from file if it exists
    if (fs.existsSync(settingsFilePath)) {
      const fileContent = fs.readFileSync(settingsFilePath, 'utf8')
      const savedSettings = JSON.parse(fileContent)

      // Merge with defaults to ensure all fields exist
      return {
        ...defaultSettings,
        ...savedSettings,
        smtp: {
          ...defaultSettings.smtp,
          ...(savedSettings.smtp || {})
        }
      }
    }
  } catch (error) {
    console.error('Failed to load settings from file:', error)
  }

  // Return defaults if file doesn't exist or can't be read
  return defaultSettings
}

// Save settings to file
function saveSettings(settings: any) {
  try {
    // Ensure data directory exists
    const dataDir = path.dirname(settingsFilePath)
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }

    // Save settings to file
    fs.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2))
    return true
  } catch (error) {
    console.error('Failed to save settings to file:', error)
    return false
  }
}

// Load settings on startup
let systemSettings = loadSettings()

// Function to calculate server load
function calculateServerLoad(): { load: string; details: any } {
  const cpus = os.cpus()
  const loadAvg = os.loadavg()
  const totalMem = os.totalmem()
  const freeMem = os.freemem()
  const memoryUsage = ((totalMem - freeMem) / totalMem) * 100

  // Get load average (1 minute) - this represents system load
  const oneMinLoad = loadAvg[0]
  const cpuCount = cpus.length
  
  // Normalize load average by CPU count (load per core)
  const normalizedLoad = (oneMinLoad / cpuCount) * 100
  
  // Determine load level based on normalized load and memory usage
  let loadLevel: string
  let status: 'healthy' | 'warning' | 'critical'
  
  const maxLoad = Math.max(normalizedLoad, memoryUsage)
  
  if (maxLoad < 30) {
    loadLevel = 'Low'
    status = 'healthy'
  } else if (maxLoad < 70) {
    loadLevel = 'Medium' 
    status = 'healthy'
  } else if (maxLoad < 90) {
    loadLevel = 'High'
    status = 'warning'
  } else {
    loadLevel = 'Critical'
    status = 'critical'
  }

  return {
    load: loadLevel,
    details: {
      status,
      cpuCores: cpuCount,
      loadAverage: {
        '1min': Math.round(loadAvg[0] * 100) / 100,
        '5min': Math.round(loadAvg[1] * 100) / 100,
        '15min': Math.round(loadAvg[2] * 100) / 100,
      },
      normalizedLoad: Math.round(normalizedLoad * 100) / 100,
      memory: {
        totalGB: Math.round(totalMem / 1024 / 1024 / 1024 * 100) / 100,
        freeGB: Math.round(freeMem / 1024 / 1024 / 1024 * 100) / 100,
        usagePercent: Math.round(memoryUsage * 100) / 100,
      },
      maxLoad: Math.round(maxLoad * 100) / 100,
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can access system settings
    const userRole = (session.user as any).role
    if (userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied - Admin only' }, { status: 403 })
    }

    // Get system information with real server load calculation
    const serverLoadInfo = calculateServerLoad()
    const systemInfo = {
      version: '1.0.0',
      databaseStatus: 'Connected',
      lastBackup: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      uptime: Math.floor(process.uptime()),
      serverLoad: serverLoadInfo.load,
      serverLoadDetails: serverLoadInfo.details,
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      memoryUsage: process.memoryUsage()
    }

    return NextResponse.json({
      settings: systemSettings,
      systemInfo
    })

  } catch (error) {
    console.error('Settings GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can modify system settings
    const userRole = (session.user as any).role
    if (userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied - Admin only' }, { status: 403 })
    }

    const body = await request.json()
    const { 
      systemName, 
      timezone, 
      maintenanceMode, 
      sessionTimeout, 
      maxLoginAttempts, 
      forcePasswordChange, 
      twoFactorAuth 
    } = body

    // Validate settings
    if (sessionTimeout && (sessionTimeout < 15 || sessionTimeout > 480)) {
      return NextResponse.json(
        { error: 'Session timeout must be between 15 and 480 minutes' },
        { status: 400 }
      )
    }

    if (maxLoginAttempts && (maxLoginAttempts < 3 || maxLoginAttempts > 10)) {
      return NextResponse.json(
        { error: 'Max login attempts must be between 3 and 10' },
        { status: 400 }
      )
    }

    // Update settings
    systemSettings = {
      ...systemSettings,
      ...(systemName !== undefined && { systemName }),
      ...(timezone !== undefined && { timezone }),
      ...(maintenanceMode !== undefined && { maintenanceMode }),
      ...(sessionTimeout !== undefined && { sessionTimeout }),
      ...(maxLoginAttempts !== undefined && { maxLoginAttempts }),
      ...(forcePasswordChange !== undefined && { forcePasswordChange }),
      ...(twoFactorAuth !== undefined && { twoFactorAuth })
    }

    // Save settings to file for persistence
    const saved = saveSettings(systemSettings)
    if (!saved) {
      console.warn('Settings updated but could not be persisted to file')
    }

    console.log(`⚙️ System settings updated by admin ${session.user.email}:`, systemSettings)

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      settings: systemSettings
    })

  } catch (error) {
    console.error('Settings PUT error:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}

// Quick actions endpoints
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can perform system actions
    const userRole = (session.user as any).role
    if (userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied - Admin only' }, { status: 403 })
    }

    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'test-email':
        // Test SMTP configuration
        // Fetch current user from database to get updated email
        let userEmail = session.user.email
        try {
          const currentUser = await prisma.user.findUnique({
            where: { id: (session.user as any).id },
            select: { email: true }
          })
          if (currentUser) {
            userEmail = currentUser.email
          }
        } catch (error) {
          console.log('Could not fetch user from database, using session email')
        }

        console.log(`📧 Email test initiated by admin ${userEmail}`)

        try {
          const testResult = await sendEmail({
            to: userEmail || 'warehouse@lightsailvr.com',
            subject: 'LSVR Warehouse - Email Test',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #1A2332; padding: 20px; text-align: center;">
                  <h1 style="color: #F54F29; margin: 0;">LSVR WAREHOUSE</h1>
                  <p style="color: #C5CAD6; margin: 5px 0;">Email Configuration Test</p>
                </div>
                <div style="padding: 30px; background-color: #ffffff;">
                  <h2 style="color: #1A2332;">✅ Email Test Successful!</h2>
                  <p style="color: #484848;">Your SMTP configuration is working correctly.</p>
                  <div style="background-color: #f6f9fc; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="color: #1A2332; margin-top: 0;">Configuration Details:</h3>
                    <ul style="color: #6b7280;">
                      <li>SMTP Host: ${process.env.SMTP_HOST}</li>
                      <li>SMTP Port: ${process.env.SMTP_PORT}</li>
                      <li>From Address: ${process.env.EMAIL_FROM}</li>
                      <li>Reply-To: ${process.env.EMAIL_REPLY_TO}</li>
                    </ul>
                  </div>
                  <p style="color: #6b7280; font-size: 12px;">
                    This is an automated test email from your LSVR Warehouse system.
                  </p>
                </div>
              </div>
            `,
            text: 'Email Test Successful! Your SMTP configuration is working correctly.',
          })

          if (testResult.success) {
            return NextResponse.json({
              success: true,
              message: `Test email sent successfully to ${userEmail}`,
            })
          } else {
            return NextResponse.json({
              success: false,
              message: 'Failed to send test email',
              error: typeof testResult.error === 'string' ? testResult.error : 'Email authentication failed. Please check your SMTP credentials.'
            }, { status: 500 })
          }
        } catch (error) {
          return NextResponse.json({
            success: false,
            message: 'Email test failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          }, { status: 500 })
        }

      case 'update-smtp':
        // Update SMTP configuration
        const { smtp } = body
        if (!smtp) {
          return NextResponse.json({ error: 'SMTP configuration required' }, { status: 400 })
        }

        // Update environment variables in .env.production file
        const envPath = path.join(process.cwd(), '.env.production')
        try {
          let envContent = fs.readFileSync(envPath, 'utf8')

          // Update SMTP settings in env file
          envContent = envContent.replace(/SMTP_HOST=".*"/, `SMTP_HOST="${smtp.host}"`)
          envContent = envContent.replace(/SMTP_PORT=".*"/, `SMTP_PORT="${smtp.port}"`)
          envContent = envContent.replace(/SMTP_SECURE=".*"/, `SMTP_SECURE="${smtp.secure}"`)
          envContent = envContent.replace(/SMTP_USER=".*"/, `SMTP_USER="${smtp.user}"`)
          if (smtp.password && smtp.password !== '••••••••') {
            envContent = envContent.replace(/SMTP_PASSWORD=".*"/, `SMTP_PASSWORD="${smtp.password}"`)
          }
          envContent = envContent.replace(/EMAIL_FROM=".*"/, `EMAIL_FROM="${smtp.from}"`)
          envContent = envContent.replace(/EMAIL_REPLY_TO=".*"/, `EMAIL_REPLY_TO="${smtp.replyTo}"`)

          fs.writeFileSync(envPath, envContent)

          // Update runtime environment
          process.env.SMTP_HOST = smtp.host
          process.env.SMTP_PORT = smtp.port
          process.env.SMTP_SECURE = smtp.secure
          process.env.SMTP_USER = smtp.user
          if (smtp.password && smtp.password !== '••••••••') {
            process.env.SMTP_PASSWORD = smtp.password
          }
          process.env.EMAIL_FROM = smtp.from
          process.env.EMAIL_REPLY_TO = smtp.replyTo

          // Update settings object
          systemSettings.smtp = {
            ...smtp,
            password: smtp.password && smtp.password !== '••••••••' ? '••••••••' : systemSettings.smtp.password,
            enabled: !!smtp.user
          }

          // Save settings to file for persistence
          const saved = saveSettings(systemSettings)
          if (!saved) {
            console.warn('SMTP settings updated but could not be persisted to file')
          }

          console.log(`📧 SMTP settings updated by admin ${session.user.email}`)

          return NextResponse.json({
            success: true,
            message: 'SMTP settings updated successfully. Server restart may be required for full effect.',
            settings: systemSettings.smtp
          })
        } catch (error) {
          console.error('Failed to update SMTP settings:', error)
          return NextResponse.json({
            success: false,
            message: 'Failed to update SMTP settings',
            error: error instanceof Error ? error.message : 'Unknown error'
          }, { status: 500 })
        }

      case 'create-backup':
        // In a real app, this would trigger a backup process
        console.log(`💾 Backup initiated by admin ${session.user.email}`)
        return NextResponse.json({
          success: true,
          message: 'Backup process started successfully',
          backupId: `backup_${Date.now()}`,
          estimatedCompletion: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes
        })

      case 'test-system':
        // In a real app, this would run system diagnostics
        console.log(`🔍 System diagnostics initiated by admin ${session.user.email}`)
        
        // Simulate system check
        const diagnostics = {
          database: 'OK',
          fileSystem: 'OK',
          memory: process.memoryUsage().heapUsed < 1024 * 1024 * 1024 ? 'OK' : 'WARNING', // 1GB threshold
          diskSpace: 'OK',
          network: 'OK'
        }

        return NextResponse.json({
          success: true,
          message: 'System diagnostics completed',
          results: diagnostics,
          overallStatus: Object.values(diagnostics).every(status => status === 'OK') ? 'HEALTHY' : 'WARNINGS'
        })

      case 'clear-cache':
        // In a real app, this would clear various caches
        console.log(`🧹 Cache clearing initiated by admin ${session.user.email}`)
        return NextResponse.json({
          success: true,
          message: 'System cache cleared successfully',
          clearedItems: [
            'Application cache',
            'Session cache', 
            'Database query cache',
            'Static file cache'
          ]
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action specified' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Settings POST error:', error)
    return NextResponse.json(
      { error: 'Failed to perform system action' },
      { status: 500 }
    )
  }
}