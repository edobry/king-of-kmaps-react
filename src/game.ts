import { getAdjacencies, isValidRectangle } from "./adjacency.ts";
import type { Unary } from "./utils/state.ts";

export type Unset = undefined;
export type Player = 0 | 1;
export type CellValue = Player | Unset;
export type Board = CellValue[][][];

export const placePhase = "Place";
export const scorePhase = "Score";
export const endPhase = "End";

export type PlacePhase = typeof placePhase;
export type ScorePhase = typeof scorePhase;
export type EndPhase = typeof endPhase;
export type Phase = PlacePhase | ScorePhase | EndPhase;

export type ScoringState = {
    selected: Map<string, Position>;
    groups: {
        [key in Player]: Position[][];
    };
    cellsToPlayerGroup: Map<string, Player>;
    numCellsGrouped: {
        [key in Player]: number;
    };
};

export const makeCellId = (pos: Position) => pos.map(p => p.toString()).join(",");

export type Dimensions = [number, number, number];
export type Position = Dimensions;

export type GameInfo = {
    vars: { [key: string]: string[] };
    dimensions: Dimensions;
    size: number;
};

export type Game = {
    info: GameInfo;
    currentTurn: Player;
    board: Board;
    phase: Phase;
    moveCounter: number;
    scoring: ScoringState;
};

export type GameUpdate = Unary<Game>;

export const makeGame = (numVars: number, phase: Phase = placePhase, currentTurn: Player = 1): Game => {
    const gameInfo = computeGameInfo(numVars);

    return {
        info: gameInfo,
        phase,
        currentTurn,
        moveCounter: 0,
        board: makeBoard(gameInfo.dimensions),
        scoring: {
            selected: new Map(),
            groups: {
                0: [],
                1: [],
            },
            numCellsGrouped: {
                0: 0,
                1: 0,
            },
            cellsToPlayerGroup: new Map(),
        }
    };
};

const dims = ["x", "y", "z"] as const;

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
) => {
    return Array.from({ length: dimensions[0] }, () =>
        Array.from({ length: dimensions[1] }, () =>
            Array.from({ length: dimensions[2] }, () => getValue())
        )
    );
};

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

export const toggleTurn = (game: Game) =>
    game.currentTurn = togglePlayer(game.currentTurn);

export const isSelected = (game: Game, pos: Position) => {
    return game.scoring.selected.has(makeCellId(pos));
};

export const getWinner = (game: Game): Player | undefined => {
    const player0Groups = game.scoring.groups[0];
    const player1Groups = game.scoring.groups[1];

    if (player1Groups.length === player0Groups.length) {
        return undefined;
    }

    return player0Groups.length < player1Groups.length ? 0 : 1;
}


export const placePhaseUpdate: GameUpdate = (game: Game) => {
    game.moveCounter = game.moveCounter + 1;
    if (game.moveCounter === game.info.size) {
        game.phase = scorePhase as ScorePhase;
    }

    return game;
};

export const randomizeBoard: GameUpdate = (game: Game) => {
    game.board = makeRandomBoard(game.info.dimensions);
    game.phase = placePhase;
    game.moveCounter = 31;

    return placePhaseUpdate(game);
};

export const makeMove = (pos: Position): GameUpdate => (game: Game) => {
    if (getCell(game, pos) !== undefined) {
        return game;
    }

    setCell(game, pos, game.currentTurn);

    toggleTurn(game);

    return placePhaseUpdate(game);
};

export const getCell = (game: Game, [z, x, y]: Position): CellValue =>
    game.board[z][x][y];

export const setCell = (game: Game, [z, x, y]: Position, value: CellValue) =>
    game.board[z][x][y] = value;

export const selectCell = (game: Game, pos: Position) => {
    game.scoring.selected.set(makeCellId(pos), pos);
}

export const clearSelection = (game: Game) =>
    game.scoring.selected.clear();

export const makeSelection = (pos: Position): GameUpdate => (game: Game) => {
    if (getCell(game, pos) !== game.currentTurn) {
        return game;
    }

    if (isSelected(game, pos)) {
        game.scoring.selected.delete(makeCellId(pos));
    } else {
        if (game.scoring.selected.size !== 0) {
            const adjacencies = getAdjacencies(game.info, pos);

            if (
                !adjacencies.some((adjacency: Position) =>
                    isSelected(game, adjacency)
                )
            ) {
                return game;
            }
        }

        selectCell(game, pos);
    }

    return game;
};

export const groupSelected: GameUpdate = (game: Game) => {
    if (game.scoring.selected.size === 0) {
        return game;
    }

    if (game.scoring.selected.size > 1 && game.scoring.selected.size % 2 === 1) {
        alert("Invalid selection: odd number of cells");
        clearSelection(game);
        return game;
    }
    
    const selected = Array.from(game.scoring.selected.values());
    
    if (!isValidRectangle(game.info, selected)) {
        alert("Invalid selection: not a rectangle");
        clearSelection(game);
        return game;
    }
    
    game.scoring.groups[game.currentTurn].push(selected);
    game.scoring.numCellsGrouped[game.currentTurn] += selected.length;
    clearSelection(game);
    selected.forEach(pos =>
        game.scoring.cellsToPlayerGroup.set(
            makeCellId(pos), game.currentTurn));

    toggleTurn(game);
    if (game.scoring.numCellsGrouped[game.currentTurn] == game.info.size / 2) {
        toggleTurn(game);
        if (game.scoring.numCellsGrouped[game.currentTurn] == game.info.size / 2) {
            game.phase = endPhase;
        }
    }
    
    return game;
}
