import { isValidRectangle } from "./adjacency";
import type { Game, GameUpdate, Position, ScorePhase } from "./game";
import { computeGameInfo, endPhase, getCell, makeBoard, makeCellId, makeRandomBoard, placePhase, scorePhase, setCell, togglePlayer, type GameOptions } from "./game";

export const makeGame = (
    numVars: number, { players = [], phase = placePhase, currentTurn = 1 }: GameOptions = {},
): Game => {
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

export const placePhaseUpdate: GameUpdate = (game: Game) => {
    game.moveCounter = game.moveCounter + 1;
    if (game.moveCounter >= game.info.size) {
        game.phase = scorePhase as ScorePhase;
    }

    return game;
};

export const toggleTurn = (game: Game) =>
    game.currentTurn = togglePlayer(game.currentTurn);

export const makeMove = (game: Game, pos: Position): Game => {
    if (getCell(game, pos) !== undefined) {
        return game;
    }

    setCell(game, pos, game.currentTurn);

    toggleTurn(game);

    return placePhaseUpdate(game);
};

export const randomizeBoard: GameUpdate = (game: Game) => {
    game.board = makeRandomBoard(game.info.dimensions);
    game.phase = placePhase;
    game.moveCounter = game.info.size - 1;

    return placePhaseUpdate(game);
};

export const groupSelected = (game: Game, selected: Position[]): Game => {
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
