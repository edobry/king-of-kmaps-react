import { expect, test } from "vitest";
import { scorePhase, setCell, placePhase, type Position, makeCellId } from "./game";
import { getCellClasses, selectableClass, selectedClass } from "./grid";
import { makeGame } from "./state";

test("getCellClasses: place phase, empty cell is selectable", () => {
    const game = makeGame(3, { phase: placePhase });

    const classes = getCellClasses(game, new Map(), [0, 0, 0]);
    expect(classes).toContain(selectableClass);
});

test("getCellClasses: place phase, filled cell is not selectable", () => {
    const game = makeGame(3, { phase: placePhase });
    
    const pos = [0, 0, 0] as Position;

    setCell(game, pos, 1);

    const classes = getCellClasses(game, new Map(), pos);
    expect(classes).not.toContain(selectableClass);
});

test("getCellClasses: score phase, selected cell is selected", () => {
    const game = makeGame(3, { phase: scorePhase });

    const pos = [0, 0, 0] as Position;

    setCell(game, pos, 1);

    const classes = getCellClasses(game, new Map([[makeCellId(pos), pos]]), pos);
    expect(classes).toContain(selectedClass);
});

test("getCellClasses: score phase, unselected cell is not selected", () => {
    const game = makeGame(3, { phase: scorePhase });

    const pos = [0, 0, 0] as Position;

    setCell(game, pos, 1);

    const classes = getCellClasses(game, new Map(), pos);
    expect(classes).not.toContain(selectedClass);
});

test("getCellClasses: score phase, owned cell is selectable", () => {
    const game = makeGame(3, { phase: scorePhase, currentTurn: 1 });

    const pos = [0, 0, 0] as Position;

    setCell(game, pos, 1);

    const classes = getCellClasses(game, new Map([[makeCellId(pos), pos]]), pos);
    expect(classes).toContain(selectableClass);
});

test("getCellClasses: score phase, unowned cell is not selectable", () => {
    const game = makeGame(3, { phase: scorePhase, currentTurn: 1 });

    const pos = [0, 0, 0] as Position;

    setCell(game, pos, 0);

    const classes = getCellClasses(game, new Map(), pos);
    expect(classes).not.toContain(selectableClass);
});
