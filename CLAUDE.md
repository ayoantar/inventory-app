# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **LSVR Inventory Management System**, a modern full-stack web application for post-production asset management. It handles equipment tracking, check-in/check-out operations, maintenance scheduling, and comprehensive reporting.

## Technology Stack

- **Next.js 15** (App Router) with React 19 and TypeScript
- **PostgreSQL** with **Prisma ORM** (v6.13.0)
- **NextAuth.js** for authentication
- **Tailwind CSS** with dark mode support
- **Recharts** for analytics visualization
- **Headless UI** for accessible modal components

## Development Commands

```bash
# Development server
npm run dev                 # Development server on port 3005

# Production server
npm run start:prod          # Production server on port 8083

# Database and Tools
npx prisma studio           # Prisma Studio GUI on port 5555
npx prisma generate         # Generate Prisma client
npx prisma db push          # Push schema changes to database
npx prisma db seed          # Seed development data

# Build and Type checking
npm run build               # Production build with type checking
npx tsc --noEmit           # Type check only

# External access (for ngrok or remote development)
npx next dev --port 3005 --hostname 0.0.0.0    # Development with external access
```

## Server Configuration

### Development Server
- **Port**: 3005
- **URL**: http://localhost:3005
- **Environment**: `.env` or `.env.development`

### Production Server
- **Port**: 8083
- **URL**: https://localhost:8083 or https://warehouse.lightsailvr.com:8083
- **Environment**: `.env.production`
- **SSL**: Uses certificates from `/etc/ssl/warehouse/`

### Database Servers
- **Prisma Studio**: http://localhost:5555
- **Supabase PostgreSQL**: aws-0-us-west-1.pooler.supabase.com:5432 (external managed database)

## Architecture & Key Concepts

### Authentication System
- Uses **NextAuth.js** with custom credentials provider
- **Role-based access control**: ADMIN, MANAGER, USER, VIEWER
- Manual authentication pattern: `getServerSession(authOptions)` in API routes
- **Important**: All API routes use manual authentication, NOT withAuth middleware

### Database Models (Prisma)
- **Asset**: Core inventory items with categories, status, condition
- **AssetTransaction**: Check-in/out tracking with user assignment
- **MaintenanceRecord**: Preventive/corrective maintenance scheduling
- **AssetGroup**: Grouping related assets
- **User**: Authentication with role-based permissions

### API Route Pattern
```typescript
export async function GET/POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  // ... route logic
}
```

### Key Directories
- `/src/app/api/` - All API endpoints (20+ routes)
- `/src/components/` - Reusable UI components organized by feature
- `/src/lib/` - Utilities including auth, permissions, database config
- `/prisma/` - Database schema, migrations, seed data

## Core Features

### Asset Management
- Full CRUD with advanced filtering (category, status, condition, price ranges, dates)
- **Bulk operations** for multiple assets (status updates, deletion, export)
- **Excel import/export** with sophisticated header mapping
- **QR code generation** and scanning integration
- Image upload support (URL-based)

### Check-in/Check-out System
- Transaction tracking with expected/actual return dates
- Automatic asset status updates (AVAILABLE ↔ CHECKED_OUT)
- Overdue monitoring and user assignment

### Maintenance System
- **Comprehensive maintenance management** with full lifecycle tracking
- **Interactive status updates**: SCHEDULED → IN_PROGRESS → COMPLETED → CANCELLED/OVERDUE
- **Priority management**: LOW → MEDIUM → HIGH → CRITICAL (fully editable)
- **Cost recording**: Estimated vs actual cost tracking with currency formatting
- **Detailed maintenance modal**: View/edit all maintenance information in one place
- **Asset status integration**: Assets automatically become AVAILABLE when maintenance completed
- **Rich documentation**: Notes and completion notes for detailed maintenance records
- **Date tracking**: Scheduled date and actual performed date recording
- **User assignment**: Track who created and performed maintenance

### Analytics & Reporting
- Dashboard with KPI widgets using Recharts
- Asset utilization and cost trend analysis
- Comprehensive Excel exports for all data

## Important Implementation Notes

### Security & Permissions
- Permission system in `/src/lib/permissions.ts` controls access by user role
- All sensitive operations require appropriate role validation
- Database operations use Prisma for SQL injection protection

### State Management
- No external state library - uses React state and server state
- Form handling with Next.js built-in patterns
- Real-time updates through API refetching

### UI/UX Patterns
- **Dark mode throughout application** (Tailwind dark: classes)
- **Responsive design** with mobile-first approach
- **Loading states and error boundaries** for all async operations
- **Consistent component patterns** in `/src/components/ui/`
- **Interactive dropdowns** with proper dark mode contrast and readable option text
- **Modal-based editing** using Headless UI with smooth transitions
- **Form validation** and user feedback for all input operations
- **Real-time updates** with optimistic UI patterns

### Glass Effect Implementation
- **Pattern**: `bg-white/80 dark:bg-white/5` - provides subtle transparency without clashing
- **Consistency**: Applied uniformly across tables, cards, modals, and containers
- **Compatibility**: Works seamlessly with gradient backgrounds throughout the application

## Database Configuration

### External Database (Supabase)
- **Provider**: Supabase PostgreSQL
- **Connection**: Configured in `.env.production`
- **SSL**: Not explicitly enabled (warning appears in logs)
- **Connection Pool**: Configured for production use
- **No migration needed**: Database is externally managed

### Database Considerations
- **PostgreSQL enums** for categories, statuses, conditions
- **Soft deletes not implemented** - hard deletes in use
- **Audit fields**: createdAt, updatedAt, createdById, lastModifiedById
- **Transaction support** for complex operations (Prisma.$transaction)
- **Referential integrity** enforced for user-asset relationships
- **Automatic status management** via database transactions

## Production Deployment

### PM2 Process Management
- **Configuration**: `ecosystem.config.js`
- **Environment**: `.env.production`
- **Port**: 8083
- **SSL**: HTTPS with self-signed certificates
- **Process**: `lsvr-inventory-warehouse`

### Deployment Commands
```bash
# Build and start
npm run build               # Build the application
pm2 start ecosystem.config.js --env production  # Start with PM2
pm2 restart lsvr-inventory-warehouse --update-env  # Restart with new env vars

# Monitoring
pm2 list                    # List all processes
pm2 logs lsvr-inventory-warehouse  # View logs
pm2 env lsvr-inventory-warehouse   # Check environment variables
```

## Authentication Credentials
**Default login credentials** (development):
- **Admin**: `admin@lsvr.com` / `password123`
- **Manager**: `manager@lsvr.com` / `password123`
- **User**: `john.doe@lsvr.com` / `password123`
- **User**: `jane.smith@lsvr.com` / `password123`

⚠️ **Remember to change these passwords in production!**

## Current System Status

### Latest Updates (September 23, 2025)
- ✅ **PRODUCTION SERVER RESTORED** - Server successfully rebuilt and running on port 8083
- ✅ **PORT CONFIGURATION FIXED** - All configuration files updated to use correct ports
- ✅ **PM2 PROCESS MANAGEMENT** - Fresh PM2 process running with correct environment variables
- ✅ **DATABASE CONNECTIVITY VERIFIED** - API endpoints responding successfully with database operations
- ✅ **HTTPS ACCESS CONFIRMED** - Server accessible on https://localhost:8083 with SSL certificates
- ✅ **CLAUDE.MD UPDATED** - Documentation completely rewritten with accurate information

### Server Status
- **Development**: localhost:3005 ✅ Operational
- **Production**: localhost:8083 / warehouse.lightsailvr.com:8083 ✅ Operational
- **Prisma Studio**: localhost:5555 ✅ Available
- **Supabase Database**: aws-0-us-west-1.pooler.supabase.com:5432 ✅ Connected

### Database State
- **Total Assets**: 874 (various categories)
- **Active Users**: 6 (with different role levels)
- **Active Transactions**: Multiple check-outs currently active
- **Maintenance Records**: System tracking maintenance lifecycle
- **Database Integrity**: Excellent - all relationships and constraints verified

## Development Workflow

1. **Database changes**: Update `prisma/schema.prisma` → `npx prisma db push` → `npx prisma generate`
2. **API development**: Follow authentication pattern above, include proper error handling
3. **Component development**: Use existing UI components, maintain Tailwind/dark mode patterns
4. **Testing**: Manual testing recommended, seed data available for development

## Important Instructions

Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.