import type { GameState, GameInfo, Position } from "./game";
import { makeCellId } from "./game";

export const nextCell = (
    info: Pick<GameInfo, "dimensions">,
    dim: Position,
    pos: Position
) => {
    if (dim.reduce((sum, curr) => sum + curr, 0) > 1) {
        throw new Error("Single dimension must be specified");
    }

    const nextPos: Position = [0, 0, 0];

    for (let i = 0; i < dim.length; i++) {
        const d = dim[i];
        const dimSize = info.dimensions[i];

        let newPos = pos[i] + d;

        if (newPos == dimSize) {
            newPos = 0;
        } else if (newPos < 0) {
            newPos = dimSize - 1;
        }

        nextPos[i] = newPos;
    }

    return nextPos;
};

export const getAdjacencies = (info: Pick<GameInfo, "dimensions">, pos: Position) =>
    info.dimensions.flatMap((_, i) => {
        const nextPos = [0, 0, 0] as Position;
        nextPos[i] = 1;
        
        const prevPos = [0, 0, 0] as Position;
        prevPos[i] = -1;
        
        return [
            nextCell(info, nextPos, pos),
            nextCell(info, prevPos, pos),
        ];
    });

export const isValidRectangle = (info: Pick<GameInfo, "dimensions">, selected: Position[]) => {
    if (selected.length === 0) return false;
    if (selected.length === 1) return true;
    
    // For K-maps, rectangles can wrap around edges
    // We need to check if the selection forms a valid rectangle considering wraparound
    
    // Get all unique coordinates for each dimension
    const zCoords = [...new Set(selected.map(pos => pos[0]))].sort((a, b) => a - b);
    const yCoords = [...new Set(selected.map(pos => pos[1]))].sort((a, b) => a - b);
    const xCoords = [...new Set(selected.map(pos => pos[2]))].sort((a, b) => a - b);
    
    // Generate the expected rectangle considering possible wraparound
    const expectedCells = new Set<string>();
    
    // For each dimension, determine if we need to consider wraparound
    const zWrapped = shouldWrapAround(zCoords, info.dimensions[0]);
    const yWrapped = shouldWrapAround(yCoords, info.dimensions[1]);
    const xWrapped = shouldWrapAround(xCoords, info.dimensions[2]);
    
    // Generate all positions in the rectangle
    const zRange = expandRange(zCoords, zWrapped);
    const yRange = expandRange(yCoords, yWrapped);
    const xRange = expandRange(xCoords, xWrapped);
    

    for (const z of zRange) {
        for (const y of yRange) {
            for (const x of xRange) {
                expectedCells.add(makeCellId([z, y, x]));
            }
        }
    }
    
    // Check if expected cells match selected cells exactly
    const selectedCells = new Set(selected.map(pos => makeCellId(pos)));
    

    return expectedCells.size === selectedCells.size && 
           [...expectedCells].every(cellId => selectedCells.has(cellId));
};

// Check if coordinates should be interpreted as wrapping around
const shouldWrapAround = (coords: number[], dimensionSize: number): boolean => {
    if (coords.length <= 1) return false;
    
    const min = Math.min(...coords);
    const max = Math.max(...coords);
    
    // Check if this could be a wraparound: 
    // 1. We have coordinates at both edges (0 and max dimension)
    // 2. The gap between min and max is larger than the number of coordinates would suggest
    const hasEdgeCoords = coords.includes(0) && coords.includes(dimensionSize - 1);
    const normalSpan = max - min + 1;
    const gapSize = normalSpan - coords.length;
    

    // If we have edge coordinates and there's a gap, it might be wraparound
    return hasEdgeCoords && gapSize > 0;
};

// Expand coordinate range considering wraparound
const expandRange = (coords: number[], wrapped: boolean): number[] => {
    if (coords.length === 1) return coords;
    
    if (wrapped) {
        // For wraparound, only include the actual coordinates, not the gap in between
        // This is because in K-maps, a wraparound rectangle doesn't include the middle positions
        return coords.slice().sort((a, b) => a - b);
    } else {
        // Normal case: fill in the range between min and max
        const min = Math.min(...coords);
        const max = Math.max(...coords);
        const result = [];
        for (let i = min; i <= max; i++) {
            result.push(i);
        }
        return result;
    }
};
