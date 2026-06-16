# Feature Specification: Threes Away Dice Game

**Feature Branch**: `001-threes-away-game`

**Created**: 2026-06-09

**Status**: Draft

**Input**: User description: "React application with an unspecified backend that enables a user to play the popular dice game Threes Away. The game data should persist in a backend database. Historical matches should be stored."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Start a New Game (Priority: P1)

A user opens the application, enters names for all participants, and starts a new game session. The application records the player list, establishes the initial turn order, and navigates to the first player's roll screen.

**Why this priority**: This is the mandatory entry point for all gameplay. No other feature is usable until a game session exists.

**Independent Test**: A new game with 2 or more named players can be created and brought to the first player's active turn screen, independently validating the entire game-setup flow.

**Acceptance Scenarios**:

1. **Given** the application home screen, **When** a user enters at least 2 player names and starts the game, **Then** a game session is created, persisted, and the first player's turn begins.
2. **Given** the game creation form, **When** a user submits with only 1 player name, **Then** the system rejects the submission and displays an error requiring at least 2 players.
3. **Given** the game creation form, **When** a user submits with a duplicate player name, **Then** the system rejects the submission and asks for unique names.
4. **Given** a new game is started, **When** Round 1 begins, **Then** the first player entered is the first to roll.

---

### User Story 2 - Take a Turn: Roll and Keep Dice (Priority: P1)

The active player rolls five dice. Any dice showing 3 are automatically kept (worth 0 points). The player selects at least one additional die to keep, then re-rolls the remaining dice. This process repeats until all dice are kept. The turn score is calculated and recorded.

**Why this priority**: This is the core game mechanic. All other features depend on it.

**Independent Test**: A single player can complete an entire turn — from initial roll through all re-rolls to final score recording — without any other players or rounds being required.

**Acceptance Scenarios**:

1. **Given** it is a player's turn, **When** they initiate their roll, **Then** five dice are displayed with random face values between 1 and 6 inclusive.
2. **Given** dice are displayed and one or more show 3, **When** the player views their dice, **Then** all dice showing 3 are automatically marked as kept and visually distinguished; they cannot be de-selected.
3. **Given** dice are displayed, **When** the player selects at least one non-3 die to keep and confirms, **Then** the selected dice are locked and the remaining dice are re-rolled.
4. **Given** dice are displayed with no 3s present, **When** the player attempts to confirm without selecting any die, **Then** the system prevents confirmation and displays a message requiring at least one die to be kept.
5. **Given** the current roll has all 3s (every die is auto-kept), **When** the result is evaluated, **Then** the remaining dice are all locked and the turn proceeds to scoring without requiring additional player action.
6. **Given** all dice have been kept across one or more rolls, **When** the turn ends, **Then** the turn score is computed as the sum of all kept die face values with 3s counted as zero, and displayed to all players.
7. **Given** a turn is scored, **When** score recording occurs, **Then** the score is persisted and the application advances to the next player's turn.

---

### User Story 3 - View Live Scoreboard (Priority: P2)

At any point during the game, players can view the current scoreboard showing each participant's cumulative score across all completed rounds.

**Why this priority**: Score visibility sustains engagement and informs strategic decisions, but the game remains playable without it if scoring is shown per-turn.

**Independent Test**: After at least one player completes a turn, the scoreboard displays that player's score correctly; it can be verified independently before multi-round logic is built.

**Acceptance Scenarios**:

1. **Given** at least one turn has been completed, **When** a player views the scoreboard, **Then** each player's current cumulative total and per-round scores are shown.
2. **Given** a player just finished their turn, **When** the scoreboard updates, **Then** the updated score is reflected without requiring a full page reload.
3. **Given** the game is in Round 1 and no one has completed a turn yet, **When** the scoreboard is viewed, **Then** all players show a score of zero.

---

### User Story 4 - Play Multiple Rounds with Rotation (Priority: P2)

After every player completes a turn, the round ends. A new round begins with the player who was second in the previous round now going first. Play continues until all players agree to end the game.

**Why this priority**: Multi-round play with the specified rotation rule is essential to the full Threes Away experience and differentiates it from a simple single-turn scoring tool.

**Independent Test**: After all players complete Round 1, the system correctly identifies round completion, applies the rotation rule (player 2 becomes player 1), and begins Round 2.

**Acceptance Scenarios**:

1. **Given** all players have completed exactly one turn in Round N, **When** the last player's score is recorded, **Then** the system detects end-of-round and increments to Round N+1.
2. **Given** Round N+1 begins, **When** play starts, **Then** the player who was second in Round N is now first, and all other players shift one position earlier accordingly.
3. **Given** a game is in progress and a complete round has just ended, **When** all players agree to end the game, **Then** the game is finalized, a winner is declared, and all data is persisted.
4. **Given** the game ends, **When** results are displayed, **Then** the player(s) with the lowest cumulative score are declared winner(s); tied lowest scores result in co-winners.

---

### User Story 5 - Browse Match History (Priority: P3)

Any user can open a match history screen listing all completed games, with the ability to drill into a specific game to see round-by-round scores for each player.

**Why this priority**: Historical records add long-term value and fulfill the "historical matches should be stored" requirement, but the game is fully playable without this view.

**Independent Test**: After completing a full game, it appears in match history with the correct date, player names, and winner; the detail view shows per-round scores.

**Acceptance Scenarios**:

1. **Given** at least one game has been completed, **When** a user opens match history, **Then** a list of past games is displayed with game date, list of players, and declared winner.
2. **Given** the match history list, **When** a user selects a specific game, **Then** a detailed view shows each player's score for every round and their cumulative total.
3. **Given** no games have been completed, **When** a user opens match history, **Then** a friendly empty-state message is shown.
4. **Given** match history is open, **When** many games exist, **Then** games are listed in reverse chronological order (most recent first).

---

### Edge Cases

- What happens when all five dice on the first roll show 3? All dice are automatically kept; the turn immediately ends with a score of 0, and the next player's turn begins.
- What happens if every remaining die on a re-roll shows 3? All are auto-kept; no player action is required and the turn proceeds to scoring.
- What if two or more players finish with the same lowest score? All tied players are declared co-winners.
- What happens if the game is closed mid-turn before scoring? Game state persisted to the database should allow the session to be resumed or the in-progress turn to be voided and re-played upon reconnection.
- What is the maximum number of rolls possible in one turn? Five rolls at most (each roll keeps at least 1 die; starting with 5 dice, a player could keep exactly 1 each time: rolls 1–5, keeping 1 each time).

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow a user to create a new game session with a minimum of 2 named players.
- **FR-002**: System MUST reject game creation if fewer than 2 players are provided or if any player names are duplicates.
- **FR-003**: System MUST present a random roll of exactly 5 dice (each showing a value 1–6) at the start of each player's turn.
- **FR-004**: System MUST automatically mark all dice displaying a face value of 3 as kept; these dice MUST NOT be de-selectable by the player.
- **FR-005**: System MUST require the active player to explicitly keep at least one non-3 die before allowing a re-roll, unless all remaining dice have been auto-kept as 3s.
- **FR-006**: System MUST prevent already-kept dice from being included in subsequent rolls.
- **FR-007**: System MUST calculate a player's turn score as the sum of all kept die face values, with dice showing 3 contributing 0 to the total.
- **FR-008**: System MUST display the turn score to all players immediately upon turn completion.
- **FR-009**: System MUST persist the turn score to a durable data store before advancing to the next player.
- **FR-010**: System MUST detect when all players have completed exactly one turn and designate that as the end of the current round.
- **FR-011**: System MUST begin the next round with the player who was second in the previous round now occupying the first position; all other players shift one position forward.
- **FR-012**: System MUST allow players to voluntarily end the game after any complete round has finished.
- **FR-013**: System MUST identify the game winner as the player(s) with the lowest cumulative score at game end; tied lowest scores result in co-winners.
- **FR-014**: System MUST persist all game data — including player list, round number, turn order, individual roll results, turn scores, and final outcome — to a durable data store.
- **FR-015**: System MUST provide a match history view listing all completed games.
- **FR-016**: System MUST provide a game detail view accessible from match history showing each player's per-round score and cumulative total.
- **FR-017**: System MUST operate as a hot-seat game — all players share one browser window on a single device and physically pass control to the next player when their turn begins. No real-time network synchronization between separate devices is required.

### Key Entities *(include if feature involves data)*

- **Game**: Represents a complete game session; includes participant list, round sequence, current state (in-progress or completed), and final winner(s).
- **Player**: A named participant in a game; tracks cumulative score and position in turn order.
- **Round**: One complete cycle in which every player takes exactly one turn; tracks round number and the turn-order rotation applied.
- **Turn**: A single player's full sequence of rolls within one round; records each roll event, which dice were kept, and the final turn score.
- **Die**: An individual die within a roll; has a face value (1–6) and a kept/available status.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new game with 2 or more players can be created, configured, and started in under 60 seconds.
- **SC-002**: A complete player turn (all rolls, die selections, and score recording) can be performed in under 3 minutes.
- **SC-003**: 100% of Threes Away rules are enforced automatically — no invalid die selection, incorrect score calculation, or improper turn-order rotation is possible through normal application use.
- **SC-004**: Game state survives a full browser refresh; an in-progress game can be resumed without data loss.
- **SC-005**: Completed games appear in match history within 5 seconds of game conclusion.
- **SC-006**: Match history correctly displays per-round and cumulative scores for 100% of completed games.
- **SC-007**: The application is functional and playable with 2 to 8 concurrent players per game session.

---

## Assumptions

- A game supports a minimum of 2 and a maximum of 8 players (standard for social dice games).
- Players are identified by display name only; no account registration or password-based authentication is required for this version.
- The game winner is the player with the **lowest** cumulative score (standard Threes Away rules).
- There is no fixed round count; the game ends when all players mutually agree to stop after a complete round.
- The dice roll is performed by the application using a fair, unbiased random number generator; physical dice are not tracked.
- Match history is accessible to all users of the application with no per-user data isolation for this version.
- The application targets modern desktop and tablet web browsers; native mobile app support is out of scope.
- Resuming an in-progress game from the database is a desirable capability but may be delivered as a stretch goal.
