# Salon Queue Management System

**Live demo:** _coming soon (will be deployed on Vercel)_
**Hosted on:** Vercel (frontend) + Firebase Firestore (live data)
**Staff PIN (Reception / Barber / Admin):** `1234`

## About
A queue app for a salon. Customers join the queue from their phone, see their
position and estimated wait, and get an "It's your turn!" alert. The receptionist
manages the queue on a tablet, barbers use their phone to Start / Done, and a TV in
the waiting area shows who is with which barber and who is next.

Built as a vibe coding project for IT603 – Intro to Programming (MSc IT, Sem 1).

## Screens
| Screen | URL | Used by |
|---|---|---|
| Home | `/` | Customers |
| Join Queue | `/join` | Customers |
| My Status | `/status/:id` | Customers |
| Reception Dashboard | `/reception` | Receptionist (tablet) |
| Barber View | `/barber/:name` | Barbers (phone) |
| Waiting Area TV | `/display` | Waiting area |
| Owner Settings | `/admin` | Owner |

## Project docs
- [AGENTS.md](AGENTS.md) — instructions for the AI coding agent
- [docs/01-brief.md](docs/01-brief.md) — problem, users, must-have and don't-build lists
- [docs/02-screens.md](docs/02-screens.md) — every screen's layout and behaviour
- [docs/03-flows-rules.md](docs/03-flows-rules.md) — flows, queue rules, test checklist
- [prompts.md](prompts.md) — every prompt used, in order

## Tech stack
React + Vite + Tailwind CSS · Firebase Firestore · Vercel

## Run locally
_Setup steps will be added after the project is created._

## Author
Krutarth Raychura · 202612078
