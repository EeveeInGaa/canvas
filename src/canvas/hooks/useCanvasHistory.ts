import { type SetStateAction, useCallback, useReducer } from 'react';

const MAX_HISTORY_ENTRIES = 100;

type CanvasHistoryState<T> = {
	past: T[];
	present: T;
	future: T[];
};

type CanvasHistoryAction<T> =
	| {
			type: 'commit';
			value: SetStateAction<T>;
	  }
	| {
			type: 'replace';
			value: SetStateAction<T>;
	  }
	| {
			type: 'record';
			previousValue: T;
	  }
	| {
			type: 'undo';
	  }
	| {
			type: 'redo';
	  };

function resolveStateAction<T>(value: SetStateAction<T>, currentValue: T): T {
	return typeof value === 'function'
		? (value as (currentValue: T) => T)(currentValue)
		: value;
}

function appendHistoryEntry<T>(entries: T[], entry: T): T[] {
	return [...entries.slice(1 - MAX_HISTORY_ENTRIES), entry];
}

function canvasHistoryReducer<T>(
	state: CanvasHistoryState<T>,
	action: CanvasHistoryAction<T>,
): CanvasHistoryState<T> {
	switch (action.type) {
		case 'commit': {
			const nextPresent = resolveStateAction(action.value, state.present);

			if (Object.is(nextPresent, state.present)) {
				return state;
			}

			return {
				past: appendHistoryEntry(state.past, state.present),
				present: nextPresent,
				future: [],
			};
		}

		case 'replace':
			return {
				...state,
				present: resolveStateAction(action.value, state.present),
			};

		case 'record':
			if (Object.is(action.previousValue, state.present)) {
				return state;
			}

			return {
				past: appendHistoryEntry(state.past, action.previousValue),
				present: state.present,
				future: [],
			};

		case 'undo': {
			if (state.past.length === 0) {
				return state;
			}

			const previousPresent = state.past[state.past.length - 1];

			return {
				past: state.past.slice(0, -1),
				present: previousPresent,
				future: [state.present, ...state.future],
			};
		}

		case 'redo': {
			if (state.future.length === 0) {
				return state;
			}

			const nextPresent = state.future[0];

			return {
				past: appendHistoryEntry(state.past, state.present),
				present: nextPresent,
				future: state.future.slice(1),
			};
		}
	}
}

export function useCanvasHistory<T>(initialValue: T) {
	const [state, dispatch] = useReducer(canvasHistoryReducer<T>, {
		past: [],
		present: initialValue,
		future: [],
	});

	const commit = useCallback((value: SetStateAction<T>) => {
		dispatch({
			type: 'commit',
			value,
		});
	}, []);

	const replace = useCallback((value: SetStateAction<T>) => {
		dispatch({
			type: 'replace',
			value,
		});
	}, []);

	const record = useCallback((previousValue: T) => {
		dispatch({
			type: 'record',
			previousValue,
		});
	}, []);

	const undo = useCallback(() => {
		dispatch({
			type: 'undo',
		});
	}, []);

	const redo = useCallback(() => {
		dispatch({
			type: 'redo',
		});
	}, []);

	return {
		value: state.present,
		commit,
		replace,
		record,
		undo,
		redo,
		canUndo: state.past.length > 0,
		canRedo: state.future.length > 0,
	};
}
