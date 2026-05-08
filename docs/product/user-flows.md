# User Flows

## Principles

- Mobile-first: every flow must work comfortably on a phone.
- Shared credentials: Alex and Max can both log in with the same household username/password.
- Persona-aware sessions: after login, the selected persona is attached to the session until changed or logged out.
- Visibility must be explicit: private draft, shared household, partner-visible, and check-in-only states are never implied.
- Relationship-support copy must stay practical and non-clinical.

## Create Household

1. User opens Fairplay and chooses create household.
2. User enters household name, household username, and household password.
3. Server validates username availability and password requirements.
4. Server stores only a slow password hash and creates the household with default personas Alex and Max.
5. User sees a short non-clinical product boundary: Fairplay helps organize household responsibilities and check-ins; it is not therapy, crisis support, or a tool for unsafe confrontation.
6. User chooses Alex or Max for the current session.
7. App routes to onboarding.

Error states:

- Username unavailable.
- Password too weak.
- Network/server error with no password echoed back.
- Session created but persona not selected, which routes back to persona selection.

## Login and Persona Selection

1. User enters household username and password.
2. Server verifies the password hash and creates a server-managed session.
3. User chooses Alex or Max.
4. Session stores household id and selected persona id.
5. App routes to home.

Session behavior:

- Logout invalidates the active session.
- Expired sessions return to login.
- Sessions use secure cookies and must not store household data or secrets in browser storage.
- A user may switch persona only through an explicit persona switch action, with visible confirmation of the active persona.

## Onboarding and Education

1. User sees a short setup path: map a few responsibilities, assign owners, plan check-ins, and schedule a check-in.
2. User can start from a blank responsibility, a tiny demo example, or a guided first responsibility.
3. Education uses original wording and explains concepts such as ownership, hidden coordination, good-enough expectations, review dates, and private vs shared visibility.
4. User can skip education and return later.

Safety behavior:

- The app reminds users not to use shared notes or check-ins if doing so could create risk.
- Tense topics can be saved privately, paused, or left out of check-in notes.

## Load Map and Responsibility Overview

1. User opens the load map.
2. App displays responsibilities grouped by current state or filtered by owner, cadence, tag, review date, or hidden effort.
3. Each responsibility summary shows title, owner state, cadence, review timing, status, and visibility-sensitive indicators.
4. User can add, edit, pause, archive, or mark not relevant.
5. Aggregate load signals show patterns such as owner distribution, due reviews, open concerns, high-frequency items, and paused/not-relevant counts without partner scores.

## Responsibility Creation and Assignment

1. User creates a responsibility with an original title and optional notes.
2. User sets area tags, cadence, relevant days if needed, hidden effort dimensions, current status, and review date.
3. User defines the household's own "done well enough" expectation.
4. User assigns Alex, Max, shared ownership, helper/backup support, or leaves it unassigned.
5. If owner or support roles change, app prompts for handoff context and a revisit date.
6. App records a responsibility event and returns to the load map.

States:

- Unassigned: visible as needing a decision.
- Active: one accountable owner or a shared owner arrangement.
- Needs review: flagged for clarification without forcing reassignment.
- Paused: intentionally not active for now.
- Not relevant: out of household scope.
- Archived: retained for history but hidden from daily views.

## Check-In Record

1. User schedules a check-in date and time.
2. After the meeting, the user confirms it happened.
3. User may add or update optional minutes/notes.

Check-in history:

- Notes are factual and short.
- History supports continuity, not a grievance archive.
- The flow is a reminder and record, not a guided conversation script.

## Settings and Data Controls

1. User can edit household display name and persona display preferences.
2. User can log out.
3. Future controls for export, deletion, household exit, and access revocation are acknowledged as post-v1 requirements before broader launch.
