# Database Reset and Recovery Guide

This guide will help you backup, reset, and restore your Supabase database.

> 💡 **Looking for general Prisma workflow?** See [PRISMA_WORKFLOW.md](./docs/PRISMA_WORKFLOW.md) for day-to-day migration and schema management.

## Prerequisites

- Ensure you have `ts-node` installed globally or use `npx ts-node`
- Make sure your `.env` file has the correct database credentials

## Step 1: Backup Your Current Database

Before resetting, backup your existing data:

```bash
npm run db:backup
```

This will create a JSON backup file in the `backup/` directory with a timestamp. The backup includes all data from all tables.

## Step 2: Reset Supabase Database

You have two options to reset your database:

### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **Database** → **Migrations**
3. Click on the **Reset Database** button
4. Confirm the reset operation

### Option B: Using SQL Editor

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run the following SQL command to drop all tables:

```sql
-- Drop all tables in the public schema
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

## Step 3: Delete Local Migration History

After resetting the database, clean up your local Prisma migration history:

```bash
# Delete the migrations folder
rm -rf prisma/migrations

# Or on Windows PowerShell:
Remove-Item -Path "prisma\migrations" -Recurse -Force
```

## Step 4: Create Fresh Migrations

Now create a fresh baseline migration:

```bash
npx prisma migrate dev --name init
```

This will:
- Create a new migration based on your current `schema.prisma`
- Apply it to your database
- Generate the Prisma Client

## Step 5: Choose Your Data Strategy

You have two options for populating your database:

### Option A: Restore Your Backup Data (Recommended if you have important data)

If you want to restore all your old data:

```bash
npm run db:restore backup/backup-2025-10-17T07-44-02-924Z.json
```

Replace the filename with your actual backup file from Step 1.

**Note:** The restore script will automatically upsert data, so it will:
- Create reference data (roles, document types, statuses, etc.)
- Restore all your user accounts, students, companies, job posts, applications, etc.

### Option B: Start Fresh with Seed Data Only

If you want to start with only reference/lookup data:

```bash
npm run db:seed
# Or use Prisma's built-in seed command:
npx prisma db seed
```

This will create:
- Account roles (Student, Company, Admin)
- Document types (Resume, Portfolio, Transcript)
- Application statuses (Pending, Reviewed, Accepted, Rejected)
- Job types (Full-time, Part-time, Internship, Contract)
- Job arrangements (On-site, Remote, Hybrid)
- Job categories (Software Development, Data Science, etc.)

**⚠️ IMPORTANT:**
- If you run `db:seed` first and then try to restore, you may get conflicts
- Choose one option: either restore your backup OR seed fresh data
- If you already ran seed and want to restore, you can safely run restore - it will upsert the data

## Troubleshooting

### Connection Issues

If you're still getting connection errors:

1. Check your Supabase project is active and not paused
2. Verify your `.env` file has correct credentials:
   ```
   DATABASE_URL="postgresql://..."
   DIRECT_URL="postgresql://..."
   ```
3. Try using `DIRECT_URL` instead of the pooler connection
4. Check if your IP is whitelisted in Supabase (Database Settings → Connection Pooling)

### Migration Conflicts

If migrations still fail:

1. Delete the shadow database:
   - Go to Supabase Dashboard → Database Settings
   - Look for shadow database settings

2. Or disable shadow database temporarily:
   ```bash
   npx prisma migrate dev --name init --skip-seed --create-only
   npx prisma migrate deploy
   ```

## Important Notes

- Always backup before resetting!
- The backup file contains all your data in JSON format
- Sessions and verification tokens might expire and can be regenerated
- File paths in documents table reference actual files - make sure those files still exist
- Consider backing up your Supabase Storage files separately if you have uploads

## Quick Reference

```bash
# 1. Backup database
npm run db:backup

# 2. Reset database in Supabase Dashboard

# 3. Delete migrations (Windows PowerShell)
Remove-Item -Path "prisma\migrations" -Recurse -Force

# 4. Create fresh migration
npx prisma migrate dev --name init

# 5a. Restore backup (if you have important data)
npm run db:restore backup/backup-YYYY-MM-DD.json

# OR

# 5b. Seed fresh data (if starting fresh)
npm run db:seed
```

## For Your Teammates

This guide and the backup/restore scripts are in the repository for your team to use. However:
- **Backup files are gitignored** - Each developer should create their own backup before resetting
- Share backup files manually if needed (via Slack, email, etc.)
- Make sure everyone has their `.env` file properly configured with `DATABASE_URL` and `DIRECT_URL`
