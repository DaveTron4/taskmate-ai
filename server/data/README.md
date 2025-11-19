# Database Migrations

This folder contains SQL migration files for the TaskMate AI database.

## Running Migrations

### Option 1: Using psql (Recommended)

Run the migration against your PostgreSQL database:

```bash
# Using psql with connection string
psql "postgres://taskmate_ai_user:TDN52BLPGgUSjT85EBfh7RvW8qlgkVed@dpg-d4b3je2li9vc73dnk99g-a.oregon-postgres.render.com:5432/taskmate_ai" -f 001_create_tasks_table.sql
```

### Option 2: Using Node.js script

Create a migration script in the server folder:

```javascript
import { pool } from './config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  try {
    const sql = fs.readFileSync(
      path.join(__dirname, 'data', '001_create_tasks_table.sql'),
      'utf8'
    );
    
    await pool.query(sql);
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

runMigrations();
```

### Option 3: Using Render Dashboard

1. Go to your Render dashboard
2. Select your PostgreSQL database
3. Click on "Connect" → "External Connection"
4. Use the psql command or copy the connection details
5. Paste the SQL from `001_create_tasks_table.sql`

## Migration Files

- `001_create_tasks_table.sql` - Creates the tasks table for manually created events

## Table Schema

The `tasks` table includes:
- `task_id` - Primary key
- `user_id` - Foreign key to users (for multi-user support)
- `category` - 'school', 'personal', or 'work'
- `title` - Task title
- `description` - Optional description
- `due_date` - Due date/time
- `due_time` - Time portion of due date
- `priority` - 'low', 'medium', or 'high'
- `status` - 'pending', 'completed', or 'cancelled'
- `has_no_due_date` - Boolean flag
- `synced_to_google` - Whether task was synced to Google Calendar
- `google_event_id` - Google Calendar event ID if synced
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp
