# Installation Guide

This guide walks you through setting up CPSK-Job-Connect for local development.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.17 or higher) - [Download](https://nodejs.org/)
- **npm** (v9 or higher) - Comes with Node.js
- **Git** - [Download](https://git-scm.com/)

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/CPSKJobConnect/CPSK-Job-Connect.git
cd CPSK-Job-Connect
```

### 2. Install Dependencies

```bash
npm install
```

This will automatically run the postinstall script to generate Prisma client.

### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Then edit `.env` with your actual values (see [Environment Variables](#environment-variables) below).

### 4. Set Up the Database

Generate Prisma client and run migrations:

```bash
npx prisma generate
npx prisma db push
```

Optionally, seed the database with sample data:

```bash
npm run db:seed
```

### 5. Set Up HTTPS (Required)

This project uses HTTPS by default for secure cookies. Set up local certificates:

```bash
# Install mkcert (one-time)
# Windows: choco install mkcert (or scoop install mkcert)
# macOS: brew install mkcert
# Linux: see https://github.com/FiloSottile/mkcert

# Install local CA (one-time)
mkcert -install

# Generate certificates
mkcert -key-file certificates/localhost-key.pem -cert-file certificates/localhost.pem localhost 127.0.0.1 ::1
```

### 6. Start the Development Server

```bash
npm run dev:https
```

The app will be available at: https://localhost:3000

---

## Environment Variables

### Required Variables

| Variable | Description | How to Get |
|----------|-------------|------------|
| `DATABASE_URL` | PostgreSQL connection string (with PgBouncer) | Supabase Dashboard → Settings → Database |
| `DIRECT_URL` | Direct PostgreSQL connection (for migrations) | Supabase Dashboard → Settings → Database |
| `NEXTAUTH_SECRET` | Secret for NextAuth.js sessions | Run: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Base URL for authentication | `https://localhost:3000` |
| `LOCAL_HTTPS` | Enable secure cookies for local dev | `true` |
| `JWT_SECRET` | Secret for JWT tokens | Run: `openssl rand -hex 64` |
| `REFRESH_TOKEN_PEPPER` | Additional secret for refresh tokens | Generate a unique 64-byte value |

### Supabase Configuration

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `SUPABASE_ACCESS_TOKEN` | Supabase access token |

Get these from: https://app.supabase.com/project/_/settings/api

### Google OAuth (Optional)

| Variable | Description |
|----------|-------------|
| `GOOGLE_CLIENT_ID` | OAuth 2.0 Client ID |
| `GOOGLE_CLIENT_SECRET` | OAuth 2.0 Client Secret |

Get these from: https://console.cloud.google.com/apis/credentials

### Email Configuration

Choose one of the following options:

**Option 1: Console Logging (Development only)**
```env
EMAIL_DEV_MODE=true
```

**Option 2: Gmail SMTP**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
SMTP_FROM=Your App Name <your-email@gmail.com>
```
> Note: `SMTP_PASS` must be a Gmail App Password. Generate at: https://myaccount.google.com/apppasswords

**Option 3: Resend (Production)**
```env
RESEND_API_KEY=your-resend-api-key
```

---

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev:https` | Start development server (HTTPS) - **recommended** |
| `npm run dev` | Start development server (HTTP) - limited functionality |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run Jest tests |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run db:seed` | Seed the database |
| `npm run security:sast` | Run security static analysis |

---

## Project Structure

```
CPSK-Job-Connect/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── api/          # API routes
│   │   └── (routes)/     # Page routes
│   ├── components/       # React components
│   ├── lib/              # Utility functions & configurations
│   └── tests/            # Jest tests
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Database seed script
├── certificates/         # SSL certificates (local HTTPS)
├── public/               # Static assets
└── scripts/              # Build & utility scripts
```

---

## Troubleshooting

### Prisma Client Not Generated

If you see errors about missing Prisma client:
```bash
npx prisma generate
```

### Database Connection Issues

1. Check your `DATABASE_URL` in `.env`
2. Ensure Supabase project is running
3. Verify IP is allowed in Supabase network settings

### HTTPS Certificate Errors

If the browser shows certificate warnings:
1. Ensure `mkcert -install` was run
2. Regenerate certificates
3. Restart the browser

### Port Already in Use

Kill the process using port 3000:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :3000
kill -9 <PID>
```

---

## Next Steps

- Read the [README.md](../README.md) for project overview
- Check [.env.example](../.env.example) for all configuration options
- Run `npm test` to verify the setup
