/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  // Enable standalone output for Docker deployment
  output: 'standalone',
  
  // Optimize for production builds
  outputFileTracingExcludes: {
    '*': [
      'node_modules/@swc/core-linux-x64-gnu',
      'node_modules/@swc/core-linux-x64-musl',
      'node_modules/@esbuild/linux-x64',
    ],
  },
  
  allowedDevOrigins: [
    'ea64241f399b.ngrok-free.app',
    'warehouse.lightsailvr.com',
    'warehouse.lightsailvr.com:4000',
  ],
  
  // Environment-based configuration
  env: {
    CLIENT_NAME: process.env.CLIENT_NAME,
    CLIENT_PRIMARY_COLOR: process.env.CLIENT_PRIMARY_COLOR,
    CLIENT_SECONDARY_COLOR: process.env.CLIENT_SECONDARY_COLOR,
  },
  
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },
};

module.exports = nextConfig;