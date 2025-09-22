import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { Permission, hasPermission, canAccessResource, ResourceOwnershipContext } from './permissions'
import { UserRole } from '../../generated/prisma'

export interface AuthenticatedRequest extends NextRequest {
  user: {
    id: string
    role: UserRole
    email: string
    name?: string
    department?: string
  }
}

export async function withAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
  requiredPermissions: Permission[] = []
) {
  return async (request: NextRequest) => {
    try {
      const session = await getServerSession(authOptions)
      
      if (!session?.user?.id) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }

      // Check if user has required permissions
      const userRole = (session.user as any).role as UserRole
      if (requiredPermissions.length > 0) {
        const hasAllPermissions = requiredPermissions.every(permission =>
          hasPermission(userRole, permission)
        )

        if (!hasAllPermissions) {
          return NextResponse.json(
            { error: 'Insufficient permissions' },
            { status: 403 }
          )
        }
      }

      // Attach user to request
      const authenticatedRequest = request as AuthenticatedRequest
      authenticatedRequest.user = {
        id: session.user.id,
        role: userRole,
        email: session.user.email!,
        name: session.user.name || undefined,
        department: (session.user as any).department || undefined,
      }

      return handler(authenticatedRequest)
    } catch (error) {
      console.error('Auth middleware error:', error)
      return NextResponse.json(
        { error: 'Authentication error' },
        { status: 500 }
      )
    }
  }
}

export async function withResourceAuth<T = any>(
  handler: (req: AuthenticatedRequest, resourceContext?: ResourceOwnershipContext) => Promise<NextResponse>,
  requiredPermissions: Permission[],
  getResourceOwnerId?: (req: AuthenticatedRequest) => Promise<string | undefined>
) {
  return withAuth(async (req: AuthenticatedRequest) => {
    try {
      let resourceOwnerId: string | undefined

      // Get resource owner ID if function is provided
      if (getResourceOwnerId) {
        resourceOwnerId = await getResourceOwnerId(req)
      }

      // Check resource-level permissions
      const resourceContext: ResourceOwnershipContext = {
        userId: req.user.id,
        userRole: req.user.role,
        resourceOwnerId,
        departmentId: req.user.department,
      }

      const hasResourceAccess = requiredPermissions.every(permission =>
        canAccessResource(resourceContext, permission)
      )

      if (!hasResourceAccess) {
        return NextResponse.json(
          { error: 'Access denied to this resource' },
          { status: 403 }
        )
      }

      return handler(req, resourceContext)
    } catch (error) {
      console.error('Resource auth middleware error:', error)
      return NextResponse.json(
        { error: 'Authorization error' },
        { status: 500 }
      )
    }
  }, requiredPermissions)
}

// Rate limiting middleware
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: { maxRequests: number; windowMs: number } = { maxRequests: 100, windowMs: 60000 }
) {
  return async (request: NextRequest) => {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const now = Date.now()
    const windowStart = now - options.windowMs

    // Clean up old entries
    for (const [key, value] of rateLimitMap.entries()) {
      if (value.resetTime < windowStart) {
        rateLimitMap.delete(key)
      }
    }

    const current = rateLimitMap.get(ip) || { count: 0, resetTime: now + options.windowMs }

    if (current.count >= options.maxRequests && current.resetTime > now) {
      return NextResponse.json(
        { 
          error: 'Too many requests', 
          retryAfter: Math.ceil((current.resetTime - now) / 1000) 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((current.resetTime - now) / 1000).toString(),
            'X-RateLimit-Limit': options.maxRequests.toString(),
            'X-RateLimit-Remaining': Math.max(0, options.maxRequests - current.count).toString(),
            'X-RateLimit-Reset': new Date(current.resetTime).toISOString(),
          }
        }
      )
    }

    // Update rate limit counter
    current.count++
    rateLimitMap.set(ip, current)

    return handler(request)
  }
}

// Security headers middleware
export function withSecurityHeaders(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const response = await handler(request)

    // Add security headers
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
    
    // HSTS in production
    if (process.env.NODE_ENV === 'production') {
      response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
    }

    return response
  }
}

// Input validation middleware
export function withValidation<T>(
  handler: (req: NextRequest, validatedData: T) => Promise<NextResponse>,
  validator: (data: any) => { isValid: boolean; data?: T; errors?: string[] }
) {
  return async (request: NextRequest) => {
    try {
      const body = await request.json()
      const validation = validator(body)

      if (!validation.isValid) {
        return NextResponse.json(
          { 
            error: 'Validation failed', 
            details: validation.errors || ['Invalid input data'] 
          },
          { status: 400 }
        )
      }

      return handler(request, validation.data!)
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      )
    }
  }
}

// Audit logging middleware
export function withAuditLog(
  handler: (req: NextRequest) => Promise<NextResponse>,
  action: string,
  resource: string
) {
  return async (request: NextRequest) => {
    const startTime = Date.now()
    let response: NextResponse
    let error: any = null

    try {
      response = await handler(request)
    } catch (err) {
      error = err
      response = NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }

    // Log the request (in production, send to proper logging service)
    const duration = Date.now() - startTime
    const logData = {
      timestamp: new Date().toISOString(),
      method: request.method,
      url: request.url,
      action,
      resource,
      statusCode: response.status,
      duration,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent'),
      error: error?.message,
    }

    // In production, you would send this to a logging service like CloudWatch, DataDog, etc.
    if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify(logData))
    } else {
      console.log('Audit Log:', logData)
    }

    if (error) {
      throw error
    }

    return response
  }
}