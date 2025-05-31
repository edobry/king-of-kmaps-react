import { config } from "@dotenvx/dotenvx";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { GameModel } from "../domain/game";
import { gamesTable, type SelectGame } from "./schema";

config({ path: ".env", override: true });

const client = postgres(process.env.SUPABASE_URL!, { prepare: false });

const gameId = 0;

class GameDb {
    private db = drizzle({ client, schema: { gamesTable } });

    async getGame(): Promise<GameModel | undefined> {
        const game: SelectGame | undefined = await this.db.query.gamesTable.findFirst({
            where: eq(gamesTable.id, gameId),
        });

        if (!game) {
            return undefined;
        }

        return new GameModel(game);
    }

    async setGame(game: GameModel) {
        const record = game.toRecord();

        if (record.id !== undefined) {
            await this.db.update(gamesTable).set(record).where(eq(gamesTable.id, record.id));
        } else {
            record.id = gameId;
            const [result] = await this.db.insert(gamesTable).values(record).returning({ id: gamesTable.id });
            game.id = result?.id;
        }
    }

    async deleteGame() {
        await this.db.delete(gamesTable).where(eq(gamesTable.id, gameId));
    }
}

export default new GameDb();
