export const loadState = <T>(name: string): T | undefined => {
    if (typeof window === 'undefined') {
        return undefined;
    }

    try {
        const serializedState = localStorage.getItem(name);
        if (serializedState === null) {
            return undefined;
        }
        return JSON.parse(serializedState);
    } catch {
        return undefined;
    }
};

export const saveState = <T>(name: string, state: T): void => {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        const serializedState = JSON.stringify(state);
        localStorage.setItem(name, serializedState);
    } catch {
    }
};

export const resetState = <T>(name: string, state?: T): void => {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        if (state === undefined) {
            localStorage.removeItem(name);
            return;
        }

        const serializedState = JSON.stringify(state);
        localStorage.setItem(name, serializedState);
    } catch {
    }
};
