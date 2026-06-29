# CHANGELOG

All notable changes to **Task Catalyst** are documented in this file.

---

# Version 5

> **Release Type:** Architecture, Reliability & Customization Update

Version 5 focuses on strengthening the application's internal architecture through Dashboard Manager, improved database design, smarter agent reasoning, and enhanced maintainability while preserving the productivity workflow introduced in previous versions.

---

## Added

### Dashboard Manager

Introduced a customizable Dashboard Manager allowing users to control the visibility of Dashboard widgets.

Supported widgets include:

* Daily Motivation Quote
* Agent Briefing
* Focus Timer
* AI Recommendation
* Due Today / Tomorrow cards

Dashboard preferences are now stored per user in Supabase.

---

### Dashboard Preference Architecture

Added `dashboardPrefs.js` as the centralized configuration layer.

Introduced:

* `DEFAULT_PREFS`
* `WIDGET_DEFS`
* `resolvePrefs()`

This establishes a single source of truth for Dashboard widget configuration and simplifies future expansion.

---

### Database Improvements

Added new database capabilities including:

* `dashboard_prefs` JSONB column
* Validation constraints for task and profile data
* Performance indexes on frequently queried fields
* Safer migration execution using `IF NOT EXISTS`

---

## Changed

### Dashboard

* Dashboard now renders widgets based on stored user preferences.
* Dashboard configuration is dynamically generated instead of relying on hard-coded visibility rules.
* Improved separation between UI rendering and configuration logic.

---

### Agent Engine

Improved AI reasoning by:

* correcting deadline interpretation
* improving urgency calculations
* generating more realistic intervention messages
* refining task prioritization logic

---

### Agent Briefing

Enhanced the briefing interface with:

* observation count badge
* stronger visual hierarchy
* improved intervention previews
* smarter split-task scheduling
* better priority recalculation for generated subtasks
* improved execution feedback

---

### Task Management

Improved task interaction experience by:

* fixing dropdown overlap issues
* improving task action consistency
* refining split-task behaviour
* improving generated deadline distribution

---

### Database Security

Strengthened database security by:

* recreating authentication trigger using explicit schema references
* setting a fixed `search_path`
* improving trigger safety against search path injection
* preserving migration reusability

---

## Improved

* Better maintainability through centralized dashboard configuration.
* Reduced duplicated configuration across Dashboard and Settings.
* Improved scalability of future Dashboard features.
* Cleaner separation between application logic and presentation.
* Improved overall code documentation and internal architecture.

---

## Fixed

* Fixed task action dropdown rendering behind neighbouring task cards.
* Fixed misleading Agent Briefing messages caused by inaccurate deadline interpretation.
* Improved split-task generation for more realistic scheduling.
* Improved consistency of generated priority scores.
* Improved synchronization between Dashboard preferences and rendered widgets.

---

## Files Added

```text
src/lib/
    dashboardPrefs.js
```

---

## Files Modified

```text
src/pages/
    Dashboard.jsx
    Settings.jsx
    Tasks.jsx

src/components/
    AgentBriefing.jsx

src/lib/
    agentEngine.js

supabase/migrations/
    dashboard_preferences_and_security.sql
```

---

## Database

### Added

* `dashboard_prefs` JSONB column
* Validation constraints
* Performance indexes

### Updated

* Secure `handle_new_user()` trigger
* Authentication trigger recreation
* Improved migration safety

---

## Breaking Changes

None.

All existing user data, tasks, and profiles remain compatible with previous versions.

---

## Summary

Version 5 is an architectural refinement release. Rather than introducing major end-user features, it improves customization, database robustness, AI reasoning quality, and long-term maintainability. The introduction of Dashboard Manager and centralized widget configuration provides a scalable foundation for future Dashboard enhancements while strengthening the overall reliability of Task Catalyst.

---

## Version Progression

| Version | Primary Focus                                                            |
| ------- | ------------------------------------------------------------------------ |
| V1      | Core Productivity Platform                                               |
| V2      | Personalized Motivation System                                           |
| V3      | Agentic AI & Intelligent Dashboard                                       |
| V4      | Focus Management & UI Refinements                                        |
| **V5**  | Dashboard Customization, Database Hardening & Architectural Improvements |
