import { useEffect, useState } from 'react';

type UseCanvasKeyboardParams = {
	onDelete: () => void;
	onDuplicate: () => void;
	onUndo?: () => void;
	onRedo?: () => void;
};

type UseCanvasKeyboardResult = {
	isSpacePressed: boolean;
};

export function useCanvasKeyboard({
	onDelete,
	onDuplicate,
	onUndo,
	onRedo,
}: UseCanvasKeyboardParams): UseCanvasKeyboardResult {
	const [isSpacePressed, setIsSpacePressed] = useState(false);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			const target = event.target;

			const isTextInput =
				target instanceof HTMLInputElement ||
				target instanceof HTMLTextAreaElement ||
				(target instanceof HTMLElement && target.isContentEditable);

			if (isTextInput) {
				return;
			}

			if (event.code === 'Space') {
				event.preventDefault();
				setIsSpacePressed(true);
				return;
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
	}, [onDelete, onDuplicate, onUndo, onRedo]);

	return {
		isSpacePressed,
	};
}
