import React from "react";
import type { GameModel } from "../../domain/game";

// Minimal state utilities for the restored GameView structure

export type GameAction = (game: GameModel) => GameModel;

// Simple updater utility that might be used by parent components
export const useUpdater = <T>(initialState: T) => {
    const [state, setState] = React.useState(initialState);

    return {
        state,
        setNewState: (newState: T) => setState(newState),
    };
}; 
