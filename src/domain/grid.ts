import { scorePhase, type Game, placePhase, type Position, makeCellId, endPhase, getCell } from "./game";

export const selectableClass = "selectable";
export const selectedClass = "selected";
export const groupedClass = "grouped";

export const isSelected = (selected: Map<string, Position>, pos: Position) =>
    selected.has(makeCellId(pos));

export const getCellClasses = (
    game: Game,
    selected: Map<string, Position>,
    pos: Position
): string[] => {
    const cell = getCell(game, pos);
    
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
            if (isSelected(selected, pos)) {
                classes.push(selectedClass);
            }

            if (cell === game.currentTurn) {
                classes.push(selectableClass);
            }
        }
    }

    return classes;
};
