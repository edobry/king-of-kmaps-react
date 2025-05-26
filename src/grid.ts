import { makeCellId, scorePhase, type Game, type CellValue, placePhase } from "./game";

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
        const isSelected = game.scoring?.selected.has(makeCellId(zPos, y, x));

        if (isSelected) {
            classes.push(selectedClass);
        }

        if (cell === game.currentTurn) {
            classes.push(selectableClass);
        }
    }

    return classes;
};
