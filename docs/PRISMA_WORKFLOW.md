# Prisma Workflow Guide

This guide explains how to work with Prisma migrations in a team environment with Supabase.

## Table of Contents
- [Initial Setup](#initial-setup)
- [Making Schema Changes](#making-schema-changes)
- [Working with Migrations](#working-with-migrations)
- [Pulling Changes from Other Developers](#pulling-changes-from-other-developers)
- [Common Scenarios](#common-scenarios)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## Initial Setup

When you first clone the repository:

```bash
# 1. Install dependencies
npm install

# 2. Set up your .env file with database credentials
# Copy from .env.example or get from your team
# Make sure you have both DATABASE_URL and DIRECT_URL

# 3. Pull the current database schema
npx prisma db pull

# 4. Generate Prisma Client
npx prisma generate
```

---

## Making Schema Changes

### Step 1: Modify the Schema

Edit `prisma/schema.prisma` to add/modify models:

```prisma
model NewModel {
  id         Int      @id @default(autoincrement())
  name       String
  created_at DateTime @default(now())
}
```

### Step 2: Create a Migration

```bash
npx prisma migrate dev --name descriptive_name
```

Example names:
- `add_user_profile`
- `add_job_post_categories`
- `update_application_status`

This command will:
1. Create a new migration file in `prisma/migrations/`
2. Apply the migration to your database
3. Regenerate Prisma Client

### Step 3: Commit Your Changes

```bash
git add prisma/schema.prisma
git add prisma/migrations/
git commit -m "feat: add NewModel to schema"
git push
```

**Important:** Always commit both `schema.prisma` AND the migration files together!

---

## Working with Migrations

### Creating Migrations

```bash
# Create and apply migration
npx prisma migrate dev --name your_migration_name

# Create migration without applying (for review)
npx prisma migrate dev --name your_migration_name --create-only

# Apply a created migration
npx prisma migrate deploy
```

### Checking Migration Status

```bash
# See which migrations have been applied
npx prisma migrate status
```

### Resetting Migrations (Development Only)

```bash
# Reset database and reapply all migrations
npx prisma migrate reset
```

⚠️ **WARNING:** This will delete all data!

---

## Pulling Changes from Other Developers

When a teammate creates a new migration:

### Step 1: Pull Latest Code

```bash
git pull origin main
```

### Step 2: Check Migration Status

```bash
npx prisma migrate status
```

This will show if there are pending migrations.

### Step 3: Apply Migrations

```bash
# Apply all pending migrations
npx prisma migrate deploy
```

### Step 4: Regenerate Prisma Client

```bash
npx prisma generate
```

### Quick Command

You can combine all steps:

```bash
git pull && npx prisma migrate deploy && npx prisma generate
```

---

## Common Scenarios

### Scenario 1: Teammate Added a New Model

```bash
# 1. Pull their changes
git pull origin main

# 2. Apply the migration
npx prisma migrate deploy

# 3. Regenerate client
npx prisma generate

# 4. Start your dev server
npm run dev
```

### Scenario 2: You Need to Add a Field to Existing Model

```bash
# 1. Edit prisma/schema.prisma
# Add your new field

# 2. Create migration
npx prisma migrate dev --name add_field_to_model

# 3. Commit and push
git add prisma/
git commit -m "feat: add new field to Model"
git push
```

### Scenario 3: Migration Conflicts

If you and a teammate both created migrations:

```bash
# 1. Pull their changes first
git pull origin main

# 2. Check for conflicts in schema.prisma
# Resolve any merge conflicts manually

# 3. Create a new migration with your combined changes
npx prisma migrate dev --name merge_migrations

# 4. Push your changes
git push
```

### Scenario 4: Database is Out of Sync

If your local database doesn't match the schema:

**Option A: Pull from Database (if database is correct)**
```bash
npx prisma db pull
npx prisma generate
```

**Option B: Push to Database (if schema is correct)**
```bash
npx prisma db push
```

⚠️ Use `db push` carefully - it doesn't create migration history!

### Scenario 5: Starting Fresh

If you want to reset everything locally:

```bash
# 1. Reset your local database
npx prisma migrate reset

# This will:
# - Drop all tables
# - Reapply all migrations
# - Run seed script (if configured)

# 2. Generate client
npx prisma generate
```

---

## Best Practices

### ✅ DO:

1. **Always use descriptive migration names**
   - Good: `add_saved_jobs_table`
   - Bad: `migration1`, `test`, `update`

2. **Commit schema and migrations together**
   ```bash
   git add prisma/schema.prisma prisma/migrations/
   git commit -m "feat: add feature"
   ```

3. **Pull before creating new migrations**
   ```bash
   git pull && npx prisma migrate dev --name your_migration
   ```

4. **Use `migrate dev` in development**
   - Creates migration history
   - Safe for development

5. **Use `migrate deploy` in production**
   - Only applies migrations
   - Safe for production

6. **Run migrations before deploying**
   - Ensure database is up to date
   - Test migrations in staging first

7. **Communicate with your team**
   - Announce breaking schema changes
   - Coordinate major migrations

### ❌ DON'T:

1. **Don't modify existing migrations**
   - Once pushed, migrations are immutable
   - Create a new migration instead

2. **Don't delete migrations from git**
   - This breaks migration history
   - Can cause issues for team members

3. **Don't use `db push` in production**
   - No migration history
   - Can cause data loss

4. **Don't edit schema without creating migration**
   - Schema and database will be out of sync
   - Always create migrations for changes

5. **Don't skip migrations**
   - Run all migrations in order
   - Don't cherry-pick migrations

---

## Troubleshooting

### Problem: "Migration failed to apply"

**Solution:**
```bash
# Check migration status
npx prisma migrate status

# Resolve the migration
npx prisma migrate resolve --applied <migration_name>
# or
npx prisma migrate resolve --rolled-back <migration_name>
```

### Problem: "Schema is out of sync"

**Solution:**
```bash
# If database is correct, pull from it
npx prisma db pull

# If schema is correct, push to database
npx prisma db push

# Then create a new migration
npx prisma migrate dev --name sync_schema
```

### Problem: "Can't reach database server"

**Solution:**
1. Check your `.env` file has correct credentials
2. Verify your Supabase project is active
3. Try using `DIRECT_URL` instead of pooler URL
4. Check if your IP is whitelisted in Supabase

### Problem: "Prepared statement already exists"

**Solution:**
This happens with Supabase pooler. Use `DIRECT_URL`:

```bash
# In your .env
DIRECT_URL="postgresql://postgres:[password]@[host]:5432/postgres"
```

Our scripts automatically use `DIRECT_URL` when available.

### Problem: "Too many migrations"

If you have many migrations and want to consolidate:

```bash
# 1. Backup your database
npm run db:backup

# 2. Reset and create baseline
# Follow DATABASE_RESET_GUIDE.md
```

---

## Environment Variables

Make sure your `.env` file has:

```env
# For connection pooling (use in production)
DATABASE_URL="postgresql://postgres.xxx:[password]@aws-xxx.pooler.supabase.com:5432/postgres"

# For direct connection (use for migrations and scripts)
DIRECT_URL="postgresql://postgres:[password]@aws-xxx.pooler.supabase.com:5432/postgres"
```

**When to use which:**
- `DATABASE_URL`: Application runtime, API routes
- `DIRECT_URL`: Migrations, seeding, backup/restore scripts

---

## Quick Command Reference

```bash
# Create and apply migration
npx prisma migrate dev --name migration_name

# Apply pending migrations
npx prisma migrate deploy

# Check migration status
npx prisma migrate status

# Reset database (destructive!)
npx prisma migrate reset

# Pull schema from database
npx prisma db pull

# Push schema to database (no migration)
npx prisma db push

# Generate Prisma Client
npx prisma generate

# Open Prisma Studio (database GUI)
npx prisma studio

# Validate schema
npx prisma validate

# Format schema file
npx prisma format
```

---

## Team Workflow Summary

### For Schema Changes:
1. Pull latest code: `git pull`
2. Edit schema: `prisma/schema.prisma`
3. Create migration: `npx prisma migrate dev --name change_name`
4. Test changes locally
5. Commit both schema and migrations
6. Push to repository
7. Notify team

### For Pulling Changes:
1. Pull latest code: `git pull`
2. Apply migrations: `npx prisma migrate deploy`
3. Generate client: `npx prisma generate`
4. Continue development

---

## Related Guides

- [DATABASE_RESET_GUIDE.md](./DATABASE_RESET_GUIDE.md) - How to reset and restore your database
- [Prisma Documentation](https://www.prisma.io/docs) - Official Prisma docs
- [Supabase Documentation](https://supabase.com/docs) - Official Supabase docs
