# Quickstart Validation Guide: Threes Away Dice Game

**Purpose**: Prove the feature works end-to-end by running the app and exercising each user story acceptance scenario.

**References**:
- [spec.md](spec.md) — acceptance scenarios
- [data-model.md](data-model.md) — entity definitions
- [contracts/rest-api.md](contracts/rest-api.md) — API endpoints and shapes

---

## Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | ≥ 20 |
| npm | ≥ 10 |

---

## Setup

```bash
# From repo root
npm install           # install all workspace dependencies

# Backend: initialise database and run migrations
cd backend
npx prisma migrate dev --name init
cd ..

# Start both servers (from repo root)
npm run dev
```

Expected output:
- Backend listening on `http://localhost:3001`
- Frontend dev server at `http://localhost:5173`

---

## Scenario 1: Create a New Game (User Story 1 — P1)

**Validates**: FR-001, FR-002, SC-001

### Happy path

1. Open `http://localhost:5173` in a browser.
2. Enter player names: `Alice`, `Bob`.
3. Click **Start Game**.

**Expected**:
- Application navigates to the dice-roll screen for Alice (first player).
- Scoreboard shows Alice: 0, Bob: 0.
- A `GET /api/games/:id` call returns `status: "IN_PROGRESS"` and `currentTurnPlayerId` pointing to Alice's player ID.

### Validation: too few players

4. Return to home. Attempt to start with only one name entered.

**Expected**: Error message "At least 2 players are required." Game is not created.

### Validation: duplicate names

5. Attempt to start with names `Alice`, `alice` (case-insensitive check).

**Expected**: Error message about unique names. Game is not created.

---

## Scenario 2: Take a Turn — Core Dice Mechanic (User Story 2 — P1)

**Validates**: FR-003, FR-004, FR-005, FR-006, FR-007, FR-008, FR-009, SC-002, SC-003

### Sub-scenario 2a: Normal roll with no 3s

1. From the active game, click **Roll Dice** for Alice.

**Expected**: 5 dice are displayed with random values 1–6. Any dice showing 3 are highlighted as auto-kept and unclickable.

2. Click at least one non-3 die to select it. Click **Keep Selected**.

**Expected**: Selected dice are locked (greyed/marked). Remaining un-kept dice are re-rolled with new random values.

3. Repeat until all dice are kept.

**Expected**: Turn score is displayed as the sum of all kept values (3s counted as 0). Score is saved. Dice area transitions to Bob's turn prompt.

### Sub-scenario 2b: All dice show 3 on first roll

1. (Simulate or wait for a roll where all 5 dice are 3 — or verify via API.)

**Expected**: Turn immediately completes with score 0. No player action required. The next player's turn begins.

### Sub-scenario 2c: Attempt to keep zero dice

1. On Alice's roll, do not click any die. Click **Keep Selected**.

**Expected**: Button is disabled or an error message appears: "Select at least one die to keep."

---

## Scenario 3: Live Scoreboard (User Story 3 — P2)

**Validates**: FR-008, SC-003

1. Complete Alice's first turn with a non-zero score.

**Expected**: Scoreboard updates to show Alice's score immediately (no page refresh needed). Bob still shows 0.

2. Complete Bob's first turn.

**Expected**: Scoreboard shows both scores.

---

## Scenario 4: Multi-round Rotation (User Story 4 — P2)

**Validates**: FR-010, FR-011, FR-012, FR-013, SC-003

1. Complete all players' turns in Round 1.

**Expected**: Application announces end of Round 1 and begins Round 2. Bob (originally second) is now the first player in Round 2.

2. Complete all turns in Round 2. After all turns are recorded, click **End Game**.

**Expected**:
- Game ends and a results screen is shown.
- Winner is the player with the **lowest** cumulative score.
- If tied, all tied-lowest players are listed as co-winners.
- `GET /api/games/:id` returns `status: "COMPLETED"` and `winnerPlayerIds` populated.

---

## Scenario 5: Game State Survives Refresh (SC-004)

1. Start a game, complete one player's turn.
2. Refresh the browser (F5 or Cmd+R).

**Expected**: Application re-loads the correct game state. The current player's turn is shown. Scores for completed turns are preserved.

---

## Scenario 6: Match History (User Story 5 — P3)

**Validates**: FR-015, FR-016, SC-005, SC-006

1. Complete a full game (at least 2 rounds, then End Game).
2. Navigate to the **History** screen (link in header or home page).

**Expected**:
- The completed game appears in the list with game date, player names, and winner.
- Games are ordered most-recent-first.
- Empty state message shown if no completed games exist.

3. Click the game entry.

**Expected**: Detail view shows each player's per-round score and cumulative total, matching the scores observed during play.

---

## API Smoke Tests (Backend-only validation)

Run these with `curl` or the included HTTP test file while the backend is running:

```bash
# 1. Create a game
curl -s -X POST http://localhost:3001/api/games \
  -H "Content-Type: application/json" \
  -d '{"players":["Alice","Bob"]}' | jq .

# 2. Roll dice (replace GAME_ID with id from step 1)
curl -s -X POST http://localhost:3001/api/games/GAME_ID/roll | jq .

# 3. Keep a die (replace indices as needed)
curl -s -X POST http://localhost:3001/api/games/GAME_ID/keep \
  -H "Content-Type: application/json" \
  -d '{"dieIndices":[0]}' | jq .

# 4. List match history (after completing a game)
curl -s http://localhost:3001/api/games | jq .
```

See [contracts/rest-api.md](contracts/rest-api.md) for full request/response shapes.
