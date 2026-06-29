# Task Catalyst — Version 5

An AI-powered productivity companion that combines intelligent task management, personalized motivation, proactive agent reasoning, and customizable productivity tools into a single workspace for students.

Version 5 focuses on **product maturity** rather than introducing a completely new AI capability. It improves the reliability of the Agentic Dashboard, introduces customizable dashboard management, strengthens database design, and enhances the application's maintainability for future growth.

---

# What's New in Version 5

### Dashboard Manager

Users can now personalize their dashboard by choosing which widgets are visible.

Each dashboard component can be independently enabled or disabled, including:

* Daily Motivation Quote
* Agent Briefing
* Focus Timer
* AI Recommendation
* Due Today / Tomorrow cards

Dashboard preferences are stored in Supabase, making them persistent across devices instead of relying on browser storage.

---

### Centralized Dashboard Configuration

Introduced a dedicated dashboard configuration architecture through `dashboardPrefs.js`.

Instead of scattering widget definitions across multiple files, Version 5 introduces a single source of truth responsible for:

* default widget visibility
* widget metadata
* automatic preference merging
* future widget expansion

Adding a new dashboard widget now requires only minimal changes while preserving maintainability.

---

### Stronger Database Design

The database layer received significant improvements.

Highlights include:

* safer authentication trigger implementation
* explicit schema references
* secure search path configuration
* dashboard preference persistence
* additional validation constraints
* performance indexes for frequently queried columns

These improvements increase security, consistency, and scalability without changing the existing application workflow.

---

### Smarter Agent Reasoning

The AI Agent continues to proactively analyze task data, but Version 5 improves the quality of its reasoning.

Enhancements include:

* accurate deadline interpretation
* improved urgency detection
* better intervention prioritization
* more realistic planning suggestions
* cleaner recommendation generation

Agent recommendations become more actionable while reducing misleading observations.

---

### Improved Agent Briefing Experience

The Agent Briefing interface has been refined to improve readability and execution.

Enhancements include:

* clearer visual hierarchy
* intervention count badges
* improved execution previews
* better distinction between warnings, plans, actions and insights
* more informative split-task previews
* improved deadline distribution for generated subtasks

These improvements make AI suggestions easier to understand before execution.

---

### Focus Timer Improvements

The integrated Focus Timer continues to evolve.

Version 5 improves the overall focus workflow by making sessions easier to notice and integrating more naturally into the Dashboard experience.

---

### Task Management Refinements

Several usability improvements have been made across task management.

Examples include:

* improved dropdown rendering
* better task interaction consistency
* cleaner execution flow
* refined task splitting behavior
* improved priority recalculation

---

# Core Features

* Secure user authentication using Supabase Authentication
* Personal task management with full CRUD functionality
* AI-generated motivational quotes using Google Gemini
* Personalized AI productivity coaching
* Intelligent task prioritization
* Agent Briefing with proactive interventions
* Automatic preparation plan generation
* Smart task splitting
* Focus Timer
* Dashboard customization
* Quote personalization
* Productivity personality analysis
* Responsive interface for desktop and mobile devices

---

# Technology Stack

**Frontend**

* React
* Vite
* JavaScript
* CSS

**Backend**

* Supabase

**Artificial Intelligence**

* Google Gemini 2.5 Flash

**Database**

* PostgreSQL (Supabase)

---

# Project Architecture

```
Frontend
     │
     ▼
Dashboard
     │
     ├── Dashboard Manager
     ├── Quote Engine
     ├── Focus Timer
     ├── Agent Briefing
     └── AI Recommendation
              │
              ▼
        Agent Engine
              │
              ▼
      Google Gemini API

                │

         Supabase Backend
              │
              ├── Authentication
              ├── PostgreSQL Database
              ├── Dashboard Preferences
              └── User Profiles
```

---

# Security

Version 5 introduces several database improvements.

* Row Level Security (RLS)
* Secure authentication trigger
* Explicit schema references
* Protected search path
* Database validation constraints
* Safe migration design using IF NOT EXISTS
* Indexed database queries for improved performance

---

# Current Limitations

Although Version 5 introduces significant architectural improvements, several areas remain intentionally outside the current project scope.

* Google Gemini API requires users to provide their own API key.
* AI capabilities depend on external API availability and quota limits.
* Dashboard preferences are synchronized across devices, while quote collections remain stored locally.
* Offline support is limited. Internet connectivity is required for authentication, database operations, and AI-powered features.
* Shared quote collections
* Agent reasoning is recommendation-based and does not automatically modify user tasks without confirmation.
* The application currently targets individual users rather than collaborative teams.
* Background reminders and notification services are not yet implemented.
* AI request handling currently relies on a single API key per user and does not include automatic key rotation or fallback providers.

---

# Future Scope

Several enhancements are possible for future versions.

### Scalability

* Multi-provider AI architecture
* Automatic API key rotation
* Shared fallback AI keys for new users
* Queue-based AI request scheduling
* Background task processing
* Horizontal backend scaling
* AI response caching
* Better rate-limit management

### Productivity

* Calendar integration
* Email reminders
* Push notifications
* Habit tracking
* Recurring tasks
* Time analytics dashboard
* Weekly productivity reports
* AI-generated study schedules

### Collaboration

* Shared workspaces
* Team task management
* Collaborative projects
* Group planning

### Intelligence

* Long-term productivity analytics
* Personalized learning of user behaviour
* Adaptive scheduling
* Smarter workload balancing
* Multi-step autonomous planning

---

# Installation

```bash
git clone <repository-url>

cd task-catalyst

npm install

npm run dev
```

---

# Environment

Configure Supabase credentials inside your environment configuration.

Google Gemini API keys can be added later from the application's Settings page.

---

# Version Summary

Version 5 represents the transition from feature expansion to architectural refinement.

Rather than introducing a single large capability, this release focuses on making Task Catalyst more reliable, customizable, secure, and easier to extend. Dashboard personalization, stronger database design, improved agent reasoning, and maintainable configuration architecture establish a solid foundation for future scalability while preserving the intelligent productivity experience introduced in previous versions.
