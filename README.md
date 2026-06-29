# 🚀 Task Catalyst

> **An AI-Powered Productivity Companion for Students**

Task Catalyst is an intelligent productivity application that combines traditional task management with Google's Gemini AI to help students organize work, prioritize effectively, and stay motivated.

Unlike conventional to-do applications, Task Catalyst provides contextual AI assistance, intelligent task recommendations, personalized coaching, and a customizable motivational quote system that adapts to each user's preferences.

---

# ✨ Version

**Current Version:** **V2**

This release introduces a significantly enhanced motivation system through a fully customizable quote engine, improved AI integration, better dashboard interactions, and a more personalized user experience.

---

# 📖 Overview

Task Catalyst was created with one objective:

> **Help students consistently finish important work instead of simply recording it.**

The application combines:

* Intelligent task management
* AI-powered coaching
* Smart prioritization
* Personalized motivation
* Productivity insights
* Modern responsive interface

Every feature is designed to reduce procrastination while making planning feel natural rather than overwhelming.

---

# 🌟 Core Features

## 🔐 Secure Authentication

* Email & Password authentication
* Supabase Authentication
* Automatic user profile creation
* Row-Level Security (RLS)
* User-specific data isolation

---

## 📋 Task Management

Create and manage tasks with:

* Title
* Description
* Deadline
* Importance Rating (1–5)
* Estimated Time
* Category
* Status Tracking
* Priority Score
* Postpone Counter

Supported operations:

* Create
* Update
* Delete
* Complete
* Postpone
* Filter
* Sort

---

## 🧠 AI Productivity Coach

Powered by **Google Gemini**.

Capabilities include:

* Productivity coaching
* Study guidance
* Planning assistance
* Task prioritization advice
* Motivation
* Personalized conversations

Unlike generic chatbots, the coach understands:

* Current pending tasks
* Overdue work
* Upcoming deadlines
* Task priorities
* Postponement history

This allows responses to reference the user's actual workload rather than giving generic productivity advice.

---

## 📊 Intelligent Dashboard

The dashboard acts as the user's productivity command center.

It displays:

* Personalized greeting
* Daily motivation
* Pending tasks
* Completed tasks
* Overdue tasks
* Completion rate
* AI recommendations
* Top priority tasks
* Quick task completion

---

# 🌟 New in Version 2

Version 2 introduces the largest functional improvement since the project's initial release.

## 🎯 Advanced Quote Engine

The previous static quote system has been replaced with a fully configurable motivation engine.

Features include:

* AI-generated quotes
* Personal quote collection
* Built-in inspirational library
* Pinned favorite quotes
* Smart quote selection
* Duplicate prevention
* Non-repeating quote rotation
* Local persistence

---

## 📚 Custom Quote Library

Users can now maintain their own motivational collection.

Capabilities:

* Add quotes
* Edit quotes
* Delete quotes
* Persist locally
* Prevent duplicate entries

---

## 🎨 Four Quote Modes

Users can choose how motivation is generated.

### Mixed Mode

Combines:

* Gemini AI
* Personal quotes
* Built-in classics

---

### AI Only

Uses Gemini-generated quotes whenever available.

Automatically falls back if AI is unavailable.

---

### My Quotes Only

Displays only quotes written by the user.

If no custom quotes exist, built-in classics are used.

---

### Pinned Quote

Allows one quote to remain permanently displayed until changed.

Ideal for personal goals or favorite reminders.

---

## 🏷 Quote Source Badges

Every displayed quote now identifies its origin.

Possible sources:

* Gemini AI
* My Quote
* Classic Inspiration

This provides transparency while improving user experience.

---

## 🔄 Smarter Quote Rotation

The new quote engine avoids immediately repeating previously displayed quotes.

When multiple quotes are available, intelligent randomization keeps motivation fresh.

---

# 🧠 AI Features

Google Gemini powers:

* Motivational quote generation
* Productivity coaching
* Task recommendations
* Personality analysis

If Gemini is unavailable:

* Intelligent fallback quotes are used
* Application remains fully functional

---

# 📈 Priority Algorithm

Each task receives a score between **0–100**.

The score is calculated using:

| Factor           | Weight |
| ---------------- | ------ |
| Importance       | 40%    |
| Deadline Urgency | 40%    |
| Quick Win Bonus  | 20%    |

Higher scores indicate tasks that deserve immediate attention.

---

# 🗄 Database

The application currently uses two primary tables.

## tasks

Stores:

* task information
* deadlines
* importance
* priority scores
* postpone history
* completion timestamps

---

## user_profiles

Stores:

* profile information
* Gemini API key
* work schedule
* productivity type

---

# 🔐 Security

Security is handled through Supabase.

Features include:

* Row-Level Security
* Secure authentication
* Protected user profiles
* Automatic profile creation
* Private Gemini API key storage

Every user can only access their own information.

---

# 🛠 Technology Stack

## Frontend

* React
* Vite
* JavaScript
* CSS

## Backend

* Supabase

## Database

* PostgreSQL

## Artificial Intelligence

* Google Gemini API

---

# 📂 Project Structure

```text
Task_Catalyst/
│
├── public/
│
├── src/
│   ├── components/
│   ├── lib/
│   ├── pages/
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
│
├── supabase/
│
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
VITE_SUPABASE_URL=YOUR_URL
VITE_SUPABASE_ANON_KEY=YOUR_KEY
```

Run development server

```bash
npm run dev
```

Production build

```bash
npm run build
```

---

# 🔑 Gemini API Setup

To unlock AI-powered features:

1. Open **Settings**
2. Visit **Google AI Studio**
3. Generate a free Gemini API key
4. Paste the key into Task Catalyst
5. Save settings

Once configured, AI features become immediately available.

---

# 🎯 Design Philosophy

Task Catalyst follows a simple principle:

> Productivity tools should reduce mental effort—not create more of it.

Every interface decision focuses on:

* Minimal friction
* Fast interactions
* Clear prioritization
* Useful AI assistance
* Personalized motivation

---

# 📌 Current Limitations

Current quote preferences are stored locally.

Future versions may include:
* Notifications, reminders, and background scheduling are not available in this version.
* Cloud synchronization
* AI-generated daily briefing
* Offline support is limited. Internet connectivity is required for authentication, database operations, and AI-powered features.
* Shared quote collections
* Advanced productivity analytics
* Intelligent scheduling agent
* Multi-device quote synchronization
* Better automation and more features in settings

---

# 👨‍💻 Author

**Shivam Agrawal**

Malaviya National Institute of Technology (MNIT), Jaipur

Electrical Engineering • AI • Full Stack Development

---

## ⭐ If you found this project interesting, consider giving it a star.
