import { integer, jsonb, pgEnum, pgTable, serial, text } from "drizzle-orm/pg-core";
import { localGameType, onlineGameType, phases, placePhase, type Board, type GameType, type Phase, type Player, type Position } from "../domain/game";

export const phaseEnum = pgEnum("phase", phases as [Phase, ...Phase[]]);

export const gameTypeEnum = pgEnum("game_type", [localGameType, onlineGameType] as [GameType, ...GameType[]]);

export const gamesTable = pgTable("games", {
    id: serial("id").primaryKey(),
    gameType: gameTypeEnum("game_type").default(localGameType).notNull(),
    numVars: integer("num_vars").notNull(),
    player1: text("player_1"),
    player2: text("player_2"),
    phase: phaseEnum("phase").default(placePhase).notNull(),
    currentTurn: integer("current_turn").notNull(),
    board: jsonb("board").$type<Board>().notNull(),
    moveCounter: integer("move_counter").notNull(),
    scoring_groups:
        jsonb("scoring_groups").$type<{ [key in Player]: Position[][] }>(),
});

export type InsertGame = typeof gamesTable.$inferInsert;
export type SelectGame = typeof gamesTable.$inferSelect;
