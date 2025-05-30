import { groupSelected, makeGame } from "./state";
import { scorePhase, setCell, type Position } from "./game";
import { expect, test } from "bun:test";

test("groupSelected: empty selection", () => {
    const game = makeGame(3, { phase: scorePhase });
    expect(groupSelected(game, [])).toEqual(game);
});

test("groupSelected: unowned cell not groupable", () => {
    const game = makeGame(3, { phase: scorePhase, currentTurn: 1 });
    setCell(game, [0, 0, 1], 0);
    setCell(game, [0, 0, 0], 1);
    expect(() => groupSelected(game, [[0, 0, 1]])).toThrow();
});

test("groupSelected: owned single cell groupable", () => {
    const game = makeGame(3, { phase: scorePhase, currentTurn: 1 });
    const pos = [0, 0, 0] as Position;
    setCell(game, pos, 1);
    expect(groupSelected(game, [pos]).scoring.groups[1]).toEqual([[pos]]);
});

test("groupSelected: selection size must be a power of two", () => {
    const game = makeGame(3, { phase: scorePhase, currentTurn: 1 });
    const selection = [[0, 0, 0], [0, 0, 1], [0, 0, 2]] as Position[];
    setCell(game, selection[0], 1);
    setCell(game, selection[1], 1);
    setCell(game, selection[2], 1);
    expect(() => groupSelected(game, selection)).toThrow();

    selection.push([0, 0, 3]);
    setCell(game, selection[3], 1);
    expect(groupSelected(game, selection).scoring.groups[1]).toEqual([selection]);
});
