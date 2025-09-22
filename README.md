# LSVR Inventory Management System

A modern, full-featured inventory management system designed for post-production environments, built with Next.js, TypeScript, and Tailwind CSS.

## Features

- **Asset Management**: Track and manage all your post-production assets
- **Check-in/Check-out System**: Monitor asset usage and availability
- **Barcode/QR Code Scanning**: Quick asset identification and processing
- **User Management**: Role-based access control for team collaboration
- **Maintenance Tracking**: Schedule and track asset maintenance
- **Reports & Analytics**: Comprehensive reporting and insights
- **Mobile Responsive**: Works seamlessly on desktop and mobile devices

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Database**: (To be implemented - MongoDB/PostgreSQL)
- **Authentication**: (To be implemented - NextAuth.js)

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd lsvr-inventory
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Project Structure

```
src/
├── app/              # Next.js app directory
├── components/       # Reusable UI components
├── lib/             # Utility functions and configurations
└── types/           # TypeScript type definitions
```

## Asset Categories

The system supports the following asset categories:
- Cameras
- Lenses
- Lighting Equipment
- Audio Equipment
- Computers & Hardware
- Storage Devices
- Accessories
- Furniture
- Software Licenses
- Other

## Asset Status Types

- Available
- Checked Out
- In Maintenance
- Retired
- Missing
- Reserved

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.