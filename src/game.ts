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

export const makeCellId = (gridId: number, xPos: number, yPos: number) => `${gridId},${xPos},${yPos}`;

export const makeBoard = (
    numGrids: number,
    xSize: number,
    ySize: number,
    getValue: () => CellValue = () => undefined
) => {
    return Array.from({ length: numGrids }, () =>
        Array.from({ length: ySize }, () =>
            Array.from({ length: xSize }, () => getValue())
        )
    );
};

export const makeRandomBoard = (numGrids: number, xSize: number, ySize: number) => {
    return makeBoard(numGrids, xSize, ySize, () => (Math.random() < 0.5 ? 0 : 1));
};
