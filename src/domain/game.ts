import type { InsertGame, SelectGame } from "../server/schema";
import type { Unary } from "../util/util";
import { isValidRectangle } from "./adjacency";
import superjson from "superjson";
import { create } from "mutative";

// Reusable mutative configuration for GameModel immutability
const GAME_MODEL_MARK_CONFIG = {
    mark: (target: any) => {
        if (target instanceof GameModel) return 'immutable';
    }
};

export type Unset = null;
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

export const dims = ["x", "y", "z"] as const;
export type Dimensions = [number, number, number];
export type Position = Dimensions;

export type GameUpdate = Unary<GameModel>;

export const localGameType: GameType = "local";
export const onlineGameType: GameType = "online";
export type GameType = "local" | "online";

export type GameOptions = {
    players?: string[];
    phase?: Phase;
    currentTurn?: Player;
    gameType?: GameType;
};

export type GameInfo = {
    numVars: number;
    vars: Record<typeof dims[number], string[]>;
    dimensions: Dimensions;
    size: number;
};

export type ScoringState = {
    groups: {
        [key in Player]: Position[][];
    };
    cellsToPlayerGroup: Map<string, Player>;
    numCellsGrouped: {
        [key in Player]: number;
    };
};

export const isValidMove = (game: GameModel, pos: Position): boolean => {
    return game.getCell(pos) === null;
};

export const isValidGroupSelection = (game: GameModel, selected: Position[]): boolean => {
    if (selected.length === 0) return false;

    // Check if all selected cells belong to current player
    if (selected.some((pos) => game.getCell(pos) !== game.currentTurn)) {
        return false;
    }

    // Check if selection is a power of two (for multi-cell groups)
    if (selected.length > 1 && !Number.isInteger(Math.log2(selected.length))) {
        return false;
    }

    // Check if selection forms a valid rectangle
    if (!isValidRectangle(game.info, selected)) {
        return false;
    }

    return true;
};

export class GameModel {
    id?: number;
    gameType: GameType;
    players: string[];
    phase: Phase;
    moveCounter: number;
    currentTurn: Player;
    board: Board;
    scoring: ScoringState;
    info: GameInfo;

    constructor(gameRecord: InsertGame) {
        this.id = gameRecord.id ?? undefined;
        this.gameType = gameRecord.gameType as GameType;

        this.info = computeGameInfo(gameRecord.numVars);

        this.currentTurn = gameRecord.currentTurn as Player;
        this.board = gameRecord.board ?? makeBoard(this.info.dimensions);
        this.phase = gameRecord.phase as Phase;
        this.moveCounter = gameRecord.moveCounter;
        this.players = [];
        if (gameRecord.player1 && gameRecord.player1.length > 0) {
            this.players.push(gameRecord.player1);
        }
        if (gameRecord.player2 && gameRecord.player2.length > 0) {
            this.players.push(gameRecord.player2);
        }

        this.scoring = computeScoringState(
            gameRecord.scoring_groups ?? { 0: [], 1: [] }
        );
    }

    static initGame(
        numVars: number,
        { players = [], phase = placePhase, currentTurn = 1, gameType = localGameType }: GameOptions = {}
    ): GameModel {
        return new GameModel({
            numVars,
            gameType,
            player1: players[0],
            player2: players[1],
            phase,
            currentTurn,
            board: makeBoard(computeGameInfo(numVars).dimensions),
            moveCounter: 0
        });
    }

    toRecord(): InsertGame {
        return {
            id: this.id,
            gameType: this.gameType,
            currentTurn: this.currentTurn,
            board: this.board,
            phase: this.phase,
            moveCounter: this.moveCounter,
            scoring_groups: this.scoring.groups,
            player1: this.players[0],
            player2: this.players[1],
            numVars: this.info.numVars,
        };
    }

    getCell([z, x, y]: Position): CellValue {
        return this.board[z][x][y];
    }

    setCell([z, x, y]: Position, value: CellValue) {
        this.board[z][x][y] = value;
    }

    toggleTurn() {
        this.currentTurn = togglePlayer(this.currentTurn);
    }

    makeMove(pos: Position): GameModel {
        return create(this, draft => {
            if (!isValidMove(this, pos)) {
                return;
            }

            draft.board[pos[0]][pos[1]][pos[2]] = draft.currentTurn;
            draft.currentTurn = togglePlayer(draft.currentTurn);
            draft.moveCounter = draft.moveCounter + 1;
            
            if (draft.moveCounter >= this.info.size) {
                draft.phase = scorePhase as ScorePhase;
            }
        }, GAME_MODEL_MARK_CONFIG);
    }

    randomizeBoard(): GameModel {
        return create(this, draft => {
            draft.board = makeRandomBoard(this.info.dimensions);
            draft.moveCounter = this.info.size;
            draft.phase = scorePhase as ScorePhase;
        }, GAME_MODEL_MARK_CONFIG);
    }

    groupSelected(selected: Position[]): GameModel {
        return create(this, draft => {
            // Early return for empty selection
            if (selected.length === 0) return;

            // Use isValidGroupSelection for validation and provide specific error messages
            if (!isValidGroupSelection(this, selected)) {
                if (selected.some((pos) => this.getCell(pos) !== this.currentTurn)) {
                    throw new Error("Invalid selection: cannot group unowned cells");
                }

                if (selected.length > 1 && !Number.isInteger(Math.log2(selected.length))) {
                    throw new Error("Invalid selection: not a power of two");
                }

                if (!isValidRectangle(this.info, selected)) {
                    throw new Error("Invalid selection: not a rectangle");
                }
            }

            // Apply mutations to draft
            draft.scoring.groups[draft.currentTurn].push(selected);
            draft.scoring.numCellsGrouped = {
                ...draft.scoring.numCellsGrouped,
                [draft.currentTurn]: draft.scoring.numCellsGrouped[draft.currentTurn] + selected.length
            };
            
            selected.forEach((pos) =>
                draft.scoring.cellsToPlayerGroup.set(
                    makeCellId(pos),
                    draft.currentTurn
                )
            );

            const currentPlayerHasUngroupedCells =
                draft.scoring.numCellsGrouped[draft.currentTurn] != this.info.size / 2;
            const nextPlayerHasUngroupedCells =
                draft.scoring.numCellsGrouped[togglePlayer(draft.currentTurn)] != this.info.size / 2;

            if (nextPlayerHasUngroupedCells) {
                draft.currentTurn = togglePlayer(draft.currentTurn);
            } else if (!currentPlayerHasUngroupedCells) {
                draft.phase = endPhase;
            }
        }, GAME_MODEL_MARK_CONFIG);
    }

    getWinner(): Player | undefined {
        const player0Groups = this.scoring.groups[0];
        const player1Groups = this.scoring.groups[1];

        if (player1Groups.length === player0Groups.length) {
            return undefined;
        }

        return player0Groups.length < player1Groups.length ? 0 : 1;
    }
}

superjson.registerCustom<GameModel, string>(
    {
        isApplicable: (v): v is GameModel => v instanceof GameModel,
        serialize: (v) => superjson.stringify(v.toRecord()),
        deserialize: (v) => new GameModel(superjson.parse(v) as SelectGame),
    },
    "game.ts"
);

// export class GameModelInterface implements GameInterface {
//     constructor(private gameModel: GameModel | undefined) {}

//     initGame(
//         numVars: number,
//         { players = [], phase = placePhase, currentTurn = 1 }: GameOptions = {}
//     ): Promise<GameModel> {
//         return Promise.resolve(
//             GameModel.initGame(numVars, { players, phase, currentTurn })
//         );
//     }

//     makeMove(pos: Position): Promise<GameModel> {
//         if (!this.gameModel) {
//             throw new Error("Game not initialized");
//         }
//         return Promise.resolve(this.gameModel.makeMove(pos));
//     }

//     randomizeBoard(): Promise<GameModel> {
//         if (!this.gameModel) {
//             throw new Error("Game not initialized");
//         }
//         return Promise.resolve(this.gameModel.randomizeBoard());
//     }

//     groupSelected(selected: Position[]): Promise<GameModel> {
//         if (!this.gameModel) {
//             throw new Error("Game not initialized");
//         }
//         return Promise.resolve(this.gameModel.groupSelected(selected));
//     }

//     resetGame(): Promise<void> {
//         this.gameModel = undefined;
//         return Promise.resolve(undefined);
//     }
// }

export const makeCellId = (pos: Position) =>
    pos.map((p) => p.toString()).join(",");

export const positionsEqual = (pos1: Position, pos2: Position): boolean =>
    pos1[0] === pos2[0] && pos1[1] === pos2[1] && pos1[2] === pos2[2];

const computeScoringState = (groups: { [key in Player]: Position[][] }): ScoringState => {
    return Object.entries(groups ?? {}).reduce((scoring, [player, groups]) => {
        const playerId = parseInt(player) as Player;

        groups.forEach((group) => {
            group.forEach((pos) =>
                scoring.cellsToPlayerGroup.set(makeCellId(pos), playerId));

            scoring.numCellsGrouped[playerId] += group.length;
        });

        return scoring;
    }, {
        groups,
        cellsToPlayerGroup: new Map<string, Player>(),
        numCellsGrouped: {
            0: 0,
            1: 0,
        },
    });
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
    }, {} as Record<typeof dims[number], string[]>);

    const dimensions = Object.values(varMap).reverse().map(v => Math.pow(2, v.length)) as Dimensions;

    return {
        numVars: numVars,
        vars: varMap,
        dimensions,
        size: dimensions.reduce((acc, curr) => acc * curr, 1)
    };
};

export const makeBoard = (
    dimensions: Dimensions,
    getValue: () => CellValue = () => null
) => 
    Array(dimensions[0]).fill(null).map(() =>
        Array(dimensions[1]).fill(null).map(() =>
            Array(dimensions[2]).fill(null).map(() => getValue())));

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
