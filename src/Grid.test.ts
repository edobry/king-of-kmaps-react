import { expect, test } from "vitest";
import { placePhase, type Game, type Board, type Player, scorePhase, makeBoard, type Position } from "./game";
import { getCellClasses, nextCell, selectableClass, selectedClass } from "./grid.ts";

const testBoard = [
    [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
    ],
] as Board;

const emptyBoard = makeBoard(1, 3, 3);

test("getCellClasses: place phase, empty cell is selectable", () => {
    const game: Game = {
        dimensions: [1, 3, 3],
        phase: placePhase,
        currentTurn: 1 as Player,
        board: emptyBoard,
        moveCounter: 0,
        scoring: {
            selected: new Set(),
        },
    };

    const classes = getCellClasses(game, undefined, 0, 0, 0);
    expect(classes).toContain(selectableClass);
});

test("getCellClasses: place phase, filled cell is not selectable", () => {
    const game: Game = {
        dimensions: [1, 3, 3],
        phase: placePhase,
        currentTurn: 1 as Player,
        board: testBoard,
        moveCounter: 0,
        scoring: {
            selected: new Set(),
        },
    };

    const classes = getCellClasses(game, 1, 0, 0, 0);
    expect(classes).not.toContain(selectableClass);
});

test("getCellClasses: score phase, selected cell is selected", () => {
    const game: Game = {
        dimensions: [1, 3, 3],
        phase: scorePhase,
        currentTurn: 1 as Player,
        board: testBoard,
        moveCounter: 0,
        scoring: {
            selected: new Set(["0,0,0"]),
        },
    };

    const classes = getCellClasses(game, 1, 0, 0, 0);
    expect(classes).toContain(selectedClass);
});

test("getCellClasses: score phase, unselected cell is not selected", () => {
    const game: Game = {
        dimensions: [1, 3, 3],
        phase: scorePhase,
        currentTurn: 1 as Player,
        board: testBoard,
        moveCounter: 0,
        scoring: {
            selected: new Set(),
        },
    };

    const classes = getCellClasses(game, 1, 0, 0, 0);
    expect(classes).not.toContain(selectedClass);
});

test("getCellClasses: score phase, owned cell is selectable", () => {
    const game: Game = {
        dimensions: [1, 3, 3],
        phase: scorePhase,
        currentTurn: 1 as Player,
        board: testBoard,
        moveCounter: 0,
        scoring: {
            selected: new Set(["0,0,0"]),
        },
    };

    const classes = getCellClasses(game, 1, 0, 0, 0);
    expect(classes).toContain(selectableClass);
});

test("getCellClasses: score phase, unowned cell is not selectable", () => {
    const game: Game = {
        dimensions: [1, 3, 3],
        phase: scorePhase,
        currentTurn: 0 as Player,
        board: emptyBoard,
        moveCounter: 0,
        scoring: {
            selected: new Set(),
        },
    };

    const classes = getCellClasses(game, 1, 0, 0, 0);
    expect(classes).not.toContain(selectableClass);
});

test("nextCell: throws if multiple dimensions are specified", () => {
    const game = {
        dimensions: [1, 2, 3],
    } as Pick<Game, "dimensions">;

    expect(() => nextCell(game, [1, 1, 0], [0, 0, 0])).toThrow();
});

test("nextCell: increments the specified dimension", () => {
    const game = {
        dimensions: [3, 3, 3] as Position,
    };

    expect(nextCell(game, [1, 0, 0], [0, 0, 0])).toEqual([1, 0, 0]);
});

test("nextCell: decrements the specified dimension", () => {
    const game = {
        dimensions: [3, 3, 3] as Position,
    };

    expect(nextCell(game, [-1, 0, 0], [2, 0, 0])).toEqual([1, 0, 0]);
});

test("nextCell: wraps forward the specified dimension", () => {
    const game = {
        dimensions: [3, 3, 3] as Position,
    };

    expect(nextCell(game, [1, 0, 0], [2, 0, 0])).toEqual([0, 0, 0]);
});

test("nextCell: wraps backward the specified dimension", () => {
    const game = {
        dimensions: [3, 3, 3] as Position,
    };

    expect(nextCell(game, [-1, 0, 0], [0, 0, 0])).toEqual([2, 0, 0]);
});
