import { groupSelected, initGame } from "./state";
import { placePhase, scorePhase, setCell, type Position } from "./game";
import { expect, test } from "bun:test";

test("groupSelected: empty selection", () => {
    const game = initGame(3, { phase: scorePhase });
    expect(groupSelected(game, [])).toEqual(game);
});

test("groupSelected: unowned cell not groupable", () => {
    const game = initGame(3, { phase: scorePhase, currentTurn: 1 });
    setCell(game, [0, 0, 1], 0);
    setCell(game, [0, 0, 0], 1);
    expect(() => groupSelected(game, [[0, 0, 1]])).toThrow();
});

test("groupSelected: owned single cell groupable", () => {
    const game = initGame(3, { phase: scorePhase, currentTurn: 1 });
    const pos = [0, 0, 0] as Position;
    setCell(game, pos, 1);
    expect(groupSelected(game, [pos]).scoring.groups[1]).toEqual([[pos]]);
});

test("groupSelected: selection size must be a power of two", () => {
    const game = initGame(3, { phase: scorePhase, currentTurn: 1 });
    const selection = [[0, 0, 0], [0, 0, 1], [0, 0, 2]] as Position[];
    setCell(game, selection[0], 1);
    setCell(game, selection[1], 1);
    setCell(game, selection[2], 1);
    expect(() => groupSelected(game, selection)).toThrow();

    selection.push([0, 0, 3]);
    setCell(game, selection[3], 1);
    expect(groupSelected(game, selection).scoring.groups[1]).toEqual([selection]);
});

test("groupSelected: turn toggled if next player has ungrouped cells", () => {
    const game = initGame(3, { phase: scorePhase, currentTurn: 1 });
    const selection = [[0, 0, 0], [0, 0, 1], [0, 0, 2], [0, 0, 3]] as Position[];
    setCell(game, selection[0], 1);
    setCell(game, selection[1], 1);
    setCell(game, selection[2], 1);
    setCell(game, selection[3], 1);
    expect(groupSelected(game, selection).currentTurn).toEqual(0);
});

test("groupSelected: turn not toggled if next player has no ungrouped cells", () => {
    const game = initGame(3, { phase: placePhase, currentTurn: 1 });

    const player1Cells = [
        [0, 0, 0],
        [0, 0, 1],
        [0, 0, 2],
        [0, 0, 3],
    ] as Position[];

    const player0Cells = [
        [0, 1, 0],
        [0, 1, 1],
        [0, 1, 2],
        [0, 1, 3],
    ] as Position[];

    player1Cells.forEach(cell => setCell(game, cell, 1));
    player0Cells.forEach(cell => setCell(game, cell, 0));

    game.phase = scorePhase;

    groupSelected(game, player1Cells);

    expect(groupSelected(game, [
        player0Cells[0],
        player0Cells[1]
    ]).currentTurn).toEqual(0);
});
