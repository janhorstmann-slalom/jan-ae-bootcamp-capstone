# Tasks: Threes Away Dice Game

**Input**: Design documents from `specs/001-threes-away-game/`

**Prerequisites**: [plan.md](plan.md) · [spec.md](spec.md) · [research.md](research.md) · [data-model.md](data-model.md) · [contracts/rest-api.md](contracts/rest-api.md) · [quickstart.md](quickstart.md)

**Tests**: Unit tests included (backend service logic via Vitest; frontend components via Vitest + React Testing Library).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story. Task IDs are sequential in execution order.

## Format: `[ID] [P?] [Story?] Description — file path`

- **[P]**: Can run in parallel (works in different files, no incomplete-task dependencies)
- **[Story]**: Which user story this task belongs to (US1–US5)
- Exact file paths are included in every task description

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize npm workspace, scaffold both packages, and configure tooling. No user story can begin until this phase is complete.

- [ ] T001 Initialize npm workspace with `backend/`, `frontend/`, and `shared/` packages; install `concurrently` at the root — `package.json` (root), `backend/package.json`, `frontend/package.json`, `shared/package.json`
- [ ] T002 Bootstrap Express + TypeScript backend: install `express@^5`, `typescript`, `tsx`, `@types/express@^5`, `prisma`, `@prisma/client`; add `shared` as a workspace dependency — `backend/package.json`, `backend/tsconfig.json`
- [ ] T003 Bootstrap Vite + React + TypeScript frontend: run `npm create vite@latest frontend -- --template react-ts`; install `react-router-dom`, `zustand`; add `shared` as a workspace dependency — `frontend/package.json`, `frontend/tsconfig.json`, `frontend/vite.config.ts`
- [ ] T004 [P] Configure Vitest in backend with `supertest` and `@types/supertest` — `backend/vitest.config.ts`
- [ ] T005 [P] Configure Vitest and React Testing Library in frontend — `frontend/vitest.config.ts`, `frontend/src/setupTests.ts`
- [ ] T006 [P] Add root-level `npm run dev` workspace script using `concurrently` to start both `backend` and `frontend` in parallel — `package.json`

**Checkpoint**: `npm run dev` from repo root starts both servers without errors.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core backend infrastructure and frontend skeleton that ALL user stories depend on. Nothing in Phase 3+ can be built until this phase is complete.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T007 Define Prisma schema with all six entities: `Game`, `Player`, `Round`, `Turn`, `Roll`, `DieResult` — `backend/prisma/schema.prisma`
- [ ] T008 Run initial Prisma migration to create SQLite database and generate client types — `backend/prisma/migrations/`, `backend/prisma/dev.db`
- [ ] T009 Create Express app entry point with JSON body parsing and global error-handling middleware — `backend/src/index.ts`, `backend/src/middleware/errorHandler.ts`
- [ ] T010 [P] Create `shared` package: export all DTO types matching REST API contract shapes (`GameDTO`, `PlayerDTO`, `RoundDTO`, `TurnDTO`, `RollDTO`, `DieResultDTO`, `GameSummaryDTO`) — `shared/src/types/api.ts`, `shared/package.json` (with `exports` field pointing to compiled output)
- [ ] T011 [P] Configure `shared` package imports: add `paths` alias `@shared/*` in `backend/tsconfig.json`; add matching `resolve.alias` in `frontend/vite.config.ts` so both packages can `import type { GameDTO } from '@shared/types/api'` — `backend/tsconfig.json`, `frontend/vite.config.ts`
- [ ] T012 Setup React Router v6 with top-level routes for Home, Game, History, and GameDetail pages (page components as stubs) — `frontend/src/main.tsx`, `frontend/src/App.tsx`
- [ ] T013 [P] Create Zustand game store with initial state shape: `game`, `setGame`, `clearGame` actions — `frontend/src/store/gameStore.ts`
- [ ] T014 [P] Create API client module with a typed base `apiFetch` wrapper (handles JSON, propagates error codes) — `frontend/src/services/api.ts`
- [ ] T014a [P] Implement `GET /api/games/:id` route handler — returns full `GameDTO` with computed `cumulativeScore` on each player; needed by the Phase 3 checkpoint and game-state rehydration — `backend/src/routes/games.ts`
- [ ] T014b [P] Add `getGame(gameId)` helper to API client — used by Phase 3 checkpoint verification, Phase 4 rehydration (T052), and Phase 5 Scoreboard — `frontend/src/services/api.ts`

**Checkpoint**: Backend starts, connects to SQLite, and returns `404` for unknown routes. `GET /api/games/:id` returns a valid `GameDTO`. Frontend renders stub pages at each route without errors.

---

## Phase 3: User Story 1 — Start a New Game (Priority: P1) 🎯 MVP

**Goal**: A user can enter 2–8 player names and create a game session that is persisted and ready for the first roll.

**Independent Test**: Follow [quickstart.md § Scenario 1](quickstart.md). Create a 2-player game via the UI; confirm it appears in `GET /api/games/:id` with `status: "IN_PROGRESS"` and `currentTurnPlayerId` set to the first player.

### Unit Tests for User Story 1

- [ ] T015 [P] [US1] Unit tests for `gameService.createGame()`: valid 2-player and 8-player creation, rejects < 2 players, rejects > 8 players, rejects duplicate names (case-insensitive), rejects empty/whitespace names, verifies Round 1 and first Turn are created — `backend/tests/unit/gameService.create.test.ts`
- [ ] T016 [P] [US1] Unit tests for `NewGameForm` component: renders two name inputs by default, Add Player button appends a row, Remove button removes a row (disabled when only 2 rows remain), shows inline error when names are duplicated, submit fires callback with trimmed names — `frontend/tests/components/NewGameForm.test.tsx`

### Implementation for User Story 1

- [ ] T017 [P] [US1] Implement `gameService.createGame(playerNames)` — validates 2–8 unique non-empty names, persists `Game`, `Player` records, creates Round 1 and the first `Turn` — `backend/src/services/gameService.ts`
- [ ] T018 [US1] Implement `POST /api/games` route handler: call `gameService.createGame()`, return `201` with full `GameDTO` or structured error codes (`INVALID_PLAYER_COUNT`, `DUPLICATE_PLAYER_NAME`, `EMPTY_PLAYER_NAME`) — `backend/src/routes/games.ts`
- [ ] T019 [US1] Register games router on Express app — `backend/src/index.ts`
- [ ] T020 [US1] Build `NewGameForm` component: controlled inputs for player names (add/remove rows, min 2, max 8), inline validation errors, submit button — `frontend/src/components/NewGameForm.tsx`
- [ ] T021 [US1] Build `Home` page: renders `NewGameForm`, calls `POST /api/games` via `api.ts`, stores result in Zustand, navigates to `/game/:id` on success — `frontend/src/pages/Home.tsx`
- [ ] T022 [US1] Add `createGame(playerNames)` helper to API client — `frontend/src/services/api.ts`

**Checkpoint**: A user can fill in the New Game form, click Start, and land on the (stub) Game page. `GET /api/games/:id` returns the persisted game with two players and one in-progress round.

---

## Phase 4: User Story 2 — Take a Turn: Roll and Keep Dice (Priority: P1)

**Goal**: The active player can roll dice, auto-keep 3s, explicitly keep ≥1 die per roll, re-roll remaining dice, and see their final turn score persisted — all enforced by the backend.

**Independent Test**: Follow [quickstart.md § Scenario 2](quickstart.md). Complete a full player turn via the UI from initial roll through all re-rolls. Verify turn score displayed matches the sum of kept die values (3s = 0). Verify `GET /api/games/:id` shows the turn as `completedAt` set and score populated.

### Unit Tests for User Story 2

- [ ] T023 [P] [US2] Unit tests for `diceService.rollDice(count)`: returns exactly `count` values, all values in range [1, 6], different calls produce varied results — `backend/tests/unit/diceService.test.ts`
- [ ] T024 [P] [US2] Unit tests for `scoreService.computeTurnScore()`: sums non-3 face values correctly, treats all 3s as zero contribution, all-3s turn scores 0, mixed values sum correctly — `backend/tests/unit/scoreService.test.ts`
- [ ] T025 [P] [US2] Unit tests for `gameService.rollDice()` and `gameService.keepDice()`: auto-keeps dice valued 3 on roll, rejects roll when `PENDING_KEEP` state exists, rejects keep with empty indices, rejects keep on already-kept die index, completes turn and sets score when all 5 dice are kept — `backend/tests/unit/gameService.roll.test.ts`
- [ ] T026 [P] [US2] Unit tests for `Die` and `DiceArea` components: `Die` renders face value, applies correct CSS class for kept/available/auto-kept states, is not clickable when kept; `DiceArea` Keep button is disabled when no die is selected, Roll button is disabled while a pending-keep exists — `frontend/tests/components/DiceArea.test.tsx`

### Implementation for User Story 2

- [ ] T027 [P] [US2] Implement `diceService.rollDice(count)` — returns an array of cryptographically-fair random integers 1–6 — `backend/src/services/diceService.ts`
- [ ] T028 [P] [US2] Implement `scoreService.computeTurnScore(turnId)` — queries all `DieResult` records for the turn, sums non-3 values, returns integer score — `backend/src/services/scoreService.ts`
- [ ] T029 [US2] Implement `gameService.rollDice(gameId)` — validates game is `IN_PROGRESS` and no pending-keep state, creates a `Roll` with `DieResult` rows (auto-sets `kept = true` for value 3), auto-completes turn if all dice ended up kept — `backend/src/services/gameService.ts`
- [ ] T030 [US2] Implement `POST /api/games/:id/roll` route handler — calls `gameService.rollDice()`, returns `RollResponseDTO` including `roll`, `turnCompleted`, and updated `GameDTO`; returns `GAME_COMPLETED` or `PENDING_KEEP` on conflict — `backend/src/routes/games.ts`
- [ ] T031 [US2] Implement `gameService.keepDice(gameId, dieIndices)` — validates indices reference un-kept dice on the latest roll, marks them kept, auto-completes turn if all 5 dice are now kept, computes and persists score, creates next `Turn` record — `backend/src/services/gameService.ts`
- [ ] T032 [US2] Implement `POST /api/games/:id/keep` route handler — calls `gameService.keepDice()`, returns `KeepResponseDTO` including `keptDice`, `turnCompleted`, `turnScore`, and updated `GameDTO`; returns `NO_ACTIVE_ROLL`, `NO_DICE_SELECTED`, or `INVALID_DIE_INDEX` on errors — `backend/src/routes/games.ts`
- [ ] T033 [P] [US2] Build `Die` component: displays face value, visually distinguishes kept/available/auto-kept(3) states, clickable when available — `frontend/src/components/Die.tsx`
- [ ] T034 [P] [US2] Build `DiceArea` component: renders five `Die` components, Roll button (disabled when `PENDING_KEEP`), Keep button (disabled when no dice selected or when 0 available dice), tracks local selection state — `frontend/src/components/DiceArea.tsx`
- [ ] T035 [US2] Build `Game` page: displays active player name, renders `DiceArea`, calls `rollDice` and `keepDice` API helpers, updates Zustand store after each response, shows turn-score modal/banner on `turnCompleted: true` — `frontend/src/pages/Game.tsx`
- [ ] T036 [US2] Add `rollDice(gameId)` and `keepDice(gameId, dieIndices)` helpers to API client — `frontend/src/services/api.ts`

**Checkpoint**: A user can complete a full multi-roll turn from the UI. Backend enforces all Threes Away rules (auto-keep 3s, must keep ≥1 die). Score is displayed and the next player's name appears.

---

## Phase 5: User Story 3 — View Live Scoreboard (Priority: P2)

**Goal**: Players can see each participant's cumulative score at any time during the game, updated immediately after every turn without a page reload.

**Independent Test**: Follow [quickstart.md § Scenario 3](quickstart.md). Complete one player's turn; verify their score updates in the scoreboard without a manual refresh. Verify a zero-score player shows 0, not blank.

### Unit Tests for User Story 3

- [ ] T037 [P] [US3] Unit tests for `Scoreboard` component: renders a row for each player, shows 0 for players with no completed turns, displays correct cumulative score after turns, applies active-player highlight class to the current player — `frontend/tests/components/Scoreboard.test.tsx`

### Implementation for User Story 3

- [ ] T040 [US3] Build `Scoreboard` component: renders player name and cumulative score for each player; highlights the current active player — `frontend/src/components/Scoreboard.tsx`
- [ ] T041 [US3] Integrate `Scoreboard` into `Game` page: update Zustand store (and thus Scoreboard) after every `keepDice` response that returns `turnCompleted: true`; `GET /api/games/:id` and `getGame()` already available from T014a/T014b — `frontend/src/pages/Game.tsx`

> **Note**: `GET /api/games/:id` (T014a) and `getGame()` helper (T014b) were implemented in Phase 2 (Foundational) to satisfy the Phase 3 checkpoint.

**Checkpoint**: Scoreboard is visible on the Game page, shows all players at 0 at game start, and updates immediately after each turn completes.

---

## Phase 6: User Story 4 — Play Multiple Rounds with Rotation (Priority: P2)

**Goal**: After all players complete a round, the app starts the next round with the correct player rotation. Players can voluntarily end the game after a complete round; the winner (lowest score) is declared.

**Independent Test**: Follow [quickstart.md § Scenario 4](quickstart.md). Complete Round 1 with all players; verify Round 2 begins with the originally-second player going first. End the game; verify the player with the lowest total score is declared winner.

### Unit Tests for User Story 4

- [ ] T042 [P] [US4] Unit tests for round-completion detection and rotation logic in `gameService`: round marks `completedAt` only after all turns are complete, rotation formula `(prevFirst.originalPosition + 1) % playerCount` is applied correctly for 2-player, 3-player, and 8-player games, new round's `firstPlayerId` matches expected player — `backend/tests/unit/gameService.round.test.ts`
- [ ] T043 [P] [US4] Unit tests for `gameService.endGame()`: winner is the player with the lowest cumulative score, co-winners declared when two or more players tie for lowest, returns `ROUND_IN_PROGRESS` error when called before the current round is complete — `backend/tests/unit/gameService.endGame.test.ts`

### Implementation for User Story 4

- [ ] T044 [US4] Implement round-completion detection in `gameService` — after each turn is saved, check if all `Turn` records in the current `Round` have `completedAt` set; if so, set `Round.completedAt` — `backend/src/services/gameService.ts`
- [ ] T045 [US4] Implement next-round creation in `gameService` — when a round completes and the game is still `IN_PROGRESS`, create a new `Round` with `roundNumber + 1`, compute `firstPlayerId` using the rotation rule (`(prevFirstPlayer.originalPosition + 1) % playerCount`), and create the first `Turn` — `backend/src/services/gameService.ts`
- [ ] T046 [US4] Implement `gameService.endGame(gameId)` — validates current round is complete, sets `Game.status = COMPLETED`, sets `completedAt`, determines `winnerPlayerIds` (player(s) with lowest cumulative score) — `backend/src/services/gameService.ts`
- [ ] T047 [US4] Implement `POST /api/games/:id/end` route handler — calls `gameService.endGame()`, returns updated `GameDTO` with `status: "COMPLETED"` and `winnerPlayerIds`; returns `ROUND_IN_PROGRESS` if called mid-round — `backend/src/routes/games.ts`
- [ ] T048 [US4] Add `endGame(gameId)` helper to API client — `frontend/src/services/api.ts`
- [ ] T049 [US4] Display round transition on `Game` page: after the last turn of a round, show a "Round N complete — Round N+1 starting" banner and update active player — `frontend/src/pages/Game.tsx`
- [ ] T050 [US4] Add **End Game** button to `Game` page (visible only when current round is complete); wire to `endGame` API helper, then navigate to `/game/:id/result` — `frontend/src/pages/Game.tsx`
- [ ] T051 [US4] Build `GameResult` page: shows final scoreboard (all players, all rounds, cumulative totals) and declares winner(s); provides navigation back to Home to start a new game — `frontend/src/pages/GameResult.tsx`
- [ ] T052 [US4] Implement game-state rehydration on browser refresh: `Game` page reads `gameId` from URL params, calls `getGame(gameId)`, and populates Zustand store on mount — `frontend/src/pages/Game.tsx`

**Checkpoint**: After completing Round 1, Round 2 begins with the correct first player. Clicking End Game (after a full round) navigates to the results screen showing the winner. Refreshing the browser mid-game restores the correct state.

---

## Phase 7: User Story 5 — Browse Match History (Priority: P3)

**Goal**: Any user can open a match history screen listing all completed games (most-recent first) and drill into any game to see per-round and cumulative scores for every player.

**Independent Test**: Follow [quickstart.md § Scenario 6](quickstart.md). Complete a full game; navigate to History; verify the game appears with correct date, player names, and winner. Click it; verify per-round and cumulative scores are accurate.

### Unit Tests for User Story 5

- [ ] T053 [P] [US5] Unit tests for `History` page: renders empty-state message when passed an empty games list, renders a list item for each game with correct player names and winner displayed, list items include a link to the game detail route — `frontend/tests/pages/History.test.tsx`

### Implementation for User Story 5

- [ ] T054 [P] [US5] Implement `GET /api/games` list route — returns paginated `GameSummaryDTO[]` of `COMPLETED` games ordered by `completedAt DESC`; supports `?page` and `?limit` query params — `backend/src/routes/games.ts`
- [ ] T055 [P] [US5] Add `listGames(page?, limit?)` and `getGameDetail(gameId)` helpers to API client — `frontend/src/services/api.ts`
- [ ] T056 [US5] Build `History` page: fetches and renders a list of completed games showing date, player names, and winner; shows empty-state message when no completed games exist; list items link to `/history/:id` — `frontend/src/pages/History.tsx`
- [ ] T057 [US5] Build `GameDetail` page: fetches game by ID via `getGame(gameId)`, renders a table with one column per round plus a cumulative total column, one row per player — `frontend/src/pages/GameDetail.tsx`
- [ ] T058 [US5] Add History navigation link to the `Home` page and a back-to-History link in `GameDetail` — `frontend/src/pages/Home.tsx`, `frontend/src/pages/GameDetail.tsx`

**Checkpoint**: History page lists completed games newest-first. Empty state shown when no games exist. Game detail shows per-round and cumulative scores matching play history.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Hardening, consistency, and full end-to-end validation.

- [ ] T059 [P] Add request validation middleware for all POST body payloads (player name length/uniqueness, dieIndices range) — `backend/src/middleware/validate.ts`
- [ ] T060 [P] Add a React `ErrorBoundary` component to catch unhandled frontend render errors with a friendly fallback UI — `frontend/src/components/ErrorBoundary.tsx`
- [ ] T061 Apply consistent CSS/styling across all pages (header, nav, die visuals, scoreboard, buttons) — `frontend/src/styles/`
- [ ] T062 Run all [quickstart.md](quickstart.md) validation scenarios end-to-end and confirm every acceptance scenario in [spec.md](spec.md) passes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — **blocks all user stories**
- **US1 (Phase 3)**: Depends on Phase 2; write tests (T015–T016) before implementing (T017–T022)
- **US2 (Phase 4)**: Depends on US1; write tests (T023–T026) before implementing (T027–T036)
- **US3 (Phase 5)**: Depends on US2; write test (T037) before implementing (T038–T041)
- **US4 (Phase 6)**: Depends on US2; write tests (T042–T043) before implementing (T044–T052)
- **US5 (Phase 7)**: Depends on US4; write test (T053) before implementing (T054–T058)
- **Polish (Phase 8)**: Depends on all user story phases

### User Story Dependencies

| Story | Depends On | Can Start After |
|-------|-----------|-----------------|
| US1 — Create Game | Foundational | Phase 2 complete |
| US2 — Roll & Keep | US1 (game must exist) | US1 complete |
| US3 — Scoreboard | US2 (turn scores needed) | US2 complete |
| US4 — Multi-round | US2 + US3 (T052 uses `getGame` from T014b) | US3 complete |
| US5 — History | US4 (games need to be ended) | US4 complete |

### Within Each User Story

- **Tests first**: write unit tests, verify they fail, then implement
- Backend service → Backend route → Frontend API helper → Frontend component → Frontend page → Integration
- Backend tasks marked [P] can run in parallel with other backend tasks targeting different files
- Frontend component tasks marked [P] can run in parallel with each other

### Parallel Opportunities

```bash
# Phase 1 — run together:
T004  Configure Vitest in backend
T005  Configure Vitest in frontend
T006  Add root dev script

# Phase 2 — after T007+T008, run together:
T010  Create shared package + DTO types
T011  Configure @shared alias (tsconfig + vite)
T013  Create Zustand store skeleton
T014  Create API client module
T014a GET /api/games/:id route
T014b getGame() API helper

# Phase 3 (US1) — write tests together:
T015  gameService.createGame() unit tests
T016  NewGameForm component unit tests

# Phase 4 (US2) — write tests together, then implement together:
T023  diceService unit tests
T024  scoreService unit tests
T025  gameService roll/keep unit tests
T026  Die/DiceArea component unit tests
# Then implement together:
T027  diceService.rollDice()
T028  scoreService.computeTurnScore()
T033  Die component
T034  DiceArea component

# Phase 5 (US3) — run together (GET route + getGame already done in Phase 2):
T037  Scoreboard component unit tests
T040  Scoreboard component
T041  Integrate Scoreboard into Game page

# Phase 6 (US4) — write tests together:
T042  Round rotation unit tests
T043  endGame() unit tests

# Phase 7 (US5) — run together after T053 test:
T054  GET /api/games list route
T055  listGames() / getGameDetail() API helpers

# Phase 8 — run together:
T059  Validation middleware
T060  ErrorBoundary component
```

---

## Implementation Strategy

### MVP Scope (User Stories 1 + 2 only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: US1 — write tests T015–T016 → implement T017–T022
4. Complete Phase 4: US2 — write tests T023–T026 → implement T027–T036
5. **STOP and VALIDATE**: Run quickstart.md Scenarios 1 & 2; confirm all unit tests pass

MVP delivers a fully playable single-round hot-seat game persisted to the database. Every subsequent phase adds value without breaking this foundation.

### Incremental Delivery

| Milestone | Phases | What it unlocks |
|-----------|--------|-----------------|
| MVP | 1 + 2 + 3 + 4 | Playable game, persisted turns |
| M2 | + 5 | Live scoreboard |
| M3 | + 6 | Multi-round play + winner declaration |
| M4 | + 7 | Match history |
| Final | + 8 | Polished, validated app |

---

## Notes

- `[P]` = safe to run in parallel with other `[P]` tasks in the same phase (targets different files, no incomplete-task dependencies)
- `[USn]` label maps every task to its user story for traceability back to spec.md acceptance scenarios
- Unit test tasks appear **before** their corresponding implementation tasks within each phase — write tests first, confirm they fail, then implement
- The backend is the single authority for dice values, score calculation, and turn/round advancement — the frontend never sends computed results, only player choices (`dieIndices`)
- Commit after each phase or logical group of tasks
