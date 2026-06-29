# CHANGELOG

All notable changes to **Task Catalyst** are documented in this file.

---

# Version 3

> **Release Type:** Major Feature Update

Version 3 introduces the first **Agentic AI layer** to Task Catalyst, enabling the application to analyze task data, generate proactive interventions, and assist users through executable AI actions.

---

## Added

### Agentic AI Engine

Introduced a dedicated reasoning layer responsible for analyzing the current task state and generating structured productivity interventions.

The engine evaluates:

* Pending tasks
* Overdue tasks
* Upcoming deadlines
* Priority scores
* Estimated workload
* Postponement history

---

### Agent Briefing

Added a new Dashboard section that presents AI-generated observations in the form of concise intervention cards.

Each briefing contains:

* Observation
* Reasoning
* Optional executable action

---

### Executable AI Actions

Users can now execute supported AI suggestions directly from the interface.

Current supported actions include:

* Split a large task into subtasks
* Postpone a lower-priority task
* Generate preparation tasks for important events

---

### AI Preparation Plans

For high-priority events (assignments, interviews, presentations, exams, etc.), the agent can automatically generate a structured preparation plan and add it to the task list.

---

## Changed

### AI Coach

Upgraded from a conversational assistant to an interactive productivity assistant.

The coach can now:

* Detect executable opportunities
* Request user confirmation
* Execute supported actions after approval
* Continue conversations using recent chat history

---

### Dashboard

Enhanced the Dashboard by integrating:

* Agent Briefing
* Executable intervention cards
* Smarter AI refresh behaviour
* Better separation between task updates and AI updates

---

### AI Reasoning

Gemini prompts now include richer productivity context rather than relying only on user messages.

Additional context includes:

* Pending tasks
* Overdue tasks
* Deadline urgency
* Priority scores
* Task history

---

## Improved

* Better separation between AI reasoning and UI components.
* Reduced unnecessary AI executions during normal task updates.
* Improved modularity by introducing a dedicated Agent Engine.
* More actionable AI responses with task-specific recommendations.
* Clearer interaction flow through explicit user confirmation before executing AI actions.

---

## Fixed

* Improved synchronization between AI suggestions and Dashboard state.
* Improved handling of task refreshes after AI actions.
* Reduced repeated AI briefings during normal Dashboard updates.
* Improved fallback handling for AI-generated actions.

---

## Files Added

```text
src/components/
    AgentBriefing.jsx

src/lib/
    agentEngine.js
```

---

## Files Modified

```text
src/pages/
    Dashboard.jsx
    AICoach.jsx
```

---

## Database

No schema changes.

No database migration required.

---

## Breaking Changes

None.

Existing user data remains fully compatible.

---

## Summary

Version 3 extends Task Catalyst beyond AI-assisted task management by introducing an **Agentic AI workflow**. The application can now analyze the user's workload, present meaningful interventions, and assist with productivity actions while keeping the user in control through explicit confirmation.

---

## Version Progression

| Version | Primary Focus                           |
| ------- | --------------------------------------- |
| V1      | Core Productivity Platform              |
| V2      | Personalized Motivation & Quote System  |
| **V3**  | Agentic AI & Productivity Interventions |
