CREATE TYPE "public"."game_type" AS ENUM('local', 'online');--> statement-breakpoint
ALTER TABLE "games" ALTER COLUMN "player_2" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "games" ALTER COLUMN "phase" SET DEFAULT 'Place';--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "game_type" "game_type" DEFAULT 'local' NOT NULL;