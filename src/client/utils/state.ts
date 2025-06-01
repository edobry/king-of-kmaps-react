import { useState, useEffect, useCallback, useOptimistic, useTransition } from "react";
import type { Unary } from "../../util/util";
import type { Position, GameInfo } from "../../domain/game";
import { GameModel } from "../../domain/game";
import api from "../api";

/**
 * Creates an optimistic clone of a GameModel using native structuredClone.
 * 
 * ⚠️  WARNING: This is a workaround for using class-based state with React's useOptimistic.
 * React is designed for functional programming with plain objects, not classes.
 * 
 * BETTER APPROACHES:
 * - Use plain objects + pure functions (see react-patterns.md)
 * - Use Immer for immutable updates
 * - Use modern state management like Zustand
 * 
 * These approaches eliminate the need for custom cloning entirely!
 */
export const cloneGameModelOptimistically = (currentGame: GameModel): GameModel => {
    // Use native structuredClone for deep cloning - much safer and simpler
    const cloned = structuredClone(currentGame);
    
    // Restore the prototype since structuredClone doesn't preserve it
    Object.setPrototypeOf(cloned, Object.getPrototypeOf(currentGame));
    
    return cloned;
};

/**
 * Creates a standardized optimistic action executor for game operations.
 * Includes validation, error handling, and loading state management.
 */
export const createOptimisticGameAction = <TAction, TResult>(
    executeAction: <T>(
        action: TAction,
        apiCall: () => Promise<T>,
        onSuccess: (result: T) => void,
        validation?: () => boolean,
        onError?: (error: Error) => void
    ) => void,
    setNewGame: (game: GameModel) => void,
    clearSelection?: () => void
) => {
    return (
        action: TAction,
        apiCall: () => Promise<TResult>,
        validation?: () => boolean,
        customErrorHandler?: (error: Error) => void
    ) => {
        const onSuccess = (result: TResult) => {
            if (result instanceof GameModel) {
                setNewGame(result);
            }
        };

        const onError = customErrorHandler || ((error: Error) => {
            alert(error.message ?? "Unknown error");
            if (clearSelection) clearSelection();
        });

        executeAction(action, apiCall, onSuccess, validation, onError);
    };
};

export const useUpdater = <T>(initialState: T) => {
    const [state, setState] = useState(initialState);

    const updater = (stateUpdater: Unary<T>) => {
        setState((state) => {
            const newState = structuredClone(state);

            return stateUpdater(newState);
        });
    };

    return {
        state,
        setNewState: (newState: T) => setState(newState),
        updateState: updater,
        makeHandler: (update: Unary<T>) => () => updater(update),
        makeAsyncHandler: (update: (x: T) => Promise<T>) => async () => {
            const newState = await update(state);
            setState(newState);
        }
    };
};

/**
 * Custom hook that provides fade in/out loading states for smooth UX.
 * Shows overlay immediately but fades it in, and fades out when done.
 */
export const useFadeLoading = (isPending: boolean) => {
    const [isVisible, setIsVisible] = useState(false);
    const [opacity, setOpacity] = useState(0);

    useEffect(() => {
        if (isPending) {
            // Show immediately and start fade in
            setIsVisible(true);
            // Use setTimeout to ensure the element is rendered before starting fade
            setTimeout(() => setOpacity(1), 10);
        } else {
            // Start fade out
            setOpacity(0);
            // Hide element after fade completes
            setTimeout(() => setIsVisible(false), 200);
        }
    }, [isPending]);

    return { isVisible, opacity };
};

/**
 * Custom hook for optimistic updates with validation
 */
export const useOptimisticAction = <TState, TAction>(
    state: TState,
    reducer: (currentState: TState, action: TAction) => TState
) => {
    const [isPending, startTransition] = useTransition();
    const { isVisible: showLoading, opacity: loadingOpacity } = useFadeLoading(isPending);
    
    const [optimisticState, setOptimisticState] = useOptimistic(state, reducer);

    const executeAction = useCallback(
        <TResult>(
            action: TAction,
            apiCall: () => Promise<TResult>,
            onSuccess: (result: TResult) => void,
            validation?: () => boolean,
            onError?: (error: Error) => void
        ) => {
            // Validate before optimistic update
            if (validation && !validation()) {
                return;
            }

            startTransition(async () => {
                setOptimisticState(action);

                try {
                    const result = await apiCall();
                    onSuccess(result);
                } catch (error) {
                    if (onError) {
                        onError(error as Error);
                    } else {
                        alert((error as Error).message ?? "Unknown error");
                    }
                }
            });
        },
        [setOptimisticState]
    );

    return {
        optimisticState,
        executeAction,
        isPending,
        showLoading,
        loadingOpacity
    };
};

/**
 * Custom hook for managing cell selection in the game
 */
export const useSelection = () => {
    const { state: selected, setNewState: setNewSelected, makeHandler: makeSelectedHandler } = useUpdater<Map<string, Position>>(new Map());

    const clearSelection = useCallback(() => {
        setNewSelected(new Map());
    }, [setNewSelected]);

    const toggleSelection = useCallback((
        pos: Position,
        game: GameModel,
        isSelected: (selected: Map<string, Position>, pos: Position) => boolean,
        makeCellId: (pos: Position) => string,
        getAdjacencies: (info: GameInfo, pos: Position) => Position[]
    ) => makeSelectedHandler((prev: Map<string, Position>) => {
        if (game.getCell(pos) !== game.currentTurn) {
            return prev;
        }

        if (isSelected(prev, pos)) {
            prev.delete(makeCellId(pos));
            return prev;
        }
        
        if (prev.size !== 0 && !getAdjacencies(game.info, pos).some(adj => isSelected(prev, adj)))
            return prev;

        prev.set(makeCellId(pos), pos);
        return prev;
    }), [makeSelectedHandler]);

    return {
        selected,
        clearSelection,
        toggleSelection
    };
};

export type GameAction = (game: GameModel) => GameModel;

interface PendingAction {
    action: GameAction;
    optimisticGame: GameModel;
    serverCall: () => Promise<GameModel>;
}

interface StateManagerOptions {
    onStateChange?: (game: GameModel | undefined) => void;
}

export class OptimisticStateManager {
    private currentGame: GameModel | undefined;
    private pendingActions: PendingAction[] = [];
    private onStateChange?: (game: GameModel | undefined) => void;

    constructor(options: StateManagerOptions = {}) {
        this.onStateChange = options.onStateChange;
    }

    getCurrentGame(): GameModel | undefined {
        if (this.pendingActions.length > 0) {
            return this.pendingActions[this.pendingActions.length - 1].optimisticGame;
        }
        return this.currentGame;
    }

    async executeAction(action: GameAction, serverCall: () => Promise<GameModel>): Promise<void> {
        const currentGame = this.getCurrentGame();
        if (!currentGame) {
            throw new Error("No game available");
        }

        // Apply optimistic update
        const optimisticGame = action(currentGame);
        const pendingAction: PendingAction = {
            action,
            optimisticGame,
            serverCall
        };
        
        this.pendingActions.push(pendingAction);
        this.notifyStateChange();

        try {
            // Send to server and get canonical result
            const canonicalGame = await serverCall();
            
            // Remove the pending action
            const actionIndex = this.pendingActions.indexOf(pendingAction);
            if (actionIndex >= 0) {
                this.pendingActions.splice(actionIndex, 1);
            }
            
            // Update current game
            this.currentGame = canonicalGame;
            
            // Reapply any remaining pending actions
            if (this.pendingActions.length > 0) {
                let game = canonicalGame;
                for (const pending of this.pendingActions) {
                    game = pending.action(game);
                    pending.optimisticGame = game;
                }
            }
            
            this.notifyStateChange();
        } catch (error) {
            // Remove the failed action
            const actionIndex = this.pendingActions.indexOf(pendingAction);
            if (actionIndex >= 0) {
                this.pendingActions.splice(actionIndex, 1);
            }
            this.notifyStateChange();
            throw error;
        }
    }

    setGame(game: GameModel | undefined) {
        this.currentGame = game;
        this.pendingActions = [];
        this.notifyStateChange();
    }

    private notifyStateChange() {
        if (this.onStateChange) {
            this.onStateChange(this.getCurrentGame());
        }
    }
}

// Action creators for common game actions with server integration
export const makeMove = (pos: [number, number, number]) => ({
    action: (game: GameModel) => game.makeMove(pos),
    serverCall: () => api.makeMove(pos)
});

export const groupSelected = (selected: [number, number, number][]) => ({
    action: (game: GameModel) => game.groupSelected(selected),
    serverCall: () => api.groupSelected(selected)
});

export const randomizeBoard = () => ({
    action: (game: GameModel) => game.randomizeBoard(),
    serverCall: () => api.randomizeBoard()
});
