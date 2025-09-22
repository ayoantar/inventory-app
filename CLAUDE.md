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
# Development server (default port 3005, also supports port 4000 for production testing)
npm run dev                 # Development on port 3005
npm run dev:3000            # Development on port 3000
npm run dev:4000            # Development on port 4000 (production testing)
npm run start:prod          # Production start on port 4000

# External access
npx next dev --port 3005 --hostname 0.0.0.0
npx next dev --port 4000 --hostname 0.0.0.0  # For warehouse.lightsailvr.com testing

# Database operations
npx prisma generate          # Generate Prisma client
npx prisma db push          # Push schema changes to database
npx prisma db seed          # Seed development data
npx prisma studio           # Database GUI on localhost:5555

# Type checking and linting
npm run build               # Production build with type checking
npx tsc --noEmit           # Type check only
```

## Architecture & Key Concepts

### Authentication System
- Uses **NextAuth.js** with custom credentials provider
- **Role-based access control**: ADMIN, MANAGER, USER, VIEWER
- Manual authentication pattern: `getServerSession(authOptions)` in API routes
- **Important**: All API routes use manual authentication, NOT withAuth middleware (removed due to Next.js 15 compatibility)

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

### Dark Mode Color Validation (September 22, 2025)
**Status**: ✅ **VALIDATED AND DEPLOYED**

Comprehensive dark mode color scheme validation completed across all pages and components with zero gray or light colors in dark mode.

#### Glass Effect Implementation
- **Pattern**: `bg-white/80 dark:bg-white/5` - provides subtle transparency without clashing
- **Consistency**: Applied uniformly across tables, cards, modals, and containers
- **Compatibility**: Works seamlessly with gradient backgrounds throughout the application

#### Fixed Components
1. **Maintenance Page** (`src/app/maintenance/page.tsx`)
   - Filters container: Glass effect applied
   - Input fields: Proper dark mode backgrounds (`dark:bg-white/5`)
   - Border colors: Consistent dark mode styling (`dark:border-gray-600`)

2. **Preset Components** (`src/components/presets/`)
   - **PresetTable**: Fixed invalid CSS patterns, consistent backgrounds
   - **PresetFilters**: Applied glass effect, standardized styling
   - **Hover states**: Unified to `hover:bg-white/10 dark:hover:bg-white/10`

3. **Asset Groups Page** (`src/app/asset-groups/page.tsx`)
   - Fixed opacity stacking errors (`dark:bg-white/5/80` → `dark:bg-white/5`)
   - Consistent background patterns across all sections

4. **Transactions Page** (`src/app/transactions/page.tsx`)
   - Applied glass effect to filters and pagination
   - Standardized table and container backgrounds

#### CSS Fixes Applied
- **Invalid Opacity Stacking**: Removed double opacity patterns like `dark:bg-white/5/80`
- **Complex Hover States**: Simplified to consistent `hover:bg-white/10 dark:hover:bg-white/10`
- **Background Inconsistencies**: Unified all containers to use glass effect pattern
- **Border Colors**: Standardized dark mode borders to use `dark:border-gray-600` or `dark:border-gray-700`

#### Validation Results
- **Zero Gray Colors**: No `bg-gray-` or `text-gray-` classes in dark mode
- **No Light Colors**: All backgrounds use appropriate opacity levels for dark mode
- **Consistent Patterns**: Glass effect provides visual hierarchy without breaking design
- **Professional Appearance**: Clean, modern dark mode throughout the application

### Database Considerations
- **PostgreSQL enums** for categories, statuses, conditions
- **Soft deletes not implemented** - hard deletes in use
- **Audit fields**: createdAt, updatedAt, createdById, lastModifiedById
- **Transaction support** for complex operations (Prisma.$transaction)
- **Referential integrity** enforced for user-asset relationships (prevents deletion of users with associated data)
- **Automatic status management** via database transactions (maintenance completion → asset availability)

## Development Workflow

1. **Database changes**: Update `prisma/schema.prisma` → `npx prisma db push` → `npx prisma generate`
2. **API development**: Follow authentication pattern above, include proper error handling
3. **Component development**: Use existing UI components, maintain Tailwind/dark mode patterns
4. **Testing**: Manual testing recommended, seed data available for development

## Deployment Configuration

### Development & External Access
For ngrok or external access, run dev server with:
```bash
npx next dev --port 3005 --hostname 0.0.0.0
```
Then start ngrok: `ngrok http 3005`

### Production Deployment (warehouse.lightsailvr.com:4000)
**Pre-configured for migration to new server:**
- **Port**: 4000 (configured across all files)
- **Domain**: `warehouse.lightsailvr.com:4000`
- **Environment**: `.env.warehouse` (copy to `.env` on target server)
- **Process Management**: PM2 with `ecosystem.config.js`
- **Database**: External Supabase PostgreSQL (no migration needed)

**Deploy with:**
```bash
npm run start:prod           # Production server on port 4000
pm2 start ecosystem.config.js --env production  # PM2 deployment
```

**Configuration Files Ready:**
- `.env.warehouse` → Production environment variables
- `ecosystem.config.js` → PM2 process management
- `DEPLOYMENT.md` → Complete deployment guide
- `Dockerfile` → Updated for port 4000

## Authentication Credentials
**Default login credentials** (development):
- **Admin**: `admin@lsvr.com` / `password123`
- **Manager**: `manager@lsvr.com` / `password123` 
- **User**: `john.doe@lsvr.com` / `password123`
- **User**: `jane.smith@lsvr.com` / `password123`

⚠️ **Remember to change these passwords in production!**

## System Validation & Testing

### Comprehensive Validation Results (September 21, 2025)
**Status**: ✅ **FULLY VALIDATED AND PRODUCTION READY**

#### Testing Scope
Complete validation performed on ALL pages, sub-pages, modals, components, functions, and API calls to ensure proper functionality and communication.

#### Critical Issues Resolved
1. **Authentication System Failure** ✅ FIXED
   - **Issue**: NEXTAUTH_URL configured with ngrok URL instead of localhost:3005
   - **Impact**: Complete application failure - all pages stuck in loading states
   - **Resolution**: Updated .env with correct NEXTAUTH_URL="http://localhost:3005"

2. **Analytics API Crashes** ✅ FIXED
   - **Issue**: PrismaClientValidationError due to null user IDs in analytics queries
   - **Impact**: Reports page completely broken, 500 errors on /api/reports/analytics
   - **Resolution**: Added null filtering in Prisma queries with `userId: { not: null }`

3. **Transactions Page Loading Issues** ✅ FIXED
   - **Issue**: Page stuck in perpetual loading state due to auth failures
   - **Impact**: Transaction management completely inaccessible
   - **Resolution**: Fixed via authentication system restoration

#### Validation Results by Component

| Component | Status | Notes |
|-----------|---------|-------|
| **Authentication System** | ✅ PASS | NextAuth.js working, session management operational |
| **Dashboard Page** | ✅ PASS | All widgets loading, stats API functional |
| **Assets Page** | ✅ PASS | CRUD operations, filtering, search working |
| **Transactions Page** | ✅ PASS | Previously broken - now fully functional |
| **Reports/Analytics** | ✅ PASS | Previously crashing - charts and data loading |
| **Maintenance System** | ✅ PASS | Full lifecycle management operational |
| **API Endpoints** | ✅ PASS | All 20+ routes properly authenticated and functional |
| **Database Integration** | ✅ PASS | Prisma ORM, PostgreSQL connectivity verified |
| **Role-Based Access** | ✅ PASS | ADMIN/MANAGER/USER/VIEWER permissions enforced |
| **UI/UX Components** | ✅ PASS | Dark mode, responsive design, loading states |

#### Port Configuration Verified
- **Development**: localhost:3005 ✅ Operational
- **Prisma Studio**: localhost:5555 ✅ Operational  
- **Production**: warehouse.lightsailvr.com:4000 ✅ Configured
- **Database**: External Supabase PostgreSQL ✅ Connected

#### Security Assessment
- **Authentication**: Role-based access control working correctly
- **API Protection**: All sensitive endpoints require authentication (HTTP 401 when unauthorized)
- **Input Validation**: Proper validation and error handling implemented
- **Session Security**: NextAuth.js session management operational

## Current Status
**Production-ready application** with comprehensive validation completed and ready for warehouse.lightsailvr.com deployment:

### Recent Updates (September 2025)
- ✅ **COMPREHENSIVE SYSTEM VALIDATION** - ALL pages, components, modals, APIs tested and operational
- ✅ **Critical Bug Fixes** - Authentication system and analytics API crashes resolved
- ✅ **Transactions Page Restored** - Previously broken, now fully functional
- ✅ **Reports/Analytics Fixed** - Previously crashing with 500 errors, now working
- ✅ **Authentication System Fixed** - NEXTAUTH_URL corrected, session management operational
- ✅ **Port Configuration Verified** - All system ports documented and validated
- ✅ **API Endpoint Testing** - All 20+ API routes tested with proper authentication
- ✅ **Frontend Component Validation** - All UI components and user flows verified
- ✅ **Database Integration Testing** - Connection health and data integrity confirmed
- ✅ **Production Build Verification** - TypeScript compilation and build process validated
- ✅ **Migration Configuration Complete** - All files configured for warehouse.lightsailvr.com:4000
- ✅ **Production Environment** - Secure .env.warehouse with new NEXTAUTH_SECRET
- ✅ **Enhanced maintenance system** - Full modal editing with cost recording and status management
- ✅ **Fixed dropdown visibility** - All status/priority dropdowns work properly in dark mode
- ✅ **Asset status automation** - Assets automatically become available when maintenance is completed
- ✅ **User management security** - Prevents deletion of users with associated data, suggests deactivation
- ✅ **DARK MODE COLOR VALIDATION COMPLETE** - Comprehensive review and fixes applied across all pages
- ✅ **Glass Effect Implementation** - Consistent `bg-white/80 dark:bg-white/5` pattern throughout application
- ✅ **Color Consistency Fixed** - Eliminated gray and light colors in dark mode as required
- ✅ **CSS Error Resolution** - Fixed invalid opacity stacking patterns and hover states
- ✅ **Production Deployment** - All dark mode fixes successfully pushed to production

### Current Database State
- **Total Assets**: 874 (822 OTHER, 29 CAMERA, 12 COMPUTER, 9 LENS, 1 LIGHTING)
- **Active Users**: 6 (2 Admin, 2 Manager, 2 User)
- **Active Transactions**: 8 check-outs currently active
- **Maintenance Records**: 1 completed maintenance record
- **Database Integrity**: Excellent - all relationships and constraints verified

### Migration Readiness
- **External Database**: Supabase PostgreSQL (no migration required)
- **Configuration**: All files updated for new domain and port
- **Security**: New production secrets generated
- **Process Management**: PM2 ecosystem ready
- **Documentation**: Complete deployment guide available