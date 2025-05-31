import { GameModel, type Position } from "./game";
import { type GameOptions } from "./game";

export interface GameInterface {
    initGame: (numVars: number, { players }: GameOptions) => Promise<GameModel>;
    makeMove: (pos: Position) => Promise<GameModel>;
    randomizeBoard: () => Promise<GameModel>;
    groupSelected: (selected: Position[]) => Promise<GameModel>;
    resetGame: () => Promise<void>;
}
