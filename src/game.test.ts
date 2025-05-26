import { expect, test } from "vitest";
import { constructBoard, getAdjacencies, type Position } from "./game";

test("constructBoard: <= 6 vars", () => {
    expect(() => constructBoard(6)).not.toThrow();
    expect(() => constructBoard(7)).toThrow();
});

test("constructBoard: 5 vars", () => {
    const { zVars, yVars, xVars, zSize, ySize, xSize, size } = constructBoard(5);

    expect(xVars).toEqual(["a", "b"]);
    expect(yVars).toEqual(["c", "d"]);
    expect(zVars).toEqual(["e"]);
    expect(xSize).toBe(4);
    expect(ySize).toBe(4);
    expect(zSize).toBe(2);
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
