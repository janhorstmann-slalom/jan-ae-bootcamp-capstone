# Research: Threes Away — Technology Decisions

**Phase**: 0 (Pre-design research)
**Date**: 2026-06-09
**Feature**: 001-threes-away-game

---

## Decision 1: Backend Framework

**Decision**: Express (Node.js)

**Rationale**: Express is the most widely documented Node.js framework with the largest bootcamp and tutorial ecosystem. TypeScript support is mature via `tsx`/`ts-node`. Its middleware model maps directly to REST route patterns, and it is universally recognizable during code reviews and demos.

**Alternatives considered**:
- Hono — more TypeScript-native and modern, but fewer bootcamp-specific tutorials and less familiar to interviewers
- FastAPI (Python) — excellent DX, but splits the language across frontend (TypeScript) and backend (Python), losing the benefit of shared type definitions
- NestJS — production-grade TypeScript backend, but opinionated boilerplate is a steep ramp for a capstone timeline

---

## Decision 2: Database

**Decision**: SQLite (file-based, local)

**Rationale**: Zero-config — no server process required for local development. The game's relational data model (game → rounds → turns → rolls → dice) maps cleanly to normalized SQLite tables. For a capstone that runs locally, SQLite removes all infrastructure friction.

**Alternatives considered**:
- PostgreSQL — production-grade and preferred in real deployments, but requires a running server daemon and adds setup overhead with no benefit for local-only dev
- MongoDB — document model could store a game as a single nested document, but normalized relational queries (e.g., per-player per-round scores) become awkward

---

## Decision 3: ORM / Data Access

**Decision**: Prisma

**Rationale**: Schema-first workflow: define the data model in `schema.prisma`, run `prisma migrate dev`, and Prisma auto-generates TypeScript types for all entities. Prisma Studio provides a GUI database browser. The most beginner-accessible ORM for a bootcamp project.

**Alternatives considered**:
- Drizzle ORM — more TypeScript-idiomatic, but its query-builder API has a steeper ramp for learners unfamiliar with SQL builder patterns
- Raw SQL with `better-sqlite3` — transparent, zero abstraction, but manual type-mapping is error-prone and verbose

---

## Decision 4: Frontend Build Tooling

**Decision**: Vite + React + TypeScript

**Rationale**: Vite is the de-facto standard React toolchain in 2025-2026, replacing CRA. Fast HMR, native TypeScript support, and direct Vitest integration.

**Alternatives considered**:
- Create React App — deprecated upstream
- Next.js — adds SSR complexity unnecessary for a client-rendered hot-seat game

---

## Decision 5: Frontend State Management

**Decision**: Zustand

**Rationale**: Game state (active player index, 5 dice values, kept-dice flags, round/turn counters, cumulative scores) is shared across multiple components (dice area, scoreboard, turn controls). Zustand's ~5-line store API is far cleaner than nested Context providers and avoids Redux Toolkit's boilerplate without adding meaningful learning overhead.

**Alternatives considered**:
- `useState` + React Context — sufficient for small apps, but passing game state through multiple layers of components without Zustand requires wrapping providers and `useContext` in every consumer; becomes messy at this scope
- Redux Toolkit — robust but introduces Actions/Reducers/Slices overhead that slows a capstone timeline

---

## Decision 6: Testing Frameworks

**Decision**: Vitest + React Testing Library (frontend) / Vitest + Supertest (backend)

**Rationale**: A single test runner (Vitest) across both packages eliminates config duplication. React Testing Library's `user-event` model maps directly to the spec's Given/When/Then acceptance scenarios. Supertest enables HTTP-layer integration tests against Express without spawning a live server.

**Alternatives considered**:
- Jest — mature, but requires babel transformation and additional config with Vite; Vitest is a strict superset drop-in
- Playwright — valuable for E2E but heavier; reserved as a stretch goal

---

## Decision 7: API Style

**Decision**: REST (JSON over HTTP)

**Rationale**: REST is the universal bootcamp standard with the broadest documentation and the most transferable knowledge. The endpoints map naturally to the game's state machine (create game, roll dice, keep dice, end game, list history).

**Alternatives considered**:
- tRPC — full end-to-end type safety is genuinely beneficial, but requires both ends to be TypeScript, uses non-standard transport, and its setup cost outweighs the benefit at this project scale

---

## Resolved Unknowns

| Unknown from Spec | Resolution |
|---|---|
| "unspecified backend" | Node.js + Express + TypeScript |
| Backend database | SQLite via Prisma ORM |
| Testing approach | Vitest + React Testing Library / Supertest |
| State management | Zustand |
| API style | REST |
| Build tooling | Vite + React + TypeScript |
