import { useState } from "react";
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
        updater,
        makeHandler: (update: Unary<T>) => () => updater(update),
        makeAsyncHandler: (update: (x: T) => Promise<T>) => async () => {
            const newState = await update(state);
            setState(newState);
        }
    };
};
