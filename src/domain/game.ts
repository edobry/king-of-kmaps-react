import type { Unary } from "../util/util";
import { useImmer } from "use-immer";

export type Unset = undefined;
export type Player = 0 | 1;
export type CellValue = Player | Unset;
export type Board = CellValue[][][];

export const placePhase = "Place";
export const scorePhase = "Score";
export const endPhase = "End";

export const phases = [placePhase, scorePhase, endPhase];

export type PlacePhase = typeof placePhase;
export type ScorePhase = typeof scorePhase;
export type EndPhase = typeof endPhase;
export type Phase = PlacePhase | ScorePhase | EndPhase;

export type ScoringState = {
    groups: {
        [key in Player]: Position[][];
    };
    cellsToPlayerGroup: Map<string, Player>;
    numCellsGrouped: {
        [key in Player]: number;
    };
};

export const makeCellId = (pos: Position) => pos.map(p => p.toString()).join(",");

export const dims = ["x", "y", "z"] as const;
export type Dimensions = [number, number, number];
export type Position = Dimensions;

export type GameInfo = {
    vars: { [key: string]: string[] };
    dimensions: Dimensions;
    size: number;
};

export type GameState = {
    info: GameInfo;
    currentTurn: Player;
    board: Board;
    phase: Phase;
    moveCounter: number;
    scoring: ScoringState;
    players: string[];
};

export type GameUpdate = Unary<GameState>;

export type GameOptions = {
    players?: string[];
    phase?: Phase;
    currentTurn?: Player;
};

export const computeGameInfo = (numVars: number): GameInfo => {
    if(numVars > 6) {
        throw new Error("At most 6 variables are supported");
    }

    const aCode = "a".charCodeAt(0);

    const vars: string[][] = [[]];
    let currentVarIndex = 0;
    for (let i = 0; i < numVars; i++) {
        vars[currentVarIndex].push(String.fromCharCode(aCode + i));

        if(vars[currentVarIndex].length === 2) {
            vars.push([]);
            currentVarIndex++;
        }
    }

    const varMap = dims.reduce((acc, curr, i) => {
        acc[curr] = vars[i] || [];
        return acc;
    }, {} as { [key: string]: string[] });

    const dimensions = Object.values(varMap).reverse().map(v => Math.pow(2, v.length)) as Dimensions;

    return {
        vars: varMap,
        dimensions,
        size: dimensions.reduce((acc, curr) => acc * curr, 1)
    };
};

export const makeBoard = (
    dimensions: Dimensions,
    getValue: () => CellValue = () => undefined
) => 
    Array(dimensions[0]).fill(undefined).map(() =>
        Array(dimensions[1]).fill(undefined).map(() =>
            Array(dimensions[2]).fill(undefined).map(() => getValue())));

export const makeRandomBoard = (dimensions: Dimensions) => {
    const size = dimensions[0] * dimensions[1] * dimensions[2];
    const remaining = {
        0: size / 2,
        1: size / 2,
    };

    return makeBoard(dimensions, () => {
        let player: Player = Math.random() < 0.5 ? 0 : 1;
        if (remaining[player] > 0) {
            remaining[player]--;
            return player;
        } else {
            player = togglePlayer(player);
            remaining[player]--;
            return player;
        }
    });
};

export const togglePlayer = (player: Player) => player === 0 ? 1 : 0;

export const getWinner = (game: GameState): Player | undefined => {
    const player0Groups = game.scoring.groups[0];
    const player1Groups = game.scoring.groups[1];

    if (player1Groups.length === player0Groups.length) {
        return undefined;
    }

    return player0Groups.length < player1Groups.length ? 0 : 1;
}

export const getCell = (game: GameState, [z, x, y]: Position): CellValue =>
    game.board[z][x][y];

export const setCell = (game: GameState, [z, x, y]: Position, value: CellValue) =>
    game.board[z][x][y] = value;

export const placePhaseUpdate: GameUpdate = (game: GameState) => {
    game.moveCounter = game.moveCounter + 1;
    if (game.moveCounter >= game.info.size) {
        game.phase = scorePhase as ScorePhase;
    }

    return game;
};

export const toggleTurn = (game: GameState) =>
    (game.currentTurn = togglePlayer(game.currentTurn));
