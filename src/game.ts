import { nextCell } from "./grid.ts";
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

export type Game = {
    dimensions: Dimensions;
    size: number;
    currentTurn: Player;
    board: Board;
    phase: Phase;
    moveCounter: number;
    scoring: ScoringState;
};

export type GameUpdate = Unary<Game>;

export const makeInitialGame = (dimensions: Dimensions, size: number) => ({
    dimensions,
    size,
    phase: placePhase as Phase,
    currentTurn: 1 as Player,
    moveCounter: 0,
    board: makeBoard(dimensions),
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
});

export const constructBoard = (numVars: number): {
    vars: { [key: string]: string[] };
    dimensions: Dimensions;
    size: number;
} => {
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

    const varMap = {
        z: vars[2],
        y: vars[1],
        x: vars[0],
    };

    const dimensions = Object.values(varMap).map(v => Math.pow(2, v.length)) as Dimensions;

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

export const getAdjacencies = (game: Pick<Game, "dimensions">, pos: Position) =>
    game.dimensions.flatMap((_, i) => {
        const nextPos = [0, 0, 0] as Position;
        nextPos[i] = 1;
        
        const prevPos = [0, 0, 0] as Position;
        prevPos[i] = -1;
        
        return [
            nextCell(game, nextPos, pos),
            nextCell(game, prevPos, pos),
        ];
    });

export const isValidRectangle = (game: Pick<Game, "dimensions">, selected: Position[]) => {
    if (selected.length === 0) return false;
    if (selected.length === 1) return true;
    
    // For K-maps, rectangles can wrap around edges
    // We need to check if the selection forms a valid rectangle considering wraparound
    
    // Get all unique coordinates for each dimension
    const zCoords = [...new Set(selected.map(pos => pos[0]))].sort((a, b) => a - b);
    const yCoords = [...new Set(selected.map(pos => pos[1]))].sort((a, b) => a - b);
    const xCoords = [...new Set(selected.map(pos => pos[2]))].sort((a, b) => a - b);
    
    // Generate the expected rectangle considering possible wraparound
    const expectedCells = new Set<string>();
    
    // For each dimension, determine if we need to consider wraparound
    const zWrapped = shouldWrapAround(zCoords, game.dimensions[0]);
    const yWrapped = shouldWrapAround(yCoords, game.dimensions[1]);
    const xWrapped = shouldWrapAround(xCoords, game.dimensions[2]);
    
    // Generate all positions in the rectangle
    const zRange = expandRange(zCoords, zWrapped);
    const yRange = expandRange(yCoords, yWrapped);
    const xRange = expandRange(xCoords, xWrapped);
    

    for (const z of zRange) {
        for (const y of yRange) {
            for (const x of xRange) {
                expectedCells.add(makeCellId([z, y, x]));
            }
        }
    }
    
    // Check if expected cells match selected cells exactly
    const selectedCells = new Set(selected.map(pos => makeCellId(pos)));
    

    return expectedCells.size === selectedCells.size && 
           [...expectedCells].every(cellId => selectedCells.has(cellId));
};

// Check if coordinates should be interpreted as wrapping around
const shouldWrapAround = (coords: number[], dimensionSize: number): boolean => {
    if (coords.length <= 1) return false;
    
    const min = Math.min(...coords);
    const max = Math.max(...coords);
    
    // Check if this could be a wraparound: 
    // 1. We have coordinates at both edges (0 and max dimension)
    // 2. The gap between min and max is larger than the number of coordinates would suggest
    const hasEdgeCoords = coords.includes(0) && coords.includes(dimensionSize - 1);
    const normalSpan = max - min + 1;
    const gapSize = normalSpan - coords.length;
    

    // If we have edge coordinates and there's a gap, it might be wraparound
    return hasEdgeCoords && gapSize > 0;
};

// Expand coordinate range considering wraparound
const expandRange = (coords: number[], wrapped: boolean): number[] => {
    if (coords.length === 1) return coords;
    
    if (wrapped) {
        // For wraparound, only include the actual coordinates, not the gap in between
        // This is because in K-maps, a wraparound rectangle doesn't include the middle positions
        return coords.slice().sort((a, b) => a - b);
    } else {
        // Normal case: fill in the range between min and max
        const min = Math.min(...coords);
        const max = Math.max(...coords);
        const result = [];
        for (let i = min; i <= max; i++) {
            result.push(i);
        }
        return result;
    }
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
    if (game.moveCounter === game.size) {
        game.phase = scorePhase as ScorePhase;
    }

    return game;
};

export const randomizeBoard: GameUpdate = (game: Game) => {
    game.board = makeRandomBoard(game.dimensions);
    game.phase = placePhase;
    game.moveCounter = 31;

    return placePhaseUpdate(game);
};

export const makeMove = (pos: Position): GameUpdate => (game: Game) => {
    if (game.board[pos[0]][pos[1]][pos[2]] !== undefined) {
        return game;
    }

    game.board[pos[0]][pos[1]][pos[2]] = game.currentTurn;

    toggleTurn(game);

    return placePhaseUpdate(game);
};

export const makeSelection = (pos: Position): GameUpdate => (game: Game) => {
    if (game.board[pos[0]][pos[1]][pos[2]] !== game.currentTurn) {
        return game;
    }

    if (isSelected(game, pos)) {
        game.scoring.selected.delete(makeCellId(pos));
    } else {
        if (game.scoring.selected.size !== 0) {
            const adjacencies = getAdjacencies(game, pos);

            if (
                !adjacencies.some((adjacency) =>
                    isSelected(game, adjacency)
                )
            ) {
                return game;
            }
        }

        game.scoring.selected.set(makeCellId(pos), pos);
    }

    return game;
};

export const groupSelected: GameUpdate = (game: Game) => {
    if (game.scoring.selected.size === 0) {
        return game;
    }

    if (game.scoring.selected.size > 1 && game.scoring.selected.size % 2 === 1) {
        alert("Invalid selection: odd number of cells");
        game.scoring.selected.clear();
        return game;
    }
    
    const selected = Array.from(game.scoring.selected.values());
    
    if (!isValidRectangle(game, selected)) {
        alert("Invalid selection: not a rectangle");
        game.scoring.selected.clear();
        return game;
    }
    
    game.scoring.groups[game.currentTurn].push(selected);
    game.scoring.numCellsGrouped[game.currentTurn] += selected.length;
    game.scoring.selected.clear();
    selected.forEach(pos =>
        game.scoring.cellsToPlayerGroup.set(
            makeCellId(pos), game.currentTurn));

    toggleTurn(game);
    if (game.scoring.numCellsGrouped[game.currentTurn] == game.size / 2) {
        toggleTurn(game);
        if (game.scoring.numCellsGrouped[game.currentTurn] == game.size / 2) {
            game.phase = endPhase;
        }
    }
    
    return game;
}
