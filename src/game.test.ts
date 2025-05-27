import { expect, test } from "vitest";
import { constructBoard, getAdjacencies, type Position, isValidRectangle, type Dimensions } from "./game";

test("constructBoard: <= 6 vars", () => {
    expect(() => constructBoard(6)).not.toThrow();
    expect(() => constructBoard(7)).toThrow();
});

test("constructBoard: 5 vars", () => {
    const { vars, dimensions, size } = constructBoard(5);

    expect(vars.x).toEqual(["a", "b"]);
    expect(vars.y).toEqual(["c", "d"]);
    expect(vars.z).toEqual(["e"]);
    expect(dimensions).toEqual([2, 4, 4]);
    expect(size).toBe(32);
});

test("getAdjacencies: 3D", () => {
    const game = {
        dimensions: [3, 3, 3] as Position,
    };

    expect(new Set(getAdjacencies(game, [1, 1, 1]))).toEqual(new Set([
        [2, 1, 1],
        [0, 1, 1],
        [1, 2, 1],
        [1, 0, 1],
        [1, 1, 2],
        [1, 1, 0],
    ]));
});

test("isValidRectangle: empty selection", () => {
    const game = {
        dimensions: [2, 4, 4] as Dimensions
    };

    expect(isValidRectangle(game, [])).toBe(false);
});

test("isValidRectangle: single cell", () => {
    const game = {
        dimensions: [2, 4, 4] as Dimensions
    };

    expect(isValidRectangle(game, [[0, 0, 0]])).toBe(true);
});

test("isValidRectangle: 2x2 rectangle", () => {
    const game = {
        dimensions: [2, 4, 4] as Dimensions
    };

    const selection: Position[] = [[0, 0, 0], [0, 0, 1], [0, 1, 0], [0, 1, 1]];
    expect(isValidRectangle(game, selection)).toBe(true);
});

test("isValidRectangle: 1x4 horizontal rectangle", () => {
    const game = {
        dimensions: [2, 4, 4] as Dimensions
    };

    const selection: Position[] = [[0, 0, 0], [0, 0, 1], [0, 0, 2], [0, 0, 3]];
    expect(isValidRectangle(game, selection)).toBe(true);
});

test("isValidRectangle: 4x1 vertical rectangle", () => {
    const game = {
        dimensions: [2, 4, 4] as Dimensions
    };

    const selection: Position[] = [[0, 0, 0], [0, 1, 0], [0, 2, 0], [0, 3, 0]];
    expect(isValidRectangle(game, selection)).toBe(true);
});

test("isValidRectangle: wraparound x-axis", () => {
    const game = {
        dimensions: [2, 4, 4] as Dimensions
    };

    const selection: Position[] = [[0, 0, 0], [0, 0, 3], [0, 1, 0], [0, 1, 3]];
    expect(isValidRectangle(game, selection)).toBe(true);
});

test("isValidRectangle: wraparound y-axis", () => {
    const game = {
        dimensions: [2, 4, 4] as Dimensions
    };

    const selection: Position[] = [[0, 0, 0], [0, 0, 1], [0, 3, 0], [0, 3, 1]];
    expect(isValidRectangle(game, selection)).toBe(true);
});

test("isValidRectangle: wraparound z-axis", () => {
    const game = {
        dimensions: [4, 2, 2] as Dimensions
    };

    const selection: Position[] = [[0, 0, 0], [0, 0, 1], [3, 0, 0], [3, 0, 1]];
    expect(isValidRectangle(game, selection)).toBe(true);
});

test("isValidRectangle: double wraparound", () => {
    const game = {
        dimensions: [2, 4, 4] as Dimensions
    };

    const selection: Position[] = [[0, 0, 0], [0, 0, 3], [0, 3, 0], [0, 3, 3]];
    expect(isValidRectangle(game, selection)).toBe(true);
});

test("isValidRectangle: invalid L-shape", () => {
    const game = {
        dimensions: [2, 4, 4] as Dimensions
    };

    const selection: Position[] = [[0, 0, 0], [0, 0, 1], [0, 1, 0]];
    expect(isValidRectangle(game, selection)).toBe(false);
});

test("isValidRectangle: invalid diagonal", () => {
    const game = {
        dimensions: [2, 4, 4] as Dimensions
    };

    const selection: Position[] = [[0, 0, 0], [0, 1, 1], [0, 2, 2], [0, 3, 3]];
    expect(isValidRectangle(game, selection)).toBe(false);
});

test("isValidRectangle: invalid scattered points", () => {
    const game = {
        dimensions: [2, 4, 4] as Dimensions
    };

    const selection: Position[] = [[0, 0, 0], [0, 1, 2], [0, 2, 1], [0, 3, 3]];
    expect(isValidRectangle(game, selection)).toBe(false);
});

test("isValidRectangle: incomplete rectangle with gap", () => {
    const game = {
        dimensions: [2, 4, 4] as Dimensions
    };

    // Missing [0, 1, 1] to complete the 2x2 rectangle
    const selection: Position[] = [[0, 0, 0], [0, 0, 1], [0, 1, 0]];
    expect(isValidRectangle(game, selection)).toBe(false);
});
