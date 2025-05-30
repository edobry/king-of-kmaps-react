import { integer, jsonb, pgEnum, pgTable, serial, text } from "drizzle-orm/pg-core";
import { phases, type Board, type Player, type Position } from "../domain/game";

export const phaseEnum = pgEnum("phase", phases as [string, ...string[]]);

export const gamesTable = pgTable("games", {
    id: serial("id").primaryKey(),
    numVars: integer("num_vars").notNull(),
    player1: text("player_1").notNull(),
    player2: text("player_2").notNull(),
    phase: phaseEnum("phase").notNull(),
    currentTurn: integer("current_turn").notNull(),
    board: jsonb("board").$type<Board>().notNull(),
    moveCounter: integer("move_counter").notNull(),
    scoring_groups: jsonb("scoring_groups").$type<{ [key in Player]: Position[][] }>(),
});

export type InsertGame = typeof gamesTable.$inferInsert;
export type SelectGame = typeof gamesTable.$inferSelect;
