# Data Model: Threes Away Dice Game

**Phase**: 1 (Design)
**Date**: 2026-06-09
**Feature**: [spec.md](spec.md) | [research.md](research.md)

---

## Overview

The data model reflects the game's natural hierarchy:

```
Game
└── Player (2–8 per game)
└── Round (1..N per game)
    └── Turn (1 per player per round, in rotation order)
        └── Roll (1..5 per turn; ends when all 5 dice are kept)
            └── DieResult (5 per roll; value 1–6, kept flag)
```

---

## Entities

### Game

Represents one complete game session from creation through voluntary end.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | `string` (CUID) | PK, auto-generated | |
| `status` | `enum` | `IN_PROGRESS` \| `COMPLETED` | Default `IN_PROGRESS` |
| `createdAt` | `DateTime` | auto-set on create | |
| `completedAt` | `DateTime?` | nullable | Set when game ends |

**Relationships**:
- Has many `Player` (2–8)
- Has many `Round` (ordered by `roundNumber`)
- Computed: `currentRound` = last Round where `completedAt IS NULL`

**Validation Rules**:
- Must have ≥ 2 and ≤ 8 players at creation time
- `completedAt` MUST be set if and only if `status = COMPLETED`

---

### Player

A named participant in a single game. Players are scoped to their game — the same person playing two separate games is two separate Player records.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | `string` (CUID) | PK, auto-generated | |
| `gameId` | `string` | FK → Game.id, NOT NULL | Cascade delete |
| `name` | `string` | NOT NULL, max 50 chars | |
| `originalPosition` | `int` | NOT NULL, 0-indexed | Position the player held in Round 1; immutable. Used to compute per-round first-player rotation. |

**Validation Rules**:
- `name` must be unique within a `gameId`
- `originalPosition` values across players in the same game must be a contiguous 0..(N-1) set

**Derived value** (computed, not stored):
- `cumulativeScore` = `SUM(turn.score)` across all completed turns for this player

---

### Round

One complete cycle in which every player takes exactly one turn.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | `string` (CUID) | PK, auto-generated | |
| `gameId` | `string` | FK → Game.id, NOT NULL | Cascade delete |
| `roundNumber` | `int` | NOT NULL, starts at 1 | Unique per game |
| `firstPlayerId` | `string` | FK → Player.id, NOT NULL | Derived from rotation rule; stored for auditability |
| `completedAt` | `DateTime?` | nullable | Set when all turns in this round are complete |

**Rotation rule** (enforced at round-creation time):
- Round 1: first player = player with `originalPosition = 0`
- Round N+1: first player = player whose `originalPosition` was 1 in the previous round's first-player ordering (i.e., `originalPosition = (prevFirstPlayer.originalPosition + 1) % playerCount`)

**Validation Rules**:
- `roundNumber` must be strictly monotonically increasing per game
- A new round MUST NOT be created until the previous round's `completedAt` is set

---

### Turn

One player's full sequence of rolls within one round. Score is null until the turn is completed.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | `string` (CUID) | PK, auto-generated | |
| `roundId` | `string` | FK → Round.id, NOT NULL | Cascade delete |
| `playerId` | `string` | FK → Player.id, NOT NULL | |
| `turnOrder` | `int` | NOT NULL, 0-indexed within the round | Determines player sequence within the round |
| `score` | `int?` | nullable, ≥ 0 | Null while in progress; set on turn completion |
| `completedAt` | `DateTime?` | nullable | Set when all 5 dice are kept and score is computed |

**Score computation** (enforced by backend, never client-calculated):
- `score = SUM(dieResult.value)` for all `dieResult` records in all rolls of this turn, where `value ≠ 3`
- Dice showing 3 contribute 0 to the score (they are summed as 0 effectively)

**Validation Rules**:
- Exactly one Turn per `(roundId, playerId)` pair
- `score` MUST be set if and only if `completedAt` is set
- A Turn MUST NOT be created until the preceding Turn (by `turnOrder`) in the same round is complete

---

### Roll

One invocation of the dice roll within a turn. A turn has 1 to 5 rolls; each roll covers only the dice not yet kept.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | `string` (CUID) | PK, auto-generated | |
| `turnId` | `string` | FK → Turn.id, NOT NULL | Cascade delete |
| `rollNumber` | `int` | NOT NULL, starts at 1 | Unique per turn |

**Validation Rules**:
- Maximum 5 rolls per turn (5 dice, minimum 1 kept per roll)
- A new Roll MUST NOT be created for a turn whose `completedAt` is set
- A Roll MUST produce exactly as many DieResult records as there are un-kept dice entering that roll (5 for the first roll)

---

### DieResult

The outcome of a single die in a single roll. Stores the face value and whether the player kept this die.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | `string` (CUID) | PK, auto-generated | |
| `rollId` | `string` | FK → Roll.id, NOT NULL | Cascade delete |
| `dieIndex` | `int` | NOT NULL, 0–4 | Identifies which of the 5 dice this result represents; stable across re-rolls |
| `value` | `int` | NOT NULL, 1–6 | Face value rolled |
| `kept` | `boolean` | NOT NULL, default `false` | Set to `true` when player keeps this die or when value = 3 |

**Auto-keep rule** (enforced by backend):
- On insertion: if `value = 3`, `kept` MUST be set to `true` immediately; it MUST NOT be changeable to `false` afterward.

**Validation Rules**:
- `value` must be in range [1, 6]
- `kept` for a value-3 die is immutable `true`
- A `dieIndex` must be unique within a `rollId`
- A `dieIndex` that was `kept = true` in roll N must NOT appear in any Roll with `rollNumber > N` for the same turn

---

## State Transitions

### Game status

```
[created] → IN_PROGRESS → COMPLETED
```

### Turn lifecycle

```
[turn created] → (Roll 1 created) → player keeps ≥1 die
                                   ↓
                        all dice kept? → YES → score computed → completedAt set
                                       → NO  → Roll N+1 created → repeat
```

---

## Indexes (performance)

| Table | Index | Purpose |
|-------|-------|---------|
| `Game` | `status` | Filter match history to `COMPLETED` games |
| `Player` | `(gameId, name)` | Unique constraint + history lookup |
| `Round` | `(gameId, roundNumber)` | Order rounds chronologically |
| `Turn` | `(roundId, turnOrder)` | Ordered turn progression |
| `Turn` | `(roundId, playerId)` | Uniqueness check |
| `DieResult` | `(rollId, dieIndex)` | Uniqueness check |

---

## Notes

- All IDs use CUIDs (Prisma default) rather than auto-increment integers to avoid leaking record counts and to support future distributed scenarios without collision.
- All timestamps are stored as UTC.
- Cumulative scores, current round, and current turn are computed at query time rather than stored, ensuring consistency without update anomalies.
