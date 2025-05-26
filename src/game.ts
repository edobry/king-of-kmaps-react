export type Unset = undefined;
export type Player = 0 | 1;
export type CellValue = Player | Unset;
export type Board = CellValue[][][];

export const placePhase = "Place";
export const scorePhase = "Score";

export type PlacePhase = typeof placePhase;
export type ScorePhase = typeof scorePhase;
export type Phase = PlacePhase | ScorePhase;

export type ScoringState = {
    selected: Set<string>;
};

export type Game = {
    currentTurn: Player;
    board: Board;
    phase: Phase;
    moveCounter: number;
    scoring?: ScoringState;
};

export const makeCellId = (zPos: number, yPos: number, xPos: number) => `${zPos},${yPos},${xPos}`;

export const constructBoard = (numVars: number) => {
    if(numVars > 6) {
        throw new Error("At most 6 variables are supported");
    }

    const aCode = "a".charCodeAt(0);

    const vars: string[][] = [[]];
    let currentVarIndex = 0;
    for (let i = 0; i < numVars; i++) {
        vars[currentVarIndex].push(String.fromCharCode(aCode + i));

        if(vars[currentVarIndex].length === 2) {
            vars.push([]);
            currentVarIndex++;
        }
        
    }
    const xVars = vars[0];
    const yVars = vars[1];
    const zVars = vars[2];

    const xSize = Math.pow(2, xVars.length);
    const ySize = Math.pow(2, yVars.length);
    const zSize = Math.pow(2, zVars.length);

    const size = xSize * ySize * zSize;

    return {
        zVars,
        yVars,
        xVars,
        xSize,
        ySize,
        zSize,
        size,
    };
};

export const makeBoard = (
    zSize: number,
    ySize: number,
    xSize: number,
    getValue: () => CellValue = () => undefined
) => {
    return Array.from({ length: zSize }, () =>
        Array.from({ length: ySize }, () =>
            Array.from({ length: xSize }, () => getValue())
        )
    );
};

export const makeRandomBoard = (zSize: number, ySize: number, xSize: number) => {
    return makeBoard(zSize, ySize, xSize, () => (Math.random() < 0.5 ? 0 : 1));
};
