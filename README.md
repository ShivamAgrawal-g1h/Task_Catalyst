# 🚀 Task Catalyst

> **An Agentic AI Productivity Companion for Students**

Task Catalyst is an AI-powered productivity application that combines intelligent task management with Google's Gemini AI to help students organize work, reduce procrastination, and make better day-to-day decisions.

Unlike conventional task managers that only store tasks, Task Catalyst continuously analyzes the user's workload, identifies productivity risks, and recommends concrete actions before problems become overwhelming.

---

# 📌 Version

**Current Version :** **V3**

Version 3 marks the transition from an AI-assisted task manager to an **Agentic Productivity Assistant**, introducing proactive reasoning, intervention generation, and executable productivity actions.

---

# 📖 Overview

Task Catalyst was built around one guiding principle:

> **Productivity software should actively help users make decisions instead of merely recording tasks.**

The application combines modern web technologies, cloud infrastructure, and Artificial Intelligence to create an intelligent workspace capable of understanding task context and providing meaningful assistance.

---

# ✨ Core Features

## 🔐 Secure Authentication

* Email & Password authentication
* Supabase Authentication
* Automatic profile creation
* Row-Level Security (RLS)
* User-specific data isolation

---

## 📋 Intelligent Task Management

Manage tasks with:

* Title
* Description
* Deadline
* Importance Rating
* Estimated Time
* Category
* Status Tracking
* Priority Score
* Postponement Counter

Supported operations:

* Create
* Edit
* Delete
* Complete
* Postpone
* Filter
* Sort

---

## 📊 Smart Dashboard

The Dashboard serves as the productivity control center.

It displays:

* Personalized greeting
* Daily motivational quote
* Productivity statistics
* AI recommendations
* Agent Briefing
* Top priority tasks
* Due today / tomorrow summaries
* Quick task completion

---

# 🤖 Agentic AI System (New in V3)

Version 3 introduces Task Catalyst's first **Agentic AI layer**.

Instead of simply answering questions, the application now observes the user's task state and generates structured interventions.

The Agent continuously evaluates:

* Pending tasks
* Overdue work
* Deadline urgency
* Estimated workload
* Priority scores
* Task postponement history
* High-risk productivity patterns

These observations are converted into actionable productivity briefings.

---

## ⚡ Agent Briefing

A new Agent Briefing panel appears on the Dashboard whenever meaningful productivity observations are detected.

Possible interventions include:

* Overdue task warnings
* Deadline risk detection
* Workload analysis
* Preparation plans
* Productivity insights
* Actionable recommendations

Each intervention explains:

* What was detected
* Why it matters
* What action should be taken

---

## ✅ Executable AI Actions

Unlike previous versions where AI only generated text, Version 3 allows the user to execute AI-generated actions directly from the interface.

Supported actions include:

* Split large tasks into smaller subtasks
* Postpone lower-priority work
* Automatically generate preparation tasks
* Accept or dismiss AI recommendations

This creates a more interactive productivity experience while keeping the user in full control.

---

# 🧠 AI Coach

The AI Coach has been significantly upgraded.

Rather than functioning as a general chatbot, it now:

* Understands current workload
* References actual task titles
* Maintains short conversation history
* Detects actionable opportunities
* Requests confirmation before executing supported actions

The result is a conversational assistant capable of reasoning about productivity instead of simply answering questions.

---

# 🌟 Personalized Motivation

Task Catalyst includes a customizable motivation system supporting multiple quote sources.

Quote sources include:

* Gemini AI
* Personal custom quotes
* Built-in inspirational library

Supported modes:

* Mixed
* AI Only
* My Quotes
* Pinned Quote

Every displayed quote clearly indicates its origin.

---

# 📈 Intelligent Priority Algorithm

Every task receives a dynamic Priority Score (0–100).

The score combines:

| Factor           | Weight |
| ---------------- | ------ |
| Importance       | 40%    |
| Deadline Urgency | 40%    |
| Quick Win Bonus  | 20%    |

The Agentic AI uses this score as one of several factors when generating recommendations.

---

# 🏗 Architecture

Version 3 introduces a modular agent architecture.

```text
Tasks
      │
      ▼
Priority Engine
      │
      ▼
Agent Engine
      │
      ▼
Intervention Generator
      │
      ▼
Agent Briefing
      │
      ▼
User Confirmation
      │
      ▼
Task Execution
```

This separation keeps reasoning, execution, and presentation independent, making future expansion significantly easier.

---

# 🗄 Database

Current database schema consists of:

## tasks

Stores:

* Task details
* Deadlines
* Estimated effort
* Priority score
* Postpone history
* Completion timestamps

---

## user_profiles

Stores:

* User profile
* Gemini API key
* Productivity profile
* Work schedule

---

# 🔐 Security

Security is provided through Supabase.

Features include:

* Secure Authentication
* Row-Level Security
* Protected user profiles
* Private Gemini API key storage
* User-specific data access

Each authenticated user can only access their own information.

---

# 🛠 Technology Stack

### Frontend

* React
* Vite
* JavaScript
* CSS

### Backend

* Supabase

### Database

* PostgreSQL

### Artificial Intelligence

* Google Gemini API (Gemini 2.5 Flash)

---

# 📂 Project Structure

```text
Task_Catalyst/

├── public/
├── src/
│   ├── components/
│   │     ├── AgentBriefing.jsx
│   │     ├── AddTaskModal.jsx
│   │     ├── CustomQuotesModal.jsx
│   │
│   ├── lib/
│   │     ├── agentEngine.js
│   │     ├── gemini.js
│   │     ├── priority.js
│   │     ├── quotes.js
│   │     └── supabase.js
│   │
│   ├── pages/
│   │     ├── Dashboard.jsx
│   │     ├── Tasks.jsx
│   │     ├── AICoach.jsx
│   │     ├── Settings.jsx
│   │     └── Auth.jsx
│   │
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
│
├── supabase/
├── package.json
├── vite.config.js
└── README.md
```

---

# 🚀 Installation

Clone the repository

```bash
git clone <repository-url>
```

Install dependencies

```bash
npm install
```

Configure environment variables

```env
VITE_SUPABASE_URL=YOUR_SUPABASE_URL

VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

Run locally

```bash
npm run dev
```

Create a production build

```bash
npm run build
```

---

# 🔑 Gemini API Setup

To enable AI-powered functionality:

1. Generate a free Gemini API key from Google AI Studio.
2. Open **Settings**.
3. Paste your API key.
4. Save changes.

AI-powered coaching, recommendations, and agent reasoning become available immediately after configuration.

---

# 🎯 Design Philosophy

Task Catalyst follows three core principles.

### Intelligent

The application should understand productivity context rather than simply record tasks.

### Explainable

Every recommendation should include clear reasoning so users understand why it was generated.

### User Controlled

AI may recommend and prepare actions, but execution always remains under the user's control through explicit confirmation.

---

# 📌 Current Limitations

Although Version 3 introduces an Agentic AI layer, several capabilities remain intentionally outside the current scope.

Current limitations include:

* Agent interventions are generated on demand rather than continuously in the background.
* AI actions always require explicit user confirmation before execution.
* Custom quotes are stored locally and are not synchronized across devices.
* Priority scoring is rule-based rather than adaptive or machine-learning driven.
* Calendar integration (Google Calendar, Outlook, etc.) is not yet available.
* Notifications and reminder scheduling have not been implemented.
* Recurring task management is currently unsupported.
* Productivity analytics focus on current task state rather than long-term behavioural trends.
* Multi-device synchronization for user preferences has not yet been implemented.

These limitations define future areas of development while keeping the current system reliable, predictable, and maintainable.

---

# 📜 Version History

| Version | Highlights                                                                                                                          |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| V1      | Initial productivity application featuring authentication, task management, AI coach, dashboard, and intelligent priority scoring.  |
| V2      | Personalized motivation system with modular quote engine, custom quotes, multiple quote modes, and dashboard enhancements.          |
| **V3**  | Agentic AI reasoning engine, Agent Briefing, executable AI actions, interactive AI Coach, and proactive productivity interventions. |

---

# 👨‍💻 Author

**Shivam Agrawal**

Malaviya National Institute of Technology (MNIT), Jaipur

Electrical Engineering • Full Stack Development • Artificial Intelligence

---

## ⭐ If you found this project interesting, consider giving it a star.
