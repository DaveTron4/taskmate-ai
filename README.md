# TaskMate AI

CodePath WEB103 Final Project

Designed and developed by: Htet Htwe & David Salas Carrascal

🔗 Link to deployed app: [TaskMate AI](https://taskmate-ai-ef8u.onrender.com/)

## About

### Description and Purpose

TaskMate AI is a smart productivity and scheduling web app that helps students stay on top of classes, emails, and personal tasks, all in one place. The app connects to Canvas, Gmail, and Google Calendar via Composio to automatically gather assignments and events, then uses AI to organize and prioritize them.  

It’s designed for students juggling academics, part-time jobs, and extracurriculars, offering an intelligent dashboard that learns from user habits and adapts over time.

### Inspiration

As a full-time student, balancing deadlines from multiple classes and keeping track of meetings or counselor appointments can be overwhelming. I wanted to build an app that eliminates the mental load of remembering every due date or email reminder.

## Tech Stack

Frontend: React + Next.js, TypeScript, Tailwind  

Backend: Express, PostgreSQL, Render, Composio  

## Features

### ✅ Task Prioritization

Analyzes all imported tasks and deadlines using AI to suggest what to focus on next — helping students stay productive without feeling overwhelmed.

![Task Prioritization](./feature%20gifs/tasks_prioritization.gif)

### ✅ Smart Schedule Dashboard

Displays all assignments and events in a clean, color-coded weekly view that updates in real time whenever new data is synced.

![Smart Schedule Dashboard](./feature%20gifs/Smart_schedule_dashboard.gif)

### ✅ AI Email Summarizer

Scans the user's Gmail inbox for important messages (like from professors) and displays brief, AI-generated summaries directly in the dashboard, highlighting key action items.

![Ai Email Summarized](./feature%20gifs/ai_email_summerizer.gif)

### ✅ Dashboard Filtering

Allows users to filter the task list and calendar view by category (e.g., "School," "Personal") or by source (e.g., "Canvas," "Gmail") to focus on one area at a time.

![Dashboard Filtering](./feature%20gifs/filtering.gif)

### ✅ Integrate Composio
Connect the application to third-party tools and APIs using the Composio platform.

![Integrate Composio](./feature%20gifs/composio_integration.gif)

### ✅ Toast Alerts
Show pop-up notifications (toasts) to provide brief feedback to the user (e.g., "Task saved successfully!").

![Toast Alerts](./feature%20gifs/toast.gif)

### ✅ Disable Buttons After Click
Prevent users from accidentally submitting a form or action multiple times by disabling the button after the first click.

![Disable Burrons After Click](./feature%20gifs/disabled_buttons.gif)

### ✅ Implement Spinners
Display a loading spinner or indicator to show the user that data is being fetched or an action is processing.

![Implement Spinners](./feature%20gifs/composio_integration.gif)

### ✅ Set up GitHub OAuth
Allow users to log in or authenticate with the application using their existing GitHub account.

![GitHub OAuth](./feature%20gifs/github_oauth.gif)


### ✅ Graceful Error Handling - Backend
Implement a robust system on the server to catch, manage, and send clear, helpful error messages to the client instead of crashing.

![Graceful Error Handling](./feature%20gifs/graceful_error.gif)

### ✅ On Page Interaction - Frontend
Develop the core user interface interactions, such as clicking buttons, filling forms, and having the page update dynamically without a full reload.

![On Page Interaction](./feature%20gifs/disabled_buttons.gif)

### ✅ Redirect - Frontend
Automatically navigate the user to a different page after a specific action (e.g., redirecting to the dashboard after a successful login).

![Redirect](./feature%20gifs/composio_integration.gif)

### ✅ Reset Database Function - Backend
Create a special backend function or endpoint to clear and reset the database to a default state, which is useful for testing.

![Dabase Reset](./feature%20gifs/database_reset.gif)

### ✅ Deploy on Render
Configure and deploy the entire full-stack application (both frontend and backend) to the Render hosting platform to make it live on the web.

![Deploy on Render](./feature%20gifs/hosted_render.gif)

### ✅ Create Dynamic Routing - Frontend
Set up client-side routing to handle dynamic URLs, such as viewing a specific item by its ID (e.g., `/tasks/123`).

![Dynamic Routing](./feature%20gifs/dynamic_routing.gif)