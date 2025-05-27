import { useState } from "react";

export type Unary<T> = (x: T) => T;

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
        updater,
        onClick: (update: Unary<T>) => () => updater(update),
        reset: () => setState(initialState),
    };
};
