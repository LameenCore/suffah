# Skill: Security Review - Suffa

This project handles data about children (students aged 10–13) and their guardians. Treat data scoping and access control as a first-class concern even in hackathon mode - not because of regulatory pressure in a demo, but because it's the responsible default for a product concept involving minors, and it's a question judges may reasonably ask.

## Non-negotiables even under time pressure

- **Row-level scoping by `masjid_id` on every query** - a parent or student should never be able to see another masjid's or another family's data, even by guessing an ID in a URL
- **Role-gated routes** - a student session cannot hit admin or parent endpoints; a parent session cannot hit another family's student data
- **No student PII in client-side logs or exposed in API error messages** - keep error responses generic ("not found" / "unauthorized"), not descriptive of what exists

## Things to explicitly flag as demo-only limitations (say this out loud in Q&A if asked)

- Volunteer vetting is a status field, not a real background-check integration - do not imply otherwise anywhere in the UI copy
- The waqf/donation ledger is mock data - do not connect real payment credentials for a hackathon build
- Auth is basic role-based (admin/parent/student) - no granular permissions, no audit log, in this scope

## Data minimization

- Only collect what's actually used in the demo flow (name, role, pod assignment, course results) - do not add speculative fields (address, phone, detailed medical/dietary info, etc.) that aren't used anywhere, since unused sensitive-looking fields are a liability with no demo payoff
