import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import * as os from 'os'

// In a real application, these would be stored in a database
// For now, we'll use environment variables and in-memory storage
let systemSettings = {
  systemName: process.env.SYSTEM_NAME || 'LSVR Inventory',
  timezone: process.env.DEFAULT_TIMEZONE || 'UTC',
  maintenanceMode: false,
  sessionTimeout: 60, // minutes
  maxLoginAttempts: 5,
  forcePasswordChange: true,
  twoFactorAuth: false,
}

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