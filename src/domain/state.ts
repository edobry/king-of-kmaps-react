import { isValidRectangle } from "./adjacency";
import type { GameState, GameUpdate, Position } from "./game";
import { computeGameInfo, endPhase, getCell, makeBoard, makeCellId, makeRandomBoard, placePhase, placePhaseUpdate, setCell, togglePlayer, toggleTurn, type GameOptions } from "./game";

export interface GameInterface {
    makeMove: (pos: Position) => Promise<GameState>;
    randomizeBoard: () => Promise<GameState>;
    groupSelected: (selected: Position[]) => Promise<GameState>;
    resetGame: () => Promise<void>;
}

export class Game implements GameInterface {
    constructor(private gameState: GameState | undefined) {}

    get state(): GameState | undefined {
        return this.gameState;
    }

    initGame(numVars: number, { players = [], phase = placePhase, currentTurn = 1 }: GameOptions = {}): GameState {
        this.gameState = initGame(numVars, { players, phase, currentTurn });
        return this.gameState;
    }
    
    makeMove(pos: Position): Promise<GameState> {
        if (!this.state) {
            throw new Error("Game not initialized");
        }
        return Promise.resolve(makeMove(this.state, pos));
    }
    
    randomizeBoard(): Promise<GameState> {
        if (!this.state) {
            throw new Error("Game not initialized");
        }
        return Promise.resolve(randomizeBoard(this.state));
    }

    groupSelected(selected: Position[]): Promise<GameState> {
        if (!this.state) {
            throw new Error("Game not initialized");
        }
        return Promise.resolve(groupSelected(this.state, selected));
    }

    resetGame(): Promise<void> {
        this.gameState = undefined;
        return Promise.resolve(undefined);
    }
}

export const initGame = (
    numVars: number, { players = [], phase = placePhase, currentTurn = 1 }: GameOptions = {},
): GameState => {
    const gameInfo = computeGameInfo(numVars);

    return {
        info: gameInfo,
        phase,
        currentTurn,
        moveCounter: 0,
        board: makeBoard(gameInfo.dimensions),
        scoring: {
            groups: {
                0: [],
                1: [],
            },
            numCellsGrouped: {
                0: 0,
                1: 0,
            },
            cellsToPlayerGroup: new Map(),
        },
        players,
    };
};

export const makeMove = (game: GameState, pos: Position): GameState => {
    if (getCell(game, pos) !== undefined) {
        return game;
    }

    setCell(game, pos, game.currentTurn);

    toggleTurn(game);

    return placePhaseUpdate(game);
};

export const randomizeBoard: GameUpdate = (game: GameState) => {
    game.board = makeRandomBoard(game.info.dimensions);
    game.phase = placePhase;
    game.moveCounter = game.info.size - 1;

    return placePhaseUpdate(game);
};

export const groupSelected = (game: GameState, selected: Position[]): GameState => {
    if (selected.length === 0)
        return game;

    if (selected.some(pos => getCell(game, pos) !== game.currentTurn)) {
        throw new Error("Invalid selection: cannot group unowned cells");
    }

    if (
        selected.length > 1 &&
        !Number.isInteger(Math.log2(selected.length))
    ) {
        throw new Error("Invalid selection: not a power of two");
    }

    if (!isValidRectangle(game.info, selected)) {
        throw new Error("Invalid selection: not a rectangle");
    }

    game.scoring.groups[game.currentTurn].push(selected);
    game.scoring.numCellsGrouped[game.currentTurn] += selected.length;
    selected.forEach((pos) =>
        game.scoring.cellsToPlayerGroup.set(makeCellId(pos), game.currentTurn)
    );

    const currentPlayerHasUngroupedCells = game.scoring.numCellsGrouped[game.currentTurn] != game.info.size / 2;
    const nextPlayerHasUngroupedCells = game.scoring.numCellsGrouped[togglePlayer(game.currentTurn)] != game.info.size / 2;

    if (nextPlayerHasUngroupedCells) {
        toggleTurn(game);
    } else if (!currentPlayerHasUngroupedCells) {
        game.phase = endPhase;
    }

    return game;
};
