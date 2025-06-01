import React, { useCallback } from 'react';
import { GameModel } from '../domain/game';

// Hook for optimistic actions with immediate UI updates
export const useOptimisticAction = (setNewGame: (game: GameModel) => void, getCurrentGame: () => GameModel) => {
    const [isPending, setIsPending] = React.useState(false);

    const executeAction = useCallback(async (
        action: () => GameModel,
        apiCall: () => Promise<GameModel>,
        validation?: () => boolean
    ) => {
        if (validation && !validation()) {
            return;
        }

        // Store the original state for potential rollback
        const originalGame = getCurrentGame();

        try {
            setIsPending(true);
            
            // Apply optimistic update immediately
            const optimisticResult = action();
            setNewGame(optimisticResult);
            
            // Then make server call and reconcile
            const serverResult = await apiCall();
            setNewGame(serverResult);
        } catch (error) {
            // Rollback to original state
            setNewGame(originalGame);
            
            // Show the server error
            alert((error as Error).message || "Action failed");
        } finally {
            setIsPending(false);
        }
    }, [setNewGame, getCurrentGame]);

    return { executeAction, isPending };
}; 
