import { scorePhase, type Game, type CellValue, placePhase, isSelected, type Position, makeCellId, endPhase } from "./game";

export const selectableClass = "selectable";
export const selectedClass = "selected";
export const groupedClass = "grouped";

export const getCellClasses = (
    game: Game,
    cell: CellValue,
    pos: Position
): string[] => {
    const classes: string[] = [];

    if (game.phase === placePhase) {
        if (cell === undefined) {
            classes.push(selectableClass);
        }
    } else if (game.phase === scorePhase || game.phase === endPhase) {
        const playerGroup = game.scoring.cellsToPlayerGroup.get(makeCellId(pos));
        if (playerGroup !== undefined) {
            classes.push(groupedClass);
            classes.push(`group-${playerGroup}`);
        } else {
            if (isSelected(game, pos)) {
                classes.push(selectedClass);
            }

            if (cell === game.currentTurn) {
                classes.push(selectableClass);
            }
        }
    }

    return classes;
};
