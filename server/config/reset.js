import { pool } from "./database.js";
import "./dotenv.js";

// Function to create the users table
const createUsersTable = async () => {
  const createTableQuery = `
        DROP TABLE IF EXISTS email_summaries CASCADE;
        DROP TABLE IF EXISTS tasks CASCADE;
        DROP TABLE IF EXISTS categories CASCADE;
        DROP TABLE IF EXISTS composio_connections CASCADE;
        DROP TABLE IF EXISTS integrations CASCADE;
        DROP TABLE IF EXISTS identities CASCADE;
        DROP TABLE IF EXISTS users CASCADE;
        DROP FUNCTION IF EXISTS trigger_set_timestamp() CASCADE;

        CREATE TABLE users (
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
        );`;

  try {
    await pool.query(createTableQuery);
    console.log("🎉 users table created successfully");
  } catch (err) {
    console.error("⚠️ error creating users table", err);
    throw err;
  }
};

// Function to create the trigger for updated_at
const createTimestampTrigger = async () => {
  const createTriggerQuery = `
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
            EXECUTE FUNCTION trigger_set_timestamp();`;

  try {
    await pool.query(createTriggerQuery);
    console.log("🎉 updated_at trigger created successfully");
  } catch (err) {
    console.error("⚠️ error creating trigger", err);
    throw err;
  }
};

// Function to create the identities table (OAuth providers)
const createIdentitiesTable = async () => {
  const createTableQuery = `
    CREATE TABLE identities (
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
    );`;

  try {
    await pool.query(createTableQuery);
    console.log("🎉 identities table created successfully");
  } catch (err) {
    console.error("⚠️ error creating identities table", err);
    throw err;
  }
};

// Function to create the integrations table (connected services)
const createIntegrationsTable = async () => {
  const createTableQuery = `
    CREATE TABLE integrations (
        integration_id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        service_name VARCHAR(100) NOT NULL,
        auth_token TEXT,
        last_synced_at TIMESTAMPTZ
    );`;

  try {
    await pool.query(createTableQuery);
    console.log("🎉 integrations table created successfully");
  } catch (err) {
    console.error("⚠️ error creating integrations table", err);
    throw err;
  }
};

const createComposioConnectionsTable = async () => {
  const createTableQuery = `
    CREATE TABLE composio_connections (
        connection_id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        composio_account_id VARCHAR(255) NOT NULL,
        service_name VARCHAR(100) NOT NULL,
        external_user_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now(),
        UNIQUE (composio_account_id),
        UNIQUE (user_id, service_name)
    );`;

  try {
    await pool.query(createTableQuery);
    console.log("🎉 composio_connections table created successfully");
  } catch (err) {
    console.error("⚠️ error creating composio_connections table", err);
    throw err;
  }
};

// Function to create the categories table
const createCategoriesTable = async () => {
  const createTableQuery = `
    CREATE TABLE categories (
        category_id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        color VARCHAR(7)
    );`;

  try {
    await pool.query(createTableQuery);
    console.log("🎉 categories table created successfully");
  } catch (err) {
    console.error("⚠️ error creating categories table", err);
    throw err;
  }
};

// Function to create the tasks table
const createTasksTable = async () => {
  const createTableQuery = `
    CREATE TABLE tasks (
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
    );`;

  try {
    await pool.query(createTableQuery);
    console.log("🎉 tasks table created successfully");
  } catch (err) {
    console.error("⚠️ error creating tasks table", err);
    throw err;
  }
};

// Function to create the email_summaries table
const createEmailSummariesTable = async () => {
  const createTableQuery = `
    CREATE TABLE email_summaries (
        email_id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        original_email_id VARCHAR(255),
        sender VARCHAR(255),
        subject TEXT,
        summary_text TEXT,
        received_at TIMESTAMPTZ
    );`;

  try {
    await pool.query(createTableQuery);
    console.log("🎉 email_summaries table created successfully");
  } catch (err) {
    console.error("⚠️ error creating email_summaries table", err);
    throw err;
  }
};

// Main function to run the database reset
const reset = async () => {
  try {
    // Create tables in order (respecting foreign key dependencies)
    await createUsersTable();
    console.log("✅ users table ready");

    await createTimestampTrigger();
    console.log("✅ timestamp trigger ready");

    await createIdentitiesTable();
    console.log("✅ identities table ready");

    await createIntegrationsTable();
    console.log("✅ integrations table ready");

    await createComposioConnectionsTable();
    console.log("✅ composio_connections table ready");

    await createCategoriesTable();
    console.log("✅ categories table ready");

    await createTasksTable();
    console.log("✅ tasks table ready");

    await createEmailSummariesTable();
    console.log("✅ email_summaries table ready");

    console.log("\n🎉 Database reset completed successfully!");

    pool.end(); // Close the connection pool
  } catch (err) {
    console.error(
      "⚠️ An error occurred during the database reset process",
      err
    );
    pool.end(); // Ensure pool is closed on error
  }
};

// Execute the reset function
reset();
