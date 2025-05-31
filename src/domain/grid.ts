import { scorePhase, type GameModel, placePhase, type Position, makeCellId, endPhase } from "./game";

export const selectableClass = "selectable";
export const selectedClass = "selected";
export const groupedClass = "grouped";

export const isSelected = (selected: Map<string, Position>, pos: Position) =>
    selected.has(makeCellId(pos));

export const getCellClasses = (
    game: GameModel,
    selected: Map<string, Position>,
    pos: Position
): string[] => {
    const cell = game.getCell(pos);
    
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
