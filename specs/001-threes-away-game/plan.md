# Implementation Plan: Threes Away Dice Game

**Branch**: `001-threes-away-game` | **Date**: 2026-06-09 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-threes-away-game/spec.md`

---

## Summary

Build a hot-seat React + TypeScript web application that lets 2–8 players play the dice game Threes Away on a single browser window. Game state (players, rounds, turns, individual die results) is persisted to a SQLite database via a Node.js/Express REST API. Historical completed games are viewable in a match history screen.

## Technical Context

**Language/Version**: TypeScript 5.x (frontend + backend — shared type definitions across workspace)

**Primary Dependencies**:
- Frontend: React 18, Vite 5, Zustand (state), React Router v6
- Backend: Node.js 20, Express 5, Prisma ORM
- Shared: TypeScript, Vitest

**Storage**: SQLite (via Prisma ORM, file `backend/prisma/dev.db`)

**Testing**: Vitest + React Testing Library (frontend) · Vitest + Supertest (backend)

**Target Platform**: Modern desktop/tablet web browsers (Chrome, Firefox, Safari, Edge — current + 1 prior major version)

**Project Type**: Web application — React SPA frontend + Node.js/Express REST API backend

**Performance Goals**: Standard interactive web app; API responses < 200ms on local dev; UI renders dice results within 1 animation frame of roll response

**Constraints**: Game state must survive a full browser refresh (SC-004); backend is the authoritative source for all dice rolls and score calculations; no per-user auth required

**Scale/Scope**: 2–8 players per game session; local dev only; capstone project scale (~5–8 screens, ~6 REST endpoints)

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The project constitution (`constitution.md`) contains only template placeholders — no specific principles have been ratified. No constitutional gates apply. No violations to track.

Post-design re-check: all Phase 1 artifacts are consistent with the constitution's placeholder state. No objections raised.

---

## Project Structure

### Documentation (this feature)

```text
specs/001-threes-away-game/
├── plan.md              # This file
├── research.md          # Phase 0: tech stack decisions
├── data-model.md        # Phase 1: entity definitions, relationships, validation rules
├── quickstart.md        # Phase 1: end-to-end validation scenarios
├── contracts/
│   └── rest-api.md      # Phase 1: REST endpoint contracts
└── tasks.md             # Phase 2 output (NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
backend/
├── prisma/
│   ├── schema.prisma    # Prisma data model (Game, Player, Round, Turn, Roll, DieResult)
│   └── migrations/      # Auto-generated migration files
├── src/
│   ├── routes/          # Express route handlers (games.ts)
│   ├── services/        # Game logic (gameService.ts, diceService.ts, scoreService.ts)
│   ├── middleware/       # Error handler, validation middleware
│   └── index.ts         # Express app entry point
└── tests/
    ├── integration/     # Supertest API route tests
    └── unit/            # Service logic unit tests

frontend/
├── src/
│   ├── components/      # Reusable UI (DiceArea, Scoreboard, PlayerList, Die)
│   ├── pages/           # Route-level screens (Home, Game, History, GameDetail)
│   ├── store/           # Zustand game store (gameStore.ts)
│   ├── services/        # API client functions (api.ts)
│   └── main.tsx         # App entry point + React Router setup
└── tests/
    ├── components/      # React Testing Library component tests
    └── pages/           # Page-level integration tests

shared/
└── src/
    └── types/
        └── api.ts       # Shared DTO types imported by both backend and frontend via @shared alias

package.json             # Workspace root — npm workspaces for backend + frontend + shared
```

**Structure Decision**: Web application layout (Option 2) — separate `backend/`, `frontend/`, and `shared/` workspace packages under a single npm workspace root. The `shared` package owns all DTO type definitions; both the backend and frontend import from `@shared/types/api` via a workspace reference and tsconfig/Vite path alias, eliminating duplication of API response shapes.

---

## Complexity Tracking

No violations to justify. Constitution has no ratified principles that could be violated.
