import { useEffect, useState } from 'react';

const ARROW_DIRECTIONS: Partial<Record<string, readonly [number, number]>> = {
	ArrowUp: [0, -1],
	ArrowRight: [1, 0],
	ArrowDown: [0, 1],
	ArrowLeft: [-1, 0],
};

type UseCanvasKeyboardParams = {
	moveDistance: number;
	shiftMoveDistance: number;
	onCenterViewport: () => void;
	onCreateLinkNode: () => void;
	onCreateTextNode: () => void;
	onDelete: () => void;
	onDuplicate: () => void;
	onToggleDebug: () => void;
	onToggleInfo: () => void;
	onToggleSnap: () => void;
	onMoveSelection?: (deltaX: number, deltaY: number) => boolean;
	onGroup?: () => void;
	onUngroup?: () => void;
	onUndo?: () => void;
	onRedo?: () => void;
};

type UseCanvasKeyboardResult = {
	isSpacePressed: boolean;
};

export function useCanvasKeyboard({
	moveDistance,
	shiftMoveDistance,
	onCenterViewport,
	onCreateLinkNode,
	onCreateTextNode,
	onDelete,
	onDuplicate,
	onToggleDebug,
	onToggleInfo,
	onToggleSnap,
	onMoveSelection,
	onGroup,
	onUngroup,
	onUndo,
	onRedo,
}: UseCanvasKeyboardParams): UseCanvasKeyboardResult {
	const [isSpacePressed, setIsSpacePressed] = useState(false);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			const target = event.target;
			const key = event.key.toLowerCase();
			const isInShortcutsUi =
				target instanceof Element &&
				target.closest(
					'[data-canvas-shortcuts-dialog], [data-canvas-shortcuts-trigger]',
				) !== null;
			const hasCommandModifier = event.metaKey || event.ctrlKey || event.altKey;

			if (
				isInShortcutsUi &&
				!hasCommandModifier &&
				!event.repeat &&
				key === 'i'
			) {
				event.preventDefault();
				onToggleInfo();
				return;
			}

			const isInteractiveElement =
				target instanceof HTMLElement &&
				(target.isContentEditable ||
					target.closest(
						'button, input, textarea, select, a[href], [data-canvas-shortcuts-dialog]',
					));

			if (isInteractiveElement) {
				return;
			}

			if (event.code === 'Space') {
				event.preventDefault();
				setIsSpacePressed(true);
				return;
			}

			if (!hasCommandModifier) {
				const distance = event.shiftKey ? shiftMoveDistance : moveDistance;
				const direction = ARROW_DIRECTIONS[event.key];

				if (
					direction &&
					onMoveSelection?.(direction[0] * distance, direction[1] * distance)
				) {
					event.preventDefault();
					return;
				}

				if (event.repeat) {
					return;
				}

				switch (key) {
					case 't':
						event.preventDefault();
						onCreateTextNode();
						return;

					case 'l':
						event.preventDefault();
						onCreateLinkNode();
						return;

					case 's':
						event.preventDefault();
						onToggleSnap();
						return;

					case 'c':
						event.preventDefault();
						onCenterViewport();
						return;

					case 'd':
						event.preventDefault();
						onToggleDebug();
						return;

					case 'i':
						event.preventDefault();
						onToggleInfo();
						return;
				}
			}

			if (event.key === 'Backspace' || event.key === 'Delete') {
				event.preventDefault();
				onDelete();
				return;
			}

			const hasModifier = event.metaKey || event.ctrlKey;

			if (!hasModifier) {
				return;
			}

			switch (event.key.toLowerCase()) {
				case 'd':
					event.preventDefault();
					onDuplicate();
					break;

				case 'g':
					event.preventDefault();

					if (event.shiftKey) {
						onUngroup?.();
					} else {
						onGroup?.();
					}

					break;

				case 'z':
					event.preventDefault();

					if (event.shiftKey) {
						onRedo?.();
					} else {
						onUndo?.();
					}

					break;
			}
		};

		const handleKeyUp = (event: KeyboardEvent) => {
			if (event.code === 'Space') {
				setIsSpacePressed(false);
			}
		};

		window.addEventListener('keydown', handleKeyDown);

		window.addEventListener('keyup', handleKeyUp);

		return () => {
			window.removeEventListener('keydown', handleKeyDown);

			window.removeEventListener('keyup', handleKeyUp);
		};
	}, [
		moveDistance,
		onCenterViewport,
		onCreateLinkNode,
		onCreateTextNode,
		onDelete,
		onDuplicate,
		onGroup,
		onMoveSelection,
		onRedo,
		onToggleDebug,
		onToggleInfo,
		onToggleSnap,
		onUndo,
		onUngroup,
		shiftMoveDistance,
	]);

	return {
		isSpacePressed,
	};
}
