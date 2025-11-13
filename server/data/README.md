# Database Migrations & Seeding

This directory contains database schema migrations and seed data for the TaskMate-AI application.

## Structure

- `migrations/` - SQL schema migration files
- `reset.js` - Script to drop and recreate all tables (development only)

## Running Migrations

### Option 1: Using reset.js (Recommended for Development)

From the `server/` directory:

```bash
node config/reset.js
```

This will:
1. Drop all existing tables (CASCADE)
2. Recreate all tables with proper schema
3. Seed initial data (if any)

### Option 2: Using psql directly

If you prefer to run the SQL migration files manually:

```bash
# Set your environment variables
$env:PGUSER = "your_username"
$env:PGPASSWORD = "your_password"
$env:PGHOST = "your_host.render.com"
$env:PGPORT = "5432"
$env:PGDATABASE = "your_database_name"

# Run the migration
psql -h $env:PGHOST -p $env:PGPORT -U $env:PGUSER -d $env:PGDATABASE -f .\data\migrations\001_create_schema.sql
```

## Environment Variables

Make sure your `.env` file contains the following PostgreSQL connection details:

```
PGUSER=your_username
PGPASSWORD=your_password
PGHOST=your_host.render.com
PGPORT=5432
PGDATABASE=your_database_name
```

## Schema Overview

Based on `planning/entity_relationship_diagram.md`:

- **users** - Main user accounts
- **identities** - OAuth provider accounts (GitHub, Google, etc.)
- **integrations** - Connected services (Gmail, Canvas, etc.)
- **categories** - User-created task categories
- **tasks** - To-do items from various sources
- **email_summaries** - AI-generated email summaries

## Notes

- All tables use `SERIAL` primary keys
- Foreign keys use `ON DELETE CASCADE` for automatic cleanup
- `users` table has an `updated_at` trigger that auto-updates on changes
- Tokens should be encrypted before storage in production
