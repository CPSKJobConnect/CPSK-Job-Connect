# Documentation

This directory contains guides and documentation for the CPSK Job Connect project.

## Available Guides

### Database & Schema Management

- **[PRISMA_WORKFLOW.md](./PRISMA_WORKFLOW.md)** - Complete guide for working with Prisma
  - How to create and apply migrations
  - How to pull changes from teammates
  - Common scenarios and best practices
  - Troubleshooting migration issues
  - Team collaboration workflow

- **[DATABASE_RESET_GUIDE.md](../DATABASE_RESET_GUIDE.md)** - How to reset and restore your database
  - Backup your database before resetting
  - Complete reset procedure
  - Restore from backup
  - Seed with initial data

## Quick Links

### Common Commands

```bash
# Apply teammate's migrations
git pull && npx prisma migrate deploy && npx prisma generate

# Create new migration
npx prisma migrate dev --name migration_name

# Backup database
npm run db:backup

# Restore database
npm run db:restore backup/backup-YYYY-MM-DD.json

# Seed database
npm run db:seed
```

### When to Use Which Guide

- **Daily development**: Use [PRISMA_WORKFLOW.md](./PRISMA_WORKFLOW.md)
- **Migration problems**: Try [PRISMA_WORKFLOW.md](./PRISMA_WORKFLOW.md) troubleshooting section first
- **Need to reset everything**: Use [DATABASE_RESET_GUIDE.md](../DATABASE_RESET_GUIDE.md)
- **Database out of sync with migrations**: Check both guides

## Contributing

When adding new documentation:
1. Place it in the `docs/` directory
2. Update this README with a link
3. Use clear, descriptive filenames
4. Include a table of contents for longer guides
5. Add examples and code snippets where helpful
