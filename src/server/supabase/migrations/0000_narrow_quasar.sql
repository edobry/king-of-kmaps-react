CREATE TYPE "public"."phase" AS ENUM('Place', 'Score', 'End');--> statement-breakpoint
CREATE TABLE "games" (
	"id" serial PRIMARY KEY NOT NULL,
	"num_vars" integer NOT NULL,
	"player_1" text NOT NULL,
	"player_2" text NOT NULL,
	"phase" "phase" NOT NULL,
	"current_turn" integer NOT NULL,
	"board" jsonb NOT NULL,
	"move_counter" integer NOT NULL,
	"scoring_groups" jsonb
);
