import { expect, test } from "vitest";
import { placePhase, type Game, type Board, type Player, scorePhase, makeBoard } from "./game";
import { getCellClasses, selectableClass, selectedClass } from "./grid";

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
        phase: placePhase,
        currentTurn: 1 as Player,
        board: emptyBoard,
        moveCounter: 0,
    };

    const classes = getCellClasses(game, undefined, 0, 0, 0);
    expect(classes).toContain(selectableClass);
});

test("getCellClasses: place phase, filled cell is not selectable", () => {
    const game: Game = {
        phase: placePhase,
        currentTurn: 1 as Player,
        board: testBoard,
        moveCounter: 0,
    };

    const classes = getCellClasses(game, 1, 0, 0, 0);
    expect(classes).not.toContain(selectableClass);
});

test("getCellClasses: score phase, selected cell is selected", () => {
    const game: Game = {
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
        phase: scorePhase,
        currentTurn: 1 as Player,
        board: testBoard,
        moveCounter: 0
    };

    const classes = getCellClasses(game, 1, 0, 0, 0);
    expect(classes).not.toContain(selectedClass);
});

test("getCellClasses: score phase, owned cell is selectable", () => {
    const game: Game = {
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
        phase: scorePhase,
        currentTurn: 0,
        board: emptyBoard,
        moveCounter: 0
    };

    const classes = getCellClasses(game, 1, 0, 0, 0);
    expect(classes).not.toContain(selectableClass);
});
