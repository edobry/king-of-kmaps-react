import { makeCellId, scorePhase, type Game, type CellValue, placePhase } from "./game";

export const getCellClasses = (
    game: Game,
    cell: CellValue,
    gridId: number,
    x: number,
    y: number
): string[] => {
    const classes: string[] = [];

    if (game.phase === placePhase) {
        if (cell === undefined) {
            classes.push("selectable");
        }
    } else if (game.phase === scorePhase) {
        const isSelected = game.scoring?.selected.has(makeCellId(gridId, x, y));

        if (isSelected) {
            classes.push("selected");
        }

        if (cell === game.currentTurn) {
            classes.push("selectable");
        }
    }

    return classes;
};
