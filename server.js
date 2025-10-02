const { createServer } = require('https')
const { parse } = require('url')
const next = require('next')
const fs = require('fs')
const path = require('path')

// Ensure NODE_ENV is set before loading config
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production'
}

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOSTNAME || '0.0.0.0'
const port = process.env.PORT || 8083

// Determine distDir based on NODE_ENV
const distDir = process.env.NODE_ENV === 'production' ? '.next-prod' : '.next'

console.log(`Starting Next.js in ${process.env.NODE_ENV} mode with distDir: ${distDir}`)

// When using middleware `hostname` and `port` must be provided below
const app = next({
  dev,
  hostname,
  port,
  dir: '.',
  distDir
})
const handle = app.getRequestHandler()

const httpsOptions = {
  key: fs.readFileSync('/etc/letsencrypt/live/warehouse.lightsailvr.com/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/warehouse.lightsailvr.com/fullchain.pem'),
}

app.prepare().then(() => {
  createServer(httpsOptions, async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)

      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })
    .once('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, hostname, () => {
      console.log(`> Ready on https://${hostname}:${port}`)
    })
})