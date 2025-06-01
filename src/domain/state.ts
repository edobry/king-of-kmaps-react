import { GameModel, type Position } from "./game";
import { type GameOptions } from "./game";

export interface GameInterface {
    initGame: (numVars: number, { players }: GameOptions) => Promise<GameModel>;
    makeMove: (gameId: number, pos: Position) => Promise<GameModel>;
    randomizeBoard: (gameId: number) => Promise<GameModel>;
    groupSelected: (gameId: number, selected: Position[]) => Promise<GameModel>;
    resetGame: (gameId: number) => Promise<void>;
}
