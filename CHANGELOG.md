# Changelog

All notable changes to **Task Catalyst** are documented in this file.

The format follows the principles of **Keep a Changelog**, documenting the evolution of the project between major versions.

---

# Version 2

> Release Type: **Major Feature Update**

This release introduces a fully customizable motivational quote system, improves AI integration, enhances the dashboard experience, and significantly expands personalization.

---

## Added

### Advanced Quote Engine

Introduced an entirely new quote management system capable of intelligently selecting motivational content from multiple sources.

Features include:

* AI-generated quotes
* Built-in motivational quote library
* User-created custom quotes
* Pinned favorite quotes
* Smart fallback handling
* Duplicate prevention
* Non-repeating quote rotation
* Persistent quote preferences

---

### Quote Modes

Added four independent quote display modes:

* Mixed
* AI Only
* My Quotes Only
* Pinned Quote

Users can now control exactly how motivational quotes are selected.

---

### Custom Quotes Manager

Added a dedicated modal for managing personal quotes.

Supported operations:

* Create quote
* Edit quote
* Delete quote
* Pin quote
* Switch quote modes
* Browse built-in quote collection

---

### Quote Source Identification

Dashboard now displays the source of every motivational quote.

Possible sources:

* Gemini AI
* My Quote
* Classic Inspiration

This improves transparency and user awareness.

---

### Persistent Quote Preferences

Quote settings are now preserved locally.

Stored information includes:

* Selected quote mode
* Custom quote library
* Pinned quote
* Previously displayed quote

This allows a personalized experience across application sessions on the same device.

---

## Changed

### Dashboard

The Dashboard quote section has been completely redesigned.

Improvements include:

* New quote source badges
* Quote refresh improvements
* Custom quote management button
* Cleaner card layout
* Better interaction flow

---

### Gemini Integration

Motivational quote generation has been refactored.

Previously:

* Gemini returned a quote or an internal fallback.

Now:

* Gemini only returns AI-generated content.
* Fallback selection is handled by the new quote engine.

This creates a cleaner separation of responsibilities.

---

### Quote Selection Logic

Quote generation now uses a centralized resolver responsible for:

* AI selection
* Fallback handling
* Custom quote selection
* Pinned quote retrieval
* Duplicate prevention

instead of distributing this logic across multiple components.

---

## Improved

### Personalization

Users can now build their own motivational library instead of relying solely on AI-generated content.

---

### User Experience

Improved quote interactions through:

* Source indicators
* Better refresh behavior
* More predictable quote rotation
* Reduced repetition

---

### Maintainability

Separated quote-related functionality into an independent module, making future development easier.

---

## Fixed

* Prevent duplicate custom quotes.
* Prevent immediate quote repetition.
* Improved fallback behavior when Gemini is unavailable.
* Improved resilience during AI request failures.
* Cleaner handling of unavailable API keys.

---

## Files Added

```text
src/lib/
    quotes.js

src/components/
    CustomQuotesModal.jsx
```

---

## Files Modified

```text
src/pages/
    Dashboard.jsx

src/lib/
    gemini.js
```

---

## Architecture Changes

### Previous Architecture (V1)

```text
Dashboard
      │
      ▼
Gemini
      │
      ▼
Fallback Quote
```

All quote-related logic was contained inside the Gemini utility.

---

### Current Architecture (V2)

```text
Dashboard
      │
      ▼
Gemini
      │
      ▼
resolveQuote()
      │
 ┌────┼─────────────┐
 │    │             │
 ▼    ▼             ▼
AI  Custom     Built-in
Quote Quotes    Quotes
```

Quote generation is now modular, making future extensions significantly easier.

---

## Internal Refactoring

* Centralized quote handling.
* Modular quote engine.
* Reduced Dashboard responsibility.
* Cleaner separation between AI generation and UI presentation.
* Improved code organization.

---

## Performance

Minor improvements through:

* Local persistence using localStorage.
* Reduced unnecessary quote generation.
* Smarter random selection.

---

## Breaking Changes

None.

Existing user data remains compatible.

If custom quote settings are unavailable, the application gracefully falls back to default behavior.

---

## Migration Notes

No database migration is required.

This version only introduces client-side improvements.

Existing projects can upgrade without modifying the Supabase schema.

---

# Summary

Version 2 transforms Task Catalyst's motivational system from a simple AI-generated quote feature into a fully configurable quote platform.

The application now offers significantly greater personalization while maintaining graceful degradation when AI services are unavailable.

---

## Statistics

**New Components**

* 1 Component

**New Utility Modules**

* 1 Module

**Major Files Modified**

* Dashboard
* Gemini
* Settings

**Primary Focus**

* Motivation
* Personalization
* Dashboard Experience
* Quote Engine Architecture
