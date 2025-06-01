import type { GameModel } from "../../domain/game";
import api from "../api";

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
