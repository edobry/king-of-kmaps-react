import { useState, useEffect } from "react";
import type { Unary } from "../../util/util";

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
