/**
 * Custom HTTPS Development Server for Next.js
 *
 * This server enables HTTPS for local development using mkcert-generated certificates.
 *
 * Setup Instructions:
 * 1. Install mkcert: https://github.com/FiloSottile/mkcert
 *    - Windows: choco install mkcert (or scoop install mkcert)
 *    - macOS: brew install mkcert
 *    - Linux: See mkcert GitHub for instructions
 *
 * 2. Generate certificates:
 *    mkcert -install
 *    mkcert -key-file certificates/localhost-key.pem -cert-file certificates/localhost.pem localhost 127.0.0.1 ::1
 *
 * 3. Run the server:
 *    npm run dev:https
 */

const { createServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

// Certificate file paths
const certDir = path.join(__dirname, 'certificates');
const keyPath = path.join(certDir, 'localhost-key.pem');
const certPath = path.join(certDir, 'localhost.pem');

// Check if certificates exist
if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
  console.error('\n❌ SSL certificates not found!\n');
  console.error('Please generate certificates using mkcert:\n');
  console.error('  1. Install mkcert (if not already installed):');
  console.error('     - Windows: choco install mkcert');
  console.error('     - macOS: brew install mkcert');
  console.error('     - Linux: See https://github.com/FiloSottile/mkcert\n');
  console.error('  2. Install local CA:');
  console.error('     mkcert -install\n');
  console.error('  3. Generate certificates:');
  console.error('     mkcert -key-file certificates/localhost-key.pem -cert-file certificates/localhost.pem localhost 127.0.0.1 ::1\n');
  process.exit(1);
}

const httpsOptions = {
  key: fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPath),
};

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const sanitizeForLog = (value) => {
  if (typeof value !== 'string') return '[non-string]';
  // Strip control characters (incl. newlines, tabs, escape sequences) to avoid log forging
  const cleaned = value.replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ');
  return cleaned.length > 2048 ? `${cleaned.slice(0, 2048)}...` : cleaned;
};

app.prepare().then(() => {
  createServer(httpsOptions, async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      const safeUrl = sanitizeForLog(req.url || '');
      console.error('Error occurred handling request', { url: safeUrl, error: err });
      res.statusCode = 500;
      res.end('Internal server error');
    }
  })
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`\n🔒 HTTPS Server ready at https://${hostname}:${port}\n`);
    });
});
