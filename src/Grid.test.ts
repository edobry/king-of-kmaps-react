import { expect, test } from "vitest";
import { scorePhase, makeGame, selectCell, setCell, placePhase } from "./game";
import { getCellClasses, selectableClass, selectedClass } from "./grid.ts";

test("getCellClasses: place phase, empty cell is selectable", () => {
    const game = makeGame(3);
    game.phase = placePhase;

    const classes = getCellClasses(game, undefined, [0, 0, 0]);
    expect(classes).toContain(selectableClass);
});

test("getCellClasses: place phase, filled cell is not selectable", () => {
    const game = makeGame(3);
    game.phase = placePhase;
    
    setCell(game, [0, 0, 0], 1);

    const classes = getCellClasses(game, 1, [0, 0, 0]);
    expect(classes).not.toContain(selectableClass);
});

test("getCellClasses: score phase, selected cell is selected", () => {
    const game = makeGame(3);
    game.phase = scorePhase;

    setCell(game, [0, 0, 0], 1);
    selectCell(game, [0, 0, 0]);

    const classes = getCellClasses(game, 1, [0, 0, 0]);
    expect(classes).toContain(selectedClass);
});

test("getCellClasses: score phase, unselected cell is not selected", () => {
    const game = makeGame(3);
    game.phase = scorePhase;
    
    setCell(game, [0, 0, 0], 1);

    const classes = getCellClasses(game, 1, [0, 0, 0]);
    expect(classes).not.toContain(selectedClass);
});

test("getCellClasses: score phase, owned cell is selectable", () => {
    const game = makeGame(3);

    game.currentTurn = 1;
    game.phase = scorePhase;

    setCell(game, [0, 0, 0], 1);
    selectCell(game, [0, 0, 0]);

    const classes = getCellClasses(game, 1, [0, 0, 0]);
    expect(classes).toContain(selectableClass);
});

test("getCellClasses: score phase, unowned cell is not selectable", () => {
    const game = makeGame(3);

    game.currentTurn = 1;
    game.phase = scorePhase;

    setCell(game, [0, 0, 0], 0);

    const classes = getCellClasses(game, 0, [0, 0, 0]);
    expect(classes).not.toContain(selectableClass);
});
