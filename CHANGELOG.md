# CHANGELOG

All notable changes to **Task Catalyst** are documented in this file.

---

# Version 4

> **Release Type:** Feature Enhancement & User Experience Update

Version 4 focuses on improving the daily productivity workflow by introducing an integrated Focus Timer, reorganizing quote personalization into a dedicated Settings section, and refining dashboard intelligence introduced in Version 3.

---

## Added

### Focus Timer

Added an integrated Pomodoro-style Focus Timer directly to the Dashboard.

Features include:

* 25, 45 and 60 minute focus presets
* Start, Pause and Reset controls
* Circular progress indicator
* Session completion indicator
* Compact and expanded layouts
* Fully client-side implementation with no backend dependency

---

### Dedicated Quote Preferences

Added a new **Quote Preferences** section inside Settings.

Users can now:

* Select quote display mode
* View current quote configuration
* Access the Custom Quotes Manager
* Manage personal quote collections from a centralized location

---

## Changed

### Dashboard

Enhanced the Dashboard with:

* Integrated Focus Timer
* Adaptive layout based on upcoming deadlines
* Better use of available dashboard space
* Improved balance between productivity information and focus tools

---

### Quote Personalization

Expanded the quote configuration experience.

The application now provides four configurable quote modes:

* Mixed
* AI Only
* My Quotes Only
* Pinned Quote

Changes are applied immediately and synchronized with the Dashboard without requiring additional setup.

---

### Settings

Redesigned the Settings page to better organize personalization features.

Improvements include:

* Dedicated Quote Preferences section
* Improved settings hierarchy
* Better separation between profile, AI configuration, quote management, and work schedule

---

## Improved

* Better synchronization between Quote Preferences and Dashboard.
* Improved local storage handling for quote settings.
* Cleaner integration with the existing quote management system.
* More intuitive personalization workflow.
* Better dashboard responsiveness through adaptive component layouts.

---

## Fixed

* Improved compatibility between Settings and the quote engine.
* Eliminated inconsistencies between quote mode selection and Dashboard rendering.
* Improved synchronization after closing the Custom Quotes Manager.
* Reduced duplicate configuration logic across quote-related components.

---

## Files Modified

```text
src/pages/
    Dashboard.jsx
    Settings.jsx
```

---

## Database

No database changes.

No schema updates required.

No migrations added.

---

## Breaking Changes

None.

Existing user data and previous configurations remain fully compatible.

---

## Summary

Version 4 enhances the overall productivity experience without altering the core Agentic AI architecture introduced in Version 3. The addition of the integrated Focus Timer encourages distraction-free work sessions, while the redesigned Quote Preferences section provides a more organized and personalized motivation system.

---

## Version Progression

| Version | Primary Focus                                   |
| ------- | ----------------------------------------------- |
| V1      | Core Productivity Platform                      |
| V2      | Personalized Motivation & Quote System          |
| V3      | Agentic AI & Productivity Interventions         |
| **V4**  | Focus Management & Personalization Improvements |
