import { scorePhase, type Game, type CellValue, placePhase, isSelected, type Position } from "./game";

export const selectableClass = "selectable";
export const selectedClass = "selected";

export const getCellClasses = (
    game: Game,
    cell: CellValue,
    zPos: number,
    y: number,
    x: number
): string[] => {
    const classes: string[] = [];

    if (game.phase === placePhase) {
        if (cell === undefined) {
            classes.push(selectableClass);
        }
    } else if (game.phase === scorePhase) {
        if (isSelected(game, zPos, y, x)) {
            classes.push(selectedClass);
        }

        if (cell === game.currentTurn) {
            classes.push(selectableClass);
        }
    }

    return classes;
};

export const nextCell = (
    game: Pick<Game, "dimensions">,
    dim: Position,
    pos: Position
) => {
    if (dim.reduce((sum, curr) => sum + curr, 0) > 1) {
        throw new Error("Single dimension must be specified");
    }

    const nextPos: Position = [0, 0, 0];

    for (let i = 0; i < dim.length; i++) {
        const d = dim[i];
        const dimSize = game.dimensions[i];

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
