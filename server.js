const { createServer } = require('https')
const { parse } = require('url')
const next = require('next')
const fs = require('fs')
const path = require('path')

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOSTNAME || '0.0.0.0'
const port = process.env.PORT || 8083
const conf = require('./next.config.js')

// Get the correct distDir from config
const distDir = conf.distDir || '.next'

console.log(`Starting Next.js with distDir: ${distDir}`)

// When using middleware `hostname` and `port` must be provided below
const app = next({
  dev,
  hostname,
  port,
  dir: '.',
  conf
})
const handle = app.getRequestHandler()

const httpsOptions = {
  key: fs.readFileSync('/etc/letsencrypt/live/warehouse.lightsailvr.com/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/warehouse.lightsailvr.com/fullchain.pem'),
}

app.prepare().then(() => {
  createServer(httpsOptions, async (req, res) => {
    try {
      // Be sure to pass `true` as the second argument to `url.parse`.
      // This tells it to parse the query portion of the URL.
      const parsedUrl = parse(req.url, true)
      const { pathname, query } = parsedUrl

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