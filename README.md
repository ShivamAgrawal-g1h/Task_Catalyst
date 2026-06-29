# 🚀 Task Catalyst

> **An Agentic AI Productivity Companion for Students**

Task Catalyst is an AI-powered productivity application designed to help students organize their academic workload, prioritize effectively, and receive intelligent assistance through Google's Gemini AI.

Unlike traditional task managers that simply record tasks, Task Catalyst actively analyzes workloads, highlights productivity risks, and provides actionable recommendations while ensuring the user remains in complete control.

---

# 📌 Version

**Current Version:** **V4**

Version 4 builds upon the Agentic AI architecture introduced in V3 by enhancing the daily productivity experience with an integrated Focus Timer and a redesigned personalization system for motivational quotes.

---

# 📖 Overview

Task Catalyst is built around a simple philosophy:

> **A productivity application should not only help users organize work—it should also help them focus and stay motivated throughout the day.**

Version 4 strengthens this philosophy by introducing distraction-free focus sessions and centralized personalization options without changing the underlying agent architecture.

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

Manage academic tasks with:

* Title & Description
* Deadline
* Importance Rating
* Estimated Time
* Category
* Status Tracking
* Priority Score
* Postponement Counter

Operations supported:

* Create
* Edit
* Delete
* Complete
* Postpone
* Filter
* Sort

---

## 📊 Intelligent Dashboard

The Dashboard serves as the central productivity workspace.

It provides:

* Personalized greeting
* Daily motivational quote
* Productivity statistics
* Agent Briefing
* AI recommendations
* Top priority tasks
* Due Today / Due Tomorrow summaries
* Integrated Focus Timer
* Quick task completion

---

# 🤖 Agentic AI System

Task Catalyst continuously analyzes the user's workload to generate meaningful productivity interventions.

The Agent evaluates:

* Pending tasks
* Overdue work
* Deadline urgency
* Priority scores
* Estimated workload
* Postponement history

It transforms these observations into structured recommendations that assist users in making better decisions.

---

## ⚡ Agent Briefing

The Agent Briefing summarizes important productivity observations and recommends concrete actions.

Possible interventions include:

* Overdue task detection
* Deadline risk analysis
* Workload balancing
* Preparation planning
* Productivity insights

Supported actions include:

* Split large tasks
* Generate preparation tasks
* Postpone lower-priority work

All AI actions require explicit user confirmation.

---

# ⏱ Focus Timer (New in V4)

Version 4 introduces a built-in **Focus Timer** based on the Pomodoro technique.

Features include:

* 25, 45 and 60 minute focus presets
* Start, Pause and Reset controls
* Circular progress indicator
* Compact and expanded layouts
* Automatic dashboard layout adaptation
* No external packages or backend dependency

The timer integrates directly into the Dashboard, encouraging focused work sessions without leaving the application.

---

# 🌟 Personalized Motivation

The motivation system has been expanded with a dedicated **Quote Preferences** section inside Settings.

Users can configure how motivational quotes are displayed using four modes:

* Mixed
* AI Only
* My Quotes Only
* Pinned Quote

Additional capabilities include:

* Manage personal quote library
* Switch quote modes instantly
* View saved quote count
* Quick access to the Custom Quotes Manager

Changes are synchronized immediately through local storage, allowing the Dashboard to respect user preferences without requiring additional configuration.

---

# 🧠 AI Coach

The AI Coach functions as an interactive productivity assistant capable of:

* Understanding current workload
* Referring to actual task titles
* Maintaining recent conversation history
* Suggesting executable actions
* Requesting confirmation before execution

---

# 📈 Intelligent Priority Algorithm

Every task receives a dynamic Priority Score (0–100).

Current weighting:

| Factor           | Weight |
| ---------------- | ------ |
| Importance       | 40%    |
| Deadline Urgency | 40%    |
| Quick Win Bonus  | 20%    |

The Agent uses this score as one of several inputs while generating productivity recommendations.

---

# 🏗 Architecture

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
Agent Briefing
      │
      ▼
Dashboard
      │
      ├── Focus Timer
      ├── AI Recommendations
      ├── Quote System
      └── Productivity Statistics
```

Version 4 maintains the modular architecture introduced in Version 3 while improving user interaction and personalization.

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

├── src/
│   ├── components/
│   │     ├── AgentBriefing.jsx
│   │     ├── AddTaskModal.jsx
│   │     └── CustomQuotesModal.jsx
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
└── README.md
```

---

# 🚀 Installation

```bash
git clone <repository-url>

npm install

npm run dev
```

Configure your Supabase credentials in the environment file before running the application.

---

# 🔑 Gemini API Setup

To enable AI-powered functionality:

1. Create a free Gemini API key from Google AI Studio.
2. Open **Settings**.
3. Paste your API key.
4. Save the configuration.

AI-powered coaching, recommendations, and motivational content become available immediately.

---

# 🎯 Design Philosophy

Task Catalyst follows three guiding principles:

### Intelligent

Understand the user's workload rather than simply storing tasks.

### Personalized

Allow users to tailor motivation and productivity tools to match their working style.

### User Controlled

AI recommends actions, but every meaningful operation remains under explicit user approval.

---

# 📌 Current Limitations

Although Version 4 significantly improves usability and personalization, several features remain outside the current scope.

Current limitations include:


* Focus Timer operates independently and is not yet connected to task tracking or productivity analytics.
* Focus sessions are not persisted between browser refreshes.
* Offline support is limited. Internet connectivity is required for authentication, database operations, and AI-powered features.
* Shared quote collections
* Multi-device quote synchronization
* Custom quotes remain stored locally and are not synchronized across devices.
* AI interventions are generated only after meaningful task changes rather than continuous background monitoring.
* Calendar integration and reminder notifications are not yet available.
* Recurring task management is currently unsupported.
* Long-term productivity analytics and historical focus statistics have not yet been implemented.
* Better automation and more features in settings

---

# 📜 Version History

| Version | Highlights                                                                                                                      |
| ------- | ------------------------------------------------------------------------------------------------------------------------------- |
| V1      | Core productivity platform with authentication, task management, dashboard, AI coach, and intelligent priority scoring.         |
| V2      | Personalized motivation system with modular quote engine, custom quotes, and configurable quote modes.                          |
| V3      | Agentic AI reasoning engine, Agent Briefing, executable AI actions, and proactive productivity interventions.                   |
| **V4**  | Integrated Focus Timer, redesigned Quote Preferences, improved dashboard intelligence, and enhanced personalization experience. |

---

# 👨‍💻 Author

**Shivam Agrawal**

Malaviya National Institute of Technology (MNIT), Jaipur

Electrical Engineering • Full Stack Development • Artificial Intelligence

---

## ⭐ If you found this project interesting, consider giving it a star.
