import { NextRequest, NextResponse } from 'next/server'
import { checkDatabaseConnection } from '@/lib/prisma'
import { config } from '@/lib/config'

export async function GET(request: NextRequest) {
  // Basic health check endpoint for monitoring
  try {
    const checks = {
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
      database: false,
      memory: {
        used: process.memoryUsage().heapUsed,
        total: process.memoryUsage().heapTotal,
        external: process.memoryUsage().external,
      },
      uptime: process.uptime(),
    }

    // Check database connection
    try {
      checks.database = await checkDatabaseConnection()
    } catch (error) {
      console.error('Health check database error:', error)
      checks.database = false
    }

    const isHealthy = checks.database

    return NextResponse.json(
      {
        status: isHealthy ? 'healthy' : 'unhealthy',
        checks,
      },
      { 
        status: isHealthy ? 200 : 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    )
  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json(
      {
        status: 'error',
        error: 'Health check failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

// Detailed health check for internal monitoring
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    // Simple internal auth check - in production, use proper authentication
    if (authHeader !== `Bearer ${config.auth.nextAuthSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const detailedChecks = {
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
      version: process.env.npm_package_version || 'unknown',
      nodeVersion: process.version,
      platform: process.platform,
      architecture: process.arch,
      database: {
        connected: false,
        responseTime: 0,
      },
      memory: {
        used: process.memoryUsage().heapUsed,
        total: process.memoryUsage().heapTotal,
        external: process.memoryUsage().external,
        rss: process.memoryUsage().rss,
        usage: (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100,
      },
      cpu: {
        loadAverage: process.loadavg(),
      },
      uptime: {
        process: process.uptime(),
        system: require('os').uptime(),
      },
    }

    // Check database with timing
    const dbStart = Date.now()
    try {
      detailedChecks.database.connected = await checkDatabaseConnection()
      detailedChecks.database.responseTime = Date.now() - dbStart
    } catch (error) {
      console.error('Detailed health check database error:', error)
      detailedChecks.database.connected = false
      detailedChecks.database.responseTime = Date.now() - dbStart
    }

    const isHealthy = detailedChecks.database.connected && 
                     detailedChecks.memory.usage < 90 // Alert if memory usage > 90%

    return NextResponse.json(
      {
        status: isHealthy ? 'healthy' : 'unhealthy',
        checks: detailedChecks,
        alerts: [
          ...(detailedChecks.memory.usage > 90 ? ['High memory usage'] : []),
          ...(detailedChecks.database.responseTime > 5000 ? ['Slow database response'] : []),
          ...(!detailedChecks.database.connected ? ['Database connection failed'] : []),
        ],
      },
      { 
        status: isHealthy ? 200 : 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        }
      }
    )
  } catch (error) {
    console.error('Detailed health check error:', error)
    return NextResponse.json(
      {
        status: 'error',
        error: 'Detailed health check failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}