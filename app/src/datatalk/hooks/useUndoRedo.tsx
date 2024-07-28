import { useCallback, useState } from "react";

export interface HistoryState<T> {
    past: T[];
    present: T;
    future: T[];
}

export interface UndoRedoActions<T> {
    set: (newPresent: T) => void;
    reset: (newPresent: T) => void;
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
}

export interface UndoRedoState<T = any> {
    history: HistoryState<T>;
    actions: UndoRedoActions<T>;
}

export function useUndoRedo<T>(initialPresent: T): UndoRedoState<T> {
    const [history, setHistory] = useState<HistoryState<T>>({
        past: [],
        present: initialPresent,
        future: [],
    });

    const canUndo = history.past.length !== 0;
    const canRedo = history.future.length !== 0;

    const undo = useCallback(() => {
        if (!canUndo) return;

        const {
            past,
            present,
            future
        } = history;
        const previous = past[past.length - 1];
        const newPast = past.slice(0, past.length - 1);

        setHistory({
            past: newPast,
            present: previous,
            future: [present, ...future],
        });
    }, [canUndo, history]);

    const redo = useCallback(() => {
        if (!canRedo) return;

        const {
            past,
            present,
            future
        } = history;
        const next = future[0];
        const newFuture = future.slice(1);

        setHistory({
            past: [...past, present],
            present: next,
            future: newFuture,
        });
    }, [canRedo, history]);

    const set = useCallback(
        (newPresent: T) => {
            const {
                past,
                present
            } = history;
            if (newPresent === present) return;

            setHistory({
                past: [...past, present],
                present: newPresent,
                future: [],
            });
        },
        [history]
    );

    const reset = useCallback(
        (newPresent: T) => {
            setHistory({
                past: [],
                present: newPresent,
                future: [],
            });
        },
        [setHistory]
    );

    const actions = {
        set,
        reset,
        undo,
        redo,
        canUndo,
        canRedo
    };
    return {
        history,
        actions
    };
};
