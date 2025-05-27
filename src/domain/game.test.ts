import { expect, test } from "vitest";
import { computeGameInfo } from "./game";
import type { Dimensions, Position } from "./game";
import { getAdjacencies, isValidRectangle } from "./adjacency";

test("computeGameInfo: <= 6 vars", () => {
    expect(() => computeGameInfo(6)).not.toThrow();
    expect(() => computeGameInfo(7)).toThrow();
});

test("computeGameInfo: 1 var", () => {
    const { vars, dimensions, size } = computeGameInfo(1);

    expect(vars.x).toEqual(["a"]);
    expect(vars.y).toEqual([]);
    expect(vars.z).toEqual([]);
    expect(dimensions).toEqual([1, 1, 2]);
    expect(size).toBe(2);
});


test("computeGameInfo: 3 vars", () => {
    const { vars, dimensions, size } = computeGameInfo(3);

    expect(vars.x).toEqual(["a", "b"]);
    expect(vars.y).toEqual(["c"]);
    expect(vars.z).toEqual([]);
    expect(dimensions).toEqual([1, 2, 4]);
    expect(size).toBe(8);
});

test("computeGameInfo: 5 vars", () => {
    const { vars, dimensions, size } = computeGameInfo(5);

    expect(vars.x).toEqual(["a", "b"]);
    expect(vars.y).toEqual(["c", "d"]);
    expect(vars.z).toEqual(["e"]);
    expect(dimensions).toEqual([2, 4, 4]);
    expect(size).toBe(32);
});

test("getAdjacencies: 3D", () => {
    const info = {
        dimensions: [3, 3, 3] as Position,
    };
    expect(new Set(getAdjacencies(info, [1, 1, 1]))).toEqual(new Set([
        [2, 1, 1],
        [0, 1, 1],
        [1, 2, 1],
        [1, 0, 1],
        [1, 1, 2],
        [1, 1, 0],
    ]));
});

test("isValidRectangle: empty selection", () => {
    const info = {
        dimensions: [2, 4, 4] as Dimensions
    };
    expect(isValidRectangle(info, [])).toBe(false);
});

test("isValidRectangle: single cell", () => {
    const info = {
        dimensions: [2, 4, 4] as Dimensions
    };
    expect(isValidRectangle(info, [[0, 0, 0]])).toBe(true);
});

test("isValidRectangle: 2x2 rectangle", () => {
    const info = {
        dimensions: [2, 4, 4] as Dimensions
    };

    const selection: Position[] = [[0, 0, 0], [0, 0, 1], [0, 1, 0], [0, 1, 1]];
    expect(isValidRectangle(info, selection)).toBe(true);
});

test("isValidRectangle: 1x4 horizontal rectangle", () => {
    const info = {
        dimensions: [2, 4, 4] as Dimensions
    };

    const selection: Position[] = [[0, 0, 0], [0, 0, 1], [0, 0, 2], [0, 0, 3]];
    expect(isValidRectangle(info, selection)).toBe(true);
});

test("isValidRectangle: 4x1 vertical rectangle", () => {
    const info = {
        dimensions: [2, 4, 4] as Dimensions
    };

    const selection: Position[] = [[0, 0, 0], [0, 1, 0], [0, 2, 0], [0, 3, 0]];
    expect(isValidRectangle(info, selection)).toBe(true);
});

test("isValidRectangle: wraparound x-axis", () => {
    const info = {
        dimensions: [2, 4, 4] as Dimensions
    };

    const selection: Position[] = [[0, 0, 0], [0, 0, 3], [0, 1, 0], [0, 1, 3]];
    expect(isValidRectangle(info, selection)).toBe(true);
});

test("isValidRectangle: wraparound y-axis", () => {
    const info = {
        dimensions: [2, 4, 4] as Dimensions
    };

    const selection: Position[] = [[0, 0, 0], [0, 0, 1], [0, 3, 0], [0, 3, 1]];
    expect(isValidRectangle(info, selection)).toBe(true);
});

test("isValidRectangle: wraparound z-axis", () => {
    const info = {
        dimensions: [4, 2, 2] as Dimensions
    };

    const selection: Position[] = [[0, 0, 0], [0, 0, 1], [3, 0, 0], [3, 0, 1]];
    expect(isValidRectangle(info, selection)).toBe(true);
});

test("isValidRectangle: double wraparound", () => {
    const info = {
        dimensions: [2, 4, 4] as Dimensions
    };

    const selection: Position[] = [[0, 0, 0], [0, 0, 3], [0, 3, 0], [0, 3, 3]];
    expect(isValidRectangle(info, selection)).toBe(true);
});

test("isValidRectangle: invalid L-shape", () => {
    const info = {
        dimensions: [2, 4, 4] as Dimensions
    };

    const selection: Position[] = [[0, 0, 0], [0, 0, 1], [0, 1, 0]];
    expect(isValidRectangle(info, selection)).toBe(false);
});

test("isValidRectangle: invalid diagonal", () => {
    const info = {
        dimensions: [2, 4, 4] as Dimensions
    };

    const selection: Position[] = [[0, 0, 0], [0, 1, 1], [0, 2, 2], [0, 3, 3]];
    expect(isValidRectangle(info, selection)).toBe(false);
});

test("isValidRectangle: invalid scattered points", () => {
    const info = {
        dimensions: [2, 4, 4] as Dimensions
    };

    const selection: Position[] = [[0, 0, 0], [0, 1, 2], [0, 2, 1], [0, 3, 3]];
    expect(isValidRectangle(info, selection)).toBe(false);
});

test("isValidRectangle: incomplete rectangle with gap", () => {
    const info = {
        dimensions: [2, 4, 4] as Dimensions
    };

    // Missing [0, 1, 1] to complete the 2x2 rectangle
    const selection: Position[] = [[0, 0, 0], [0, 0, 1], [0, 1, 0]];
    expect(isValidRectangle(info, selection)).toBe(false);
});
