-- Migration: 001_create_schema.sql
-- Creates the core schema (users, identities, integrations, categories, tasks, email_summaries)
-- This file can be run directly via psql or used as reference for reset.js

BEGIN;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  user_id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  email_verified BOOLEAN DEFAULT FALSE,
  username VARCHAR(100) UNIQUE,
  first_name VARCHAR(100),
  avatar_url TEXT,
  password_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_login_at TIMESTAMPTZ
);

-- Function to keep updated_at in sync on UPDATE
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_set_timestamp
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_timestamp();

-- Identities (OAuth / external provider accounts)
CREATE TABLE IF NOT EXISTS identities (
  identity_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  provider_user_id VARCHAR(255) NOT NULL,
  provider_username VARCHAR(255),
  avatar_url TEXT,
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,
  scopes TEXT,
  profile_json JSONB,
  linked_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (provider, provider_user_id)
);

-- Integrations (connected services)
CREATE TABLE IF NOT EXISTS integrations (
  integration_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  service_name VARCHAR(100) NOT NULL,
  auth_token TEXT,
  last_synced_at TIMESTAMPTZ
);

-- Categories for tasks
CREATE TABLE IF NOT EXISTS categories (
  category_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7)
);

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
  task_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES categories(category_id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'pending',
  priority VARCHAR(20) DEFAULT 'medium',
  source VARCHAR(50),
  source_id VARCHAR(255)
);

-- Email summaries
CREATE TABLE IF NOT EXISTS email_summaries (
  email_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  original_email_id VARCHAR(255),
  sender VARCHAR(255),
  subject TEXT,
  summary_text TEXT,
  received_at TIMESTAMPTZ
);

COMMIT;
