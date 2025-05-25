import { expect, test } from "vitest";
import { placePhase, type Game, type CellValue, type Board, type Player, scorePhase, makeBoard } from "./game";
import { getCellClasses } from "./grid";

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

    const classes = getCellClasses(game, undefined as CellValue, 0, 0, 0);
    expect(classes).toContain("selectable");
});

test("getCellClasses: place phase, filled cell is not selectable", () => {
    const game: Game = {
        phase: placePhase,
        currentTurn: 1 as Player,
        board: testBoard,
        moveCounter: 0,
    };

    const classes = getCellClasses(game, 1 as CellValue, 0, 0, 0);
    expect(classes).not.toContain("selectable");
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

    const classes = getCellClasses(game, 1 as CellValue, 0, 0, 0);
    expect(classes).toContain("selected");
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

    const classes = getCellClasses(game, 1 as CellValue, 0, 0, 0);
    expect(classes).toContain("selectable");
});
