import { expect, test } from "vitest";
import type { Position } from "../domain/game";
import { nextCell } from "../domain/adjacency";

test("nextCell: throws if multiple dimensions are specified", () => {
    const game = {
        dimensions: [1, 2, 3] as Position,
    };

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
