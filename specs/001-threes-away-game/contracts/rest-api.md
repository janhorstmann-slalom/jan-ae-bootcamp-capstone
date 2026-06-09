# REST API Contract: Threes Away Dice Game

**Version**: 1.0
**Base URL**: `http://localhost:3001/api`
**Content-Type**: `application/json`
**Auth**: None (hot-seat single-device game; no user sessions)

---

## Common Types

```typescript
// Shared enums and shapes referenced across multiple endpoints

type GameStatus = "IN_PROGRESS" | "COMPLETED";

interface DieResultDTO {
  dieIndex: number;    // 0–4; stable identifier across re-rolls
  value: number;       // 1–6
  kept: boolean;       // true if kept this roll or auto-kept (value === 3)
}

interface RollDTO {
  id: string;
  rollNumber: number;  // 1..5
  dice: DieResultDTO[];
}

interface TurnDTO {
  id: string;
  playerId: string;
  turnOrder: number;   // 0-indexed within the round
  score: number | null;
  completedAt: string | null;  // ISO 8601
  rolls: RollDTO[];
}

interface RoundDTO {
  id: string;
  roundNumber: number;
  firstPlayerId: string;
  completedAt: string | null;
  turns: TurnDTO[];
}

interface PlayerDTO {
  id: string;
  name: string;
  originalPosition: number;
  cumulativeScore: number;     // computed; sum of completed turn scores
}

interface GameDTO {
  id: string;
  status: GameStatus;
  createdAt: string;           // ISO 8601
  completedAt: string | null;
  players: PlayerDTO[];
  rounds: RoundDTO[];
  // Derived convenience fields (populated by backend)
  currentRoundNumber: number | null;
  currentTurnPlayerId: string | null;  // null if game completed or between rounds
  winnerPlayerIds: string[] | null;    // null until game COMPLETED
}

interface GameSummaryDTO {
  id: string;
  status: GameStatus;
  createdAt: string;
  completedAt: string | null;
  players: Array<{ id: string; name: string; cumulativeScore: number }>;
  winnerPlayerIds: string[] | null;
}
```

---

## Endpoints

### 1. Create a New Game

**`POST /games`**

Creates a new game session and initialises Round 1 and the first Turn (for the first player).

#### Request Body

```json
{
  "players": ["Alice", "Bob", "Carol"]
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `players` | `string[]` | Yes | 2–8 unique, non-empty names (max 50 chars each) |

#### Response `201 Created`

```json
{
  "id": "clx1abc...",
  "status": "IN_PROGRESS",
  "createdAt": "2026-06-09T10:00:00.000Z",
  "completedAt": null,
  "players": [
    { "id": "clx1p1...", "name": "Alice", "originalPosition": 0, "cumulativeScore": 0 },
    { "id": "clx1p2...", "name": "Bob",   "originalPosition": 1, "cumulativeScore": 0 },
    { "id": "clx1p3...", "name": "Carol", "originalPosition": 2, "cumulativeScore": 0 }
  ],
  "rounds": [
    {
      "id": "clx1r1...",
      "roundNumber": 1,
      "firstPlayerId": "clx1p1...",
      "completedAt": null,
      "turns": [
        {
          "id": "clx1t1...",
          "playerId": "clx1p1...",
          "turnOrder": 0,
          "score": null,
          "completedAt": null,
          "rolls": []
        }
      ]
    }
  ],
  "currentRoundNumber": 1,
  "currentTurnPlayerId": "clx1p1...",
  "winnerPlayerIds": null
}
```

#### Error Responses

| Status | Code | Condition |
|--------|------|-----------|
| `400` | `INVALID_PLAYER_COUNT` | Fewer than 2 or more than 8 players |
| `400` | `DUPLICATE_PLAYER_NAME` | Two or more player names are identical (case-insensitive) |
| `400` | `EMPTY_PLAYER_NAME` | At least one name is empty or whitespace-only |

```json
{ "error": "DUPLICATE_PLAYER_NAME", "message": "Player names must be unique." }
```

---

### 2. Roll Dice

**`POST /games/:gameId/roll`**

Rolls the un-kept dice for the active turn. On the first call for a turn, all 5 dice are rolled. On subsequent calls, only dice that were not kept in the previous roll are re-rolled. Dice showing 3 are automatically marked as kept by the backend.

If all dice end up kept (including after auto-keeping 3s), the turn is **automatically completed** — the backend computes and persists the score and returns the updated game state with the next turn ready.

#### Request Body

None. The backend derives which dice to roll from the game's persisted state.

#### Response `200 OK`

```json
{
  "roll": {
    "id": "clx1ro1...",
    "rollNumber": 1,
    "dice": [
      { "dieIndex": 0, "value": 3, "kept": true },
      { "dieIndex": 1, "value": 5, "kept": false },
      { "dieIndex": 2, "value": 1, "kept": false },
      { "dieIndex": 3, "value": 3, "kept": true },
      { "dieIndex": 4, "value": 6, "kept": false }
    ]
  },
  "turnCompleted": false,
  "game": { /* full GameDTO — see Create response shape */ }
}
```

| Field | Notes |
|-------|-------|
| `roll` | The roll just created |
| `turnCompleted` | `true` if all dice ended up kept and the turn was auto-completed |
| `game` | Full updated game state |

#### Error Responses

| Status | Code | Condition |
|--------|------|-----------|
| `404` | `GAME_NOT_FOUND` | No game with this ID |
| `409` | `GAME_COMPLETED` | Game is already in COMPLETED status |
| `409` | `PENDING_KEEP` | The most recent roll for the active turn has un-kept dice that the player has not yet acted on |

---

### 3. Keep Dice

**`POST /games/:gameId/keep`**

Records the player's decision to keep one or more un-kept dice from the most recent roll. Must include at least one die index. If all remaining un-kept dice are in the request, the turn is **automatically completed** (score computed and persisted). The next turn is then created and returned.

#### Request Body

```json
{
  "dieIndices": [1, 4]
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `dieIndices` | `number[]` | Yes | Non-empty; each value 0–4; must reference un-kept dice from the most recent roll |

#### Response `200 OK`

```json
{
  "keptDice": [
    { "dieIndex": 1, "value": 5, "kept": true },
    { "dieIndex": 4, "value": 6, "kept": true }
  ],
  "turnCompleted": false,
  "turnScore": null,
  "game": { /* full GameDTO */ }
}
```

When the turn completes (all 5 dice now kept):

```json
{
  "keptDice": [ /* all 5 dice */ ],
  "turnCompleted": true,
  "turnScore": 12,
  "game": { /* updated GameDTO; currentTurnPlayerId advances to next player */ }
}
```

#### Error Responses

| Status | Code | Condition |
|--------|------|-----------|
| `404` | `GAME_NOT_FOUND` | No game with this ID |
| `409` | `GAME_COMPLETED` | Game already ended |
| `409` | `NO_ACTIVE_ROLL` | No roll in progress; player must call `/roll` first |
| `400` | `NO_DICE_SELECTED` | `dieIndices` is empty |
| `400` | `INVALID_DIE_INDEX` | An index is out of range or references an already-kept die |

---

### 4. End Game

**`POST /games/:gameId/end`**

Voluntarily ends the game. Only valid when the current round is fully complete (all players have finished their turn). Marks the game as `COMPLETED`, computes winner(s), and persists `completedAt`.

#### Request Body

None.

#### Response `200 OK`

```json
{
  "game": {
    /* full GameDTO with status: "COMPLETED", completedAt set, winnerPlayerIds populated */
  }
}
```

#### Error Responses

| Status | Code | Condition |
|--------|------|-----------|
| `404` | `GAME_NOT_FOUND` | No game with this ID |
| `409` | `GAME_COMPLETED` | Already ended |
| `409` | `ROUND_IN_PROGRESS` | Current round is not complete; cannot end mid-round |

---

### 5. Get Game State

**`GET /games/:gameId`**

Returns the full current state of a game. Used on page load/refresh to hydrate client state.

#### Response `200 OK`

Full `GameDTO` (see Create response shape).

#### Error Responses

| Status | Code | Condition |
|--------|------|-----------|
| `404` | `GAME_NOT_FOUND` | No game with this ID |

---

### 6. List Match History

**`GET /games`**

Returns all completed games in reverse chronological order. Excludes in-progress games.

#### Query Parameters

| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `page` | `number` | `1` | 1-indexed pagination |
| `limit` | `number` | `20` | Max results per page; capped at 100 |

#### Response `200 OK`

```json
{
  "games": [
    {
      "id": "clx1abc...",
      "status": "COMPLETED",
      "createdAt": "2026-06-09T10:00:00.000Z",
      "completedAt": "2026-06-09T10:45:00.000Z",
      "players": [
        { "id": "clx1p1...", "name": "Alice", "cumulativeScore": 14 },
        { "id": "clx1p2...", "name": "Bob",   "cumulativeScore": 22 }
      ],
      "winnerPlayerIds": ["clx1p1..."]
    }
  ],
  "total": 12,
  "page": 1,
  "limit": 20
}
```

---

## Error Envelope

All errors use a consistent envelope:

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable description."
}
```

---

## Notes

- The backend is the single source of truth for dice values, score calculation, turn advancement, and round rotation. The frontend never sends computed scores or die values — only player choices (`dieIndices`).
- Game state is fully re-hydrated from `GET /games/:gameId` on any page refresh, satisfying SC-004 (state survives browser refresh).
