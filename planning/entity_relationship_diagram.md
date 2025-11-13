# Entity Relationship Diagram

Reference the Creating an Entity Relationship Diagram final project guide in the course portal for more information about how to complete this deliverable.

## Create the List of Tables

```mermaid
erDiagram
    %% ---- Entities ----
    %% Defines the main user account
    User {
        int user_id PK "User's unique ID"
        string email "Login email (may be null for provider-only accounts)"
        bool email_verified "Has the email been verified?"
        string username "Optional display/username"
        string first_name "Optional first name"
        string avatar_url "Profile/avatar URL (from provider)"
        string password_hash "Hashed password (nullable for provider-only)"
        datetime created_at "Account creation timestamp"
        datetime updated_at "Last update timestamp"
        datetime last_login_at "Last login timestamp"
    }

    %% Separate table for OAuth / external identities (recommended)
    Identity {
        int identity_id PK "Identity unique ID"
        int user_id FK "Links to User.user_id"
        string provider "e.g., 'github', 'google'"
        string provider_user_id "ID from provider (GitHub user ID)"
        string provider_username "Username on provider (e.g., GitHub login)"
        string avatar_url "Avatar URL from provider (optional)"
        string access_token_encrypted "Encrypted access token"
        string refresh_token_encrypted "Encrypted refresh token (nullable)"
        datetime token_expires_at "When access token expires (nullable)"
        string scopes "Token scopes granted (comma-separated)"
        jsonb profile_json "Raw profile payload from provider"
        datetime linked_at "When this identity was linked to the user"
    }

    %% Defines the connected services (Gmail, Canvas, etc.)
    Integration {
        int integration_id PK "Connection ID"
        int user_id FK "Links to User.user_id"
        string service_name "e.g., 'canvas', 'gmail'"
        string auth_token "Encrypted API token"
        datetime last_synced_at "Last data fetch time"
    }

    %% Defines a single to-do item (from any source)
    Task {
        int task_id PK "Task's unique ID"
        int user_id FK "Links to User.user_id"
        int category_id FK "Links to Category.category_id"
        string title "e.g., 'ECON 101 Homework'"
        text description "Optional details"
        datetime due_date "Timestamp for sorting"
        string status "'pending', 'completed'"
        string priority "'high', 'medium', 'low'"
        string source "'canvas', 'gcal', 'manual'"
        string source_id "Original ID from service"
    }

    %% Defines the user-created categories for tasks
    Category {
        int category_id PK "Category's unique ID"
        int user_id FK "Links to User.user_id"
        string name "'School', 'Work', 'Personal'"
        string color "Hex code for UI"
    }

    %% Defines the AI-generated email summaries
    EmailSummary {
        int email_id PK "Summary's unique ID"
        int user_id FK "Links to User.user_id"
        string original_email_id "ID from Gmail"
        string sender "Email 'From' field"
        string subject "Email subject line"
        text summary_text "AI-generated summary"
        datetime received_at "Email reception time"
    }
```

## Add the Entity Relationship Diagram


```mermaid
erDiagram
    %% ---- Entities ----
    %% Defines the main user account
    User {
        int user_id PK "User's unique ID"
        string email "Login email (may be null for provider-only accounts)"
        bool email_verified "Has the email been verified?"
        string username "Optional display/username"
        string first_name "Optional first name"
        string avatar_url "Profile/avatar URL (from provider)"
        string password_hash "Hashed password (nullable for provider-only)"
        datetime created_at "Account creation timestamp"
        datetime updated_at "Last update timestamp"
        datetime last_login_at "Last login timestamp"
    }

    %% Separate table for OAuth / external identities (recommended)
    Identity {
        int identity_id PK "Identity unique ID"
        int user_id FK "Links to User.user_id"
        string provider "e.g., 'github', 'google'"
        string provider_user_id "ID from provider (GitHub user ID)"
        string provider_username "Username on provider (e.g., GitHub login)"
        string avatar_url "Avatar URL from provider (optional)"
        string access_token_encrypted "Encrypted access token"
        string refresh_token_encrypted "Encrypted refresh token (nullable)"
        datetime token_expires_at "When access token expires (nullable)"
        string scopes "Token scopes granted (comma-separated)"
        jsonb profile_json "Raw profile payload from provider"
        datetime linked_at "When this identity was linked to the user"
    }

    %% Defines the connected services (Gmail, Canvas, etc.)
    Integration {
        int integration_id PK "Connection ID"
        int user_id FK "Links to User.user_id"
        string service_name "e.g., 'canvas', 'gmail'"
        string auth_token "Encrypted API token"
        datetime last_synced_at "Last data fetch time"
    }

    %% Defines a single to-do item (from any source)
    Task {
        int task_id PK "Task's unique ID"
        int user_id FK "Links to User.user_id"
        int category_id FK "Links to Category.category_id"
        string title "e.g., 'ECON 101 Homework'"
        text description "Optional details"
        datetime due_date "Timestamp for sorting"
        string status "'pending', 'completed'"
        string priority "'high', 'medium', 'low'"
        string source "'canvas', 'gcal', 'manual'"
        string source_id "Original ID from service"
    }

    %% Defines the user-created categories for tasks
    Category {
        int category_id PK "Category's unique ID"
        int user_id FK "Links to User.user_id"
        string name "'School', 'Work', 'Personal'"
        string color "Hex code for UI"
    }

    %% Defines the AI-generated email summaries
    EmailSummary {
        int email_id PK "Summary's unique ID"
        int user_id FK "Links to User.user_id"
        string original_email_id "ID from Gmail"
        string sender "Email 'From' field"
        string subject "Email subject line"
        text summary_text "AI-generated summary"
        datetime received_at "Email reception time"
    }

    %% ---- Relationships (All are One-to-Many unless otherwise noted) ----
    User ||--o{ Identity : "has identity (user_id)"
    User ||--o{ Integration : "connects (user_id)"
    User ||--o{ Task : "has (user_id)"
    User ||--o{ Category : "creates (user_id)"
    User ||--o{ EmailSummary : "receives (user_id)"
    Category ||--o{ Task : "contains (category_id)"
```
