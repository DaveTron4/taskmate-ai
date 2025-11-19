-- Drop existing table and indexes if they exist
DROP INDEX IF EXISTS idx_tasks_user_id;
DROP INDEX IF EXISTS idx_tasks_due_date;
DROP INDEX IF EXISTS idx_tasks_category;
DROP TABLE IF EXISTS tasks;

-- Create tasks table for manually created events/tasks
CREATE TABLE tasks (
    task_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    category VARCHAR(20) NOT NULL CHECK (category IN ('school', 'personal', 'work')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date TIMESTAMP,
    due_time TIME,
    priority VARCHAR(10) NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    has_no_due_date BOOLEAN DEFAULT FALSE,
    synced_to_google BOOLEAN DEFAULT FALSE,
    google_event_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster queries by user
CREATE INDEX idx_tasks_user_id ON tasks(user_id);

-- Index for faster queries by due date
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

-- Index for faster queries by category
CREATE INDEX idx_tasks_category ON tasks(category);
