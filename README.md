# CPSK Job Connect

A comprehensive job-finding platform exclusive to CPSK students and alumni of Kasetsart University, connecting them with trusted recruiters and companies.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Testing](#testing)
- [Security](#security)
- [Project Structure](#project-structure)
- [Available Scripts](#available-scripts)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## Overview

CPSK Job Connect is a secure, feature-rich job portal designed specifically for Computer Science students and alumni at Kasetsart University. The platform facilitates connections between students seeking opportunities and verified companies looking for talented candidates.

### Key Users

**Students/Alumni**
- Create and manage comprehensive profiles (resume, transcript, portfolio)
- Browse and search job postings with advanced filters
- Apply for jobs and track application status
- Save favorite job postings
- Receive real-time notifications

**Companies/Recruiters**
- Create, edit, and manage job postings
- Review and manage student applications
- View detailed analytics (views, applications, conversion rates)
- Access candidate profiles and documents
- Communicate with applicants

**Administrators (Faculty Officers)**
- Approve/reject company registrations
- Verify student accounts and credentials
- Manage user accounts and permissions
- Oversee job postings and handle reports
- Monitor platform analytics and activity

## Features

### Core Functionality
- **Secure Authentication**: Email/password and Google OAuth support with NextAuth.js
- **Role-Based Access Control**: Separate interfaces for students, companies, and admins
- **Email Verification**: Automated email verification for student accounts
- **Document Management**: Secure upload and storage of resumes, transcripts, and portfolios via Supabase Storage
- **Advanced Job Search**: Filter by category, type, location, salary range, and more
- **Application Tracking**: Real-time application status updates
- **Notification System**: In-app notifications for important events
- **Company Verification**: Admin-controlled company account approval process
- **Analytics Dashboard**: Comprehensive statistics for companies and admins
- **Reporting System**: Report inappropriate content or users
- **Responsive Design**: Optimized for desktop and mobile devices

### Security Features
- CSRF protection on all state-changing endpoints
- SQL injection prevention via Prisma ORM
- XSS protection with DOMPurify sanitization
- Secure password hashing with bcrypt
- JWT token management with rotation
- Session management with token versioning
- HTTPS enforcement for production
- Content Security Policy headers
- Rate limiting on sensitive endpoints
- Input validation with Zod schemas
- Secure file upload validation

## Tech Stack

### Frontend
- **Next.js 15.5.0** - React framework with App Router and Server Components
- **TypeScript 5** - Type-safe JavaScript for robust development
- **Tailwind CSS 4** - Utility-first CSS framework
- **shadcn/ui** - Customizable UI component library
- **Mantine 8** - Component library for complex UI elements
- **React Hook Form** - Performant form handling
- **Zod** - Schema validation

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Prisma 6** - Type-safe ORM for database access
- **PostgreSQL** - Primary relational database
- **Supabase** - Storage for files and media
- **NextAuth.js 4** - Authentication solution
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT token generation

### Development & Testing
- **Jest** - JavaScript testing framework
- **React Testing Library** - Component testing
- **Cypress** - End-to-end testing
- **TypeScript** - Static type checking
- **ESLint** - Code linting
- **Prettier** - Code formatting

## Prerequisites

Before installing, ensure you have:

- **Node.js** 20.x or higher
- **npm** 10.x or higher (comes with Node.js)
- **PostgreSQL** database (or Supabase account)
- **Git** for version control

Optional but recommended:
- **mkcert** for local HTTPS development
- **Supabase CLI** for storage management

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/CPSKJobConnect/CPSK-Job-Connect.git
cd CPSK-Job-Connect
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required dependencies and run the postinstall script automatically.

### 3. Environment Setup

Copy the example environment file:

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration (see [Configuration](#configuration) section below).

## Configuration

### Required Environment Variables

Open your `.env` file and configure the following:

#### Database Configuration

```env
# Supabase PostgreSQL with connection pooling
DATABASE_URL="postgresql://postgres.YOUR_PROJECT_REF:YOUR_PASSWORD@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connect_timeout=10&statement_cache_mode=none"

# Direct connection for migrations
DIRECT_URL="postgresql://postgres.YOUR_PROJECT_REF:YOUR_PASSWORD@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"
```

**To get these values:**
1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Go to Settings > Database
3. Copy the connection strings and replace `YOUR_PROJECT_REF` and `YOUR_PASSWORD`

#### Authentication Configuration

```env
# Generate with: openssl rand -base64 32
NEXTAUTH_SECRET="your-nextauth-secret-here"

# Your application URL
NEXTAUTH_URL="https://localhost:3000"

# Local HTTPS development
LOCAL_HTTPS=true

# JWT Configuration
INTERNAL_JWT_AUDIENCE="cpsk-job-connect"
INTERNAL_JWT_ISSUER="cpsk-job-connect-auth"
INTERNAL_JWT_TOKEN_TYPE="session"

# Generate with: openssl rand -hex 64
JWT_SECRET="your-jwt-secret-here"
REFRESH_TOKEN_PEPPER="your-refresh-token-pepper-here"
```

#### Google OAuth (Optional)

```env
# Get from: https://console.cloud.google.com/apis/credentials
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

**To set up Google OAuth:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `https://localhost:3000/api/auth/callback/google`
   - `https://your-production-domain.com/api/auth/callback/google`

#### Supabase Storage Configuration

```env
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
SUPABASE_ACCESS_TOKEN=your-supabase-access-token
```

**To get these values:**
1. Go to your Supabase project
2. Navigate to Settings > API
3. Copy the Project URL and API Keys

**Set up Supabase Storage:**
1. In Supabase dashboard, go to Storage
2. Create the following buckets:
   - `documents` (for resumes, transcripts, portfolios)
   - `profile-images` (for profile pictures)
   - `company-logos` (for company logos)
3. Configure Row Level Security (RLS) policies

#### Email Configuration

Choose ONE email option:

**Option 1: Console Logging (Development Only)**
```env
EMAIL_DEV_MODE=true
```

**Option 2: Gmail SMTP (Recommended)**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
SMTP_FROM=CPSK Job Connect <your-email@gmail.com>
```

**To generate Gmail App Password:**
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable 2-Step Verification
3. Go to [App Passwords](https://myaccount.google.com/apppasswords)
4. Generate a new app password for "Mail"
5. Use this password in `SMTP_PASS`

**Option 3: Resend (Production)**
```env
RESEND_API_KEY=your-resend-api-key
```

#### Application URL

```env
# For local development
NEXT_PUBLIC_APP_URL=https://localhost:3000

# For production (update with your domain)
# NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

#### Optional: Seed Admin Account

```env
# For development only - create a default admin account
SEED_ADMIN_EMAIL=admin@cpsk.edu
SEED_ADMIN_PASSWORD=your-secure-password-here-minimum-12-chars
```

**Important:** Use a strong password (minimum 12 characters) and change it immediately after first login.

## Database Setup

### 1. Generate Prisma Client

```bash
npx prisma generate
```

### 2. Run Database Migrations

```bash
npx prisma migrate deploy
```

Or for development with migration creation:

```bash
npx prisma migrate dev
```

### 3. Seed the Database

The seed script will populate your database with:
- Account roles (Student, Company, Admin)
- Document types (Resume, Portfolio, Transcript, etc.)
- Application statuses (Pending, Reviewed, Accepted, Rejected)
- Job types (Full-time, Part-time, Internship, Contract)
- Job arrangements (On-site, Remote, Hybrid)
- Job categories (Software Development, Data Science, UI/UX Design, etc.)
- Optional admin account (if configured in `.env`)

```bash
npm run db:seed
```

**Expected output:**
```
Start seeding...
✅ Account roles seeded
✅ Document types seeded
✅ Application statuses seeded
✅ Job types seeded
✅ Job arrangements seeded
✅ Job categories seeded
⚠️  Skipping default admin creation (set SEED_ADMIN_EMAIL & SEED_ADMIN_PASSWORD to seed one)
Seeding finished successfully!
```

### Database Backup and Restore

**Backup:**
```bash
npm run db:backup
```

**Restore:**
```bash
npm run db:restore
```

## Running the Application

### Development Mode

**Standard HTTP (Port 3000):**
```bash
npm run dev
```

**HTTPS Mode (Recommended for full feature testing):**

First, set up SSL certificates:

```bash
# Install mkcert
# Windows: choco install mkcert
# macOS: brew install mkcert
# Linux: See https://github.com/FiloSottile/mkcert

# Install local CA
mkcert -install

# Generate certificates
mkdir certificates
mkcert -key-file certificates/localhost-key.pem -cert-file certificates/localhost.pem localhost 127.0.0.1 ::1
```

Then run:
```bash
npm run dev
```

The application will be available at:
- HTTP: `http://localhost:3000`
- HTTPS: `https://localhost:3000` (if configured)

### Production Build

```bash
npm run build
npm start
```

## Testing

The project includes comprehensive test coverage:

### Run All Tests

```bash
npm test
```

### Run Specific Test Suites

```bash
# API tests only
npm run test:api

# Unit tests only
npm run test:unit

# Admin tests
npm run test:admin

# Company tests
npm run test:company

# Student tests
npm run test:students

# Watch mode
npm run test:watch
```

### Test Coverage

```bash
npm run test:coverage
```

View the coverage report in `coverage/lcov-report/index.html`

### End-to-End Testing

```bash
# Install Cypress (first time only)
npm run cypress:install

# Run E2E tests
npm run test:e2e:report
```

## Security

### Security Testing

**SAST (Static Application Security Testing):**
```bash
npm run security:sast
```

**DAST (Dynamic Application Security Testing):**
```bash
npm run security:dast:report
```

**Dependency Audit:**
```bash
npm run security:audit
```

### Security Features

The application implements multiple security layers:

- **Input Validation**: All user inputs validated with Zod schemas
- **Output Sanitization**: DOMPurify for HTML content, sanitize-html for text
- **SQL Injection Protection**: Prisma ORM with parameterized queries
- **XSS Prevention**: Content Security Policy and sanitization
- **CSRF Protection**: CSRF tokens on all state-changing endpoints
- **Authentication**: Secure session management with NextAuth.js
- **Password Security**: bcrypt hashing with salt rounds
- **JWT Security**: Token rotation and versioning
- **File Upload Security**: Type validation, size limits, content verification
- **Rate Limiting**: Protection against brute force attacks
- **HTTPS**: Enforced in production environments

## Project Structure

```
CPSK-Job-Connect/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   │   ├── admin/        # Admin endpoints
│   │   │   ├── company/      # Company endpoints
│   │   │   ├── jobs/         # Job posting endpoints
│   │   │   ├── students/     # Student endpoints
│   │   │   └── auth/         # Authentication endpoints
│   │   ├── admin/            # Admin dashboard pages
│   │   ├── company/          # Company dashboard pages
│   │   ├── student/          # Student dashboard pages
│   │   └── (public)/         # Public pages
│   ├── components/           # React components
│   │   ├── ui/              # Reusable UI components
│   │   └── ...              # Feature-specific components
│   ├── lib/                 # Utility functions
│   │   ├── auth.ts          # Authentication utilities
│   │   ├── api-auth.ts      # API authentication
│   │   ├── email.ts         # Email sending utilities
│   │   └── ...              # Other utilities
│   ├── tests/               # Test files
│   │   ├── api/            # API endpoint tests
│   │   └── unit/           # Unit tests
│   └── types/              # TypeScript type definitions
├── prisma/
│   ├── schema.prisma       # Database schema
│   ├── seed.ts             # Database seeding script
│   └── migrations/         # Database migrations
├── public/                 # Static assets
├── docs/                   # Documentation
├── scripts/                # Utility scripts
├── certificates/           # SSL certificates (local)
├── .env                    # Environment variables (not in git)
├── .env.example           # Example environment configuration
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── next.config.ts         # Next.js configuration
├── tailwind.config.ts     # Tailwind CSS configuration
└── README.md              # This file
```

## Available Scripts

### Development
- `npm run dev` - Start development server with HTTPS
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run type-check` - Run TypeScript type checking

### Database
- `npm run db:seed` - Seed database with initial data
- `npm run db:backup` - Backup database
- `npm run db:restore` - Restore database from backup
- `npx prisma generate` - Generate Prisma Client
- `npx prisma migrate dev` - Create and apply migrations
- `npx prisma migrate deploy` - Deploy migrations to production
- `npx prisma studio` - Open Prisma Studio GUI

### Testing
- `npm test` - Run all tests
- `npm run test:api` - Run API tests
- `npm run test:unit` - Run unit tests
- `npm run test:admin` - Run admin tests
- `npm run test:company` - Run company tests
- `npm run test:students` - Run student tests
- `npm run test:coverage` - Generate test coverage report
- `npm run test:watch` - Run tests in watch mode
- `npm run test:e2e:report` - Run E2E tests with reporting

### Security
- `npm run security:sast` - Run SAST security scan
- `npm run security:dast:report` - Generate DAST report
- `npm run security:audit` - Audit npm dependencies

### Code Quality
- `npm run lint` - Lint TypeScript/JavaScript files
- `npm run lint:dom` - Lint DOM-related code
- `npm run lint:dom:fix` - Fix DOM linting issues
- `npm run lint:css` - Lint and fix CSS/SCSS
- `npm run lint:text-safety` - Check text content safety

### Storage
- `npm run storage:reset` - Reset Supabase storage buckets

## Deployment

### Vercel (Recommended)

1. **Prepare for Deployment:**
   ```bash
   npm run build
   ```

2. **Deploy to Vercel:**
   - Install Vercel CLI: `npm i -g vercel`
   - Run: `vercel`
   - Follow the prompts

3. **Configure Environment Variables:**
   - Go to your Vercel project settings
   - Add all environment variables from `.env`
   - Update `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` to your production domain

4. **Database:**
   - Ensure your Supabase database is accessible from Vercel
   - Run migrations: `npx prisma migrate deploy`

### Other Platforms

The application can be deployed to any platform that supports Next.js:
- **Docker**: Dockerfile can be created for containerized deployment
- **AWS**: Using Amplify or EC2
- **Google Cloud**: Using Cloud Run or App Engine
- **Azure**: Using App Service

### Environment Variables for Production

Ensure these are set in your production environment:

```env
NODE_ENV=production
NEXTAUTH_URL=https://your-domain.com
NEXT_PUBLIC_APP_URL=https://your-domain.com
DATABASE_URL=your-production-database-url
DIRECT_URL=your-production-direct-url
# ... all other variables from .env.example
```

### Post-Deployment Steps

1. **Verify Database Connection:**
   ```bash
   npx prisma migrate deploy
   npm run db:seed
   ```

2. **Create Admin Account:**
   - Set `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` in production env
   - Run seed script
   - Change admin password after first login

3. **Test Core Functionality:**
   - User registration and login
   - Job posting creation
   - Application submission
   - Email delivery
   - File uploads

4. **Monitor:**
   - Set up error tracking (e.g., Sentry)
   - Monitor database performance
   - Check application logs

## Contributing

We welcome contributions! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Run tests: `npm test`
5. Run linting: `npm run lint`
6. Commit your changes: `git commit -m "Add your feature"`
7. Push to your fork: `git push origin feature/your-feature-name`
8. Create a Pull Request

### Coding Standards

- Follow TypeScript best practices
- Write tests for new features
- Update documentation as needed
- Follow the existing code style
- Use meaningful commit messages


## Troubleshooting

### Common Issues

**Database Connection Error:**
- Verify `DATABASE_URL` and `DIRECT_URL` in `.env`
- Check if Supabase project is active
- Ensure IP is whitelisted in Supabase (or set to allow all)

**Prisma Seed Fails:**
- Make sure database migrations are up to date: `npx prisma migrate deploy`
- Check database connection
- Verify Prisma Client is generated: `npx prisma generate`

**HTTPS Certificate Error:**
- Ensure mkcert is installed and configured
- Regenerate certificates: `mkcert -key-file certificates/localhost-key.pem -cert-file certificates/localhost.pem localhost`
- Restart the development server

**Email Not Sending:**
- For Gmail: verify you're using an App Password, not your regular password
- Check SMTP configuration in `.env`
- For development, set `EMAIL_DEV_MODE=true` to log emails to console

**Build Errors:**
- Clear `.next` directory and rebuild
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check for TypeScript errors: `npm run type-check`

**File Upload Issues:**
- Verify Supabase storage buckets exist
- Check RLS policies are configured correctly
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is set

## Support

For issues, questions, or contributions:

- **Issues**: [GitHub Issues](https://github.com/CPSKJobConnect/CPSK-Job-Connect/issues)
- **Email**: Contact your project administrator

## License

This project is private and proprietary to Kasetsart University CPSK.

---

**Made with ❤️ by CPSK Students for CPSK Students**
