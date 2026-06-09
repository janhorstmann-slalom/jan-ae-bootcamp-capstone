-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME
);

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gameId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "originalPosition" INTEGER NOT NULL,
    CONSTRAINT "Player_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Round" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gameId" TEXT NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "firstPlayerId" TEXT NOT NULL,
    "completedAt" DATETIME,
    CONSTRAINT "Round_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Round_firstPlayerId_fkey" FOREIGN KEY ("firstPlayerId") REFERENCES "Player" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Turn" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roundId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "turnOrder" INTEGER NOT NULL,
    "score" INTEGER,
    "completedAt" DATETIME,
    CONSTRAINT "Turn_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Turn_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Roll" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "turnId" TEXT NOT NULL,
    "rollNumber" INTEGER NOT NULL,
    CONSTRAINT "Roll_turnId_fkey" FOREIGN KEY ("turnId") REFERENCES "Turn" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DieResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rollId" TEXT NOT NULL,
    "dieIndex" INTEGER NOT NULL,
    "value" INTEGER NOT NULL,
    "kept" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "DieResult_rollId_fkey" FOREIGN KEY ("rollId") REFERENCES "Roll" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Game_status_idx" ON "Game"("status");

-- CreateIndex
CREATE INDEX "Player_gameId_name_idx" ON "Player"("gameId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Player_gameId_name_key" ON "Player"("gameId", "name");

-- CreateIndex
CREATE INDEX "Round_gameId_roundNumber_idx" ON "Round"("gameId", "roundNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Round_gameId_roundNumber_key" ON "Round"("gameId", "roundNumber");

-- CreateIndex
CREATE INDEX "Turn_roundId_turnOrder_idx" ON "Turn"("roundId", "turnOrder");

-- CreateIndex
CREATE INDEX "Turn_roundId_playerId_idx" ON "Turn"("roundId", "playerId");

-- CreateIndex
CREATE UNIQUE INDEX "Turn_roundId_playerId_key" ON "Turn"("roundId", "playerId");

-- CreateIndex
CREATE UNIQUE INDEX "Roll_turnId_rollNumber_key" ON "Roll"("turnId", "rollNumber");

-- CreateIndex
CREATE INDEX "DieResult_rollId_dieIndex_idx" ON "DieResult"("rollId", "dieIndex");

-- CreateIndex
CREATE UNIQUE INDEX "DieResult_rollId_dieIndex_key" ON "DieResult"("rollId", "dieIndex");
