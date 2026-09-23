import {
	type FocusEvent,
	type KeyboardEvent,
	type RefObject,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';

import type { CanvasGroup, CanvasNode } from '@/types/canvas-node.types';

export type CanvasFocusTarget = {
	type: 'node' | 'group';
	id: string;
};

type UseCanvasFocusParams = {
	canvasRef: RefObject<HTMLDivElement | null>;
	nodes: CanvasNode[];
	groups: CanvasGroup[];
	moveDistance: number;
	shiftMoveDistance: number;
	onResizeNode: (
		nodeId: string,
		deltaWidth: number,
		deltaHeight: number,
	) => boolean;
	onSelectNode: (nodeId: string) => void;
	onSelectGroup: (groupId: string) => void;
	onStartEditing: (nodeId: string) => void;
};

const ARROW_DIRECTIONS: Partial<Record<string, readonly [number, number]>> = {
	ArrowUp: [0, -1],
	ArrowRight: [1, 0],
	ArrowDown: [0, 1],
	ArrowLeft: [-1, 0],
};

function getTargetKey(target: CanvasFocusTarget): string {
	return `${target.type}:${target.id}`;
}

export function useCanvasFocus({
	canvasRef,
	nodes,
	groups,
	moveDistance,
	shiftMoveDistance,
	onResizeNode,
	onSelectNode,
	onSelectGroup,
	onStartEditing,
}: UseCanvasFocusParams) {
	const elementByTargetKeyRef = useRef(new Map<string, HTMLElement>());
	const keyboardFocusTargetKeyRef = useRef<string | null>(null);
	const [focusedTarget, setFocusedTarget] = useState<CanvasFocusTarget | null>(
		null,
	);

	const targets = useMemo(() => {
		const groupedNodeIds = new Set(groups.flatMap((group) => group.nodeIds));

		return [
			...groups.map<CanvasFocusTarget>((group) => ({
				type: 'group',
				id: group.id,
			})),
			...nodes
				.filter((node) => !groupedNodeIds.has(node.id))
				.map<CanvasFocusTarget>((node) => ({
					type: 'node',
					id: node.id,
				})),
		];
	}, [groups, nodes]);

	const targetByKey = useMemo(
		() => new Map(targets.map((target) => [getTargetKey(target), target])),
		[targets],
	);

	const selectTarget = useCallback(
		(target: CanvasFocusTarget) => {
			if (target.type === 'node') {
				onSelectNode(target.id);
				return;
			}

			onSelectGroup(target.id);
		},
		[onSelectGroup, onSelectNode],
	);

	const focusTarget = useCallback((target: CanvasFocusTarget) => {
		const targetKey = getTargetKey(target);
		const element = elementByTargetKeyRef.current.get(targetKey);

		if (!element) {
			return false;
		}

		keyboardFocusTargetKeyRef.current = targetKey;
		element.focus({ preventScroll: true });
		return true;
	}, []);

	const focusAvailableTarget = useCallback(
		(startIndex: number, step: number) => {
			for (
				let index = startIndex;
				index >= 0 && index < targets.length;
				index += step
			) {
				if (focusTarget(targets[index])) {
					return;
				}
			}
		},
		[focusTarget, targets],
	);

	const focusRelativeTarget = useCallback(
		(target: CanvasFocusTarget, offset: number) => {
			const currentIndex = targets.findIndex(
				(candidate) => getTargetKey(candidate) === getTargetKey(target),
			);

			if (currentIndex === -1 || targets.length === 0) {
				return;
			}

			for (let distance = 1; distance < targets.length; distance += 1) {
				const nextIndex =
					(currentIndex + offset * distance + targets.length) % targets.length;

				if (focusTarget(targets[nextIndex])) {
					return;
				}
			}
		},
		[focusTarget, targets],
	);

	useEffect(() => {
		if (!focusedTarget || targetByKey.has(getTargetKey(focusedTarget))) {
			return;
		}

		setFocusedTarget(null);
		canvasRef.current?.focus({ preventScroll: true });
	}, [canvasRef, focusedTarget, targetByKey]);

	const registerTargetElement = useCallback(
		(target: CanvasFocusTarget, element: HTMLElement | null) => {
			const targetKey = getTargetKey(target);

			if (element) {
				elementByTargetKeyRef.current.set(targetKey, element);
			} else {
				elementByTargetKeyRef.current.delete(targetKey);
			}
		},
		[],
	);

	const handleCanvasKeyDown = useCallback(
		(event: KeyboardEvent<HTMLDivElement>) => {
			if (
				event.target !== event.currentTarget ||
				event.altKey ||
				event.metaKey ||
				event.ctrlKey
			) {
				return;
			}

			if (
				event.key === 'Home' ||
				event.key === 'ArrowRight' ||
				event.key === 'ArrowDown'
			) {
				event.preventDefault();
				focusAvailableTarget(0, 1);
				return;
			}

			if (
				event.key === 'End' ||
				event.key === 'ArrowLeft' ||
				event.key === 'ArrowUp'
			) {
				event.preventDefault();
				focusAvailableTarget(targets.length - 1, -1);
			}
		},
		[focusAvailableTarget, targets.length],
	);

	const handleTargetFocus = useCallback(
		(event: FocusEvent<HTMLElement>, target: CanvasFocusTarget) => {
			const targetKey = getTargetKey(target);
			const isKeyboardFocus =
				keyboardFocusTargetKeyRef.current === targetKey ||
				event.currentTarget.matches(':focus-visible');

			keyboardFocusTargetKeyRef.current = null;
			setFocusedTarget(target);

			if (isKeyboardFocus) {
				selectTarget(target);
			}
		},
		[selectTarget],
	);

	const handleTargetBlur = useCallback((event: FocusEvent<HTMLElement>) => {
		if (
			event.relatedTarget instanceof Element &&
			event.relatedTarget.closest('[data-canvas-focus-target]')
		) {
			return;
		}

		setFocusedTarget(null);
	}, []);

	const handleTargetKeyDown = useCallback(
		(event: KeyboardEvent<HTMLElement>, target: CanvasFocusTarget) => {
			const direction = ARROW_DIRECTIONS[event.key];

			if ((event.metaKey || event.ctrlKey) && !event.altKey && direction) {
				event.preventDefault();
				event.stopPropagation();
				focusRelativeTarget(target, direction[0] + direction[1] > 0 ? 1 : -1);
				return;
			}

			if (event.altKey && !event.metaKey && !event.ctrlKey && direction) {
				event.preventDefault();
				event.stopPropagation();

				if (target.type === 'node') {
					const distance = event.shiftKey ? shiftMoveDistance : moveDistance;
					onResizeNode(
						target.id,
						direction[0] * distance,
						direction[1] * distance,
					);
				}
				return;
			}

			if (event.key === 'Home' || event.key === 'End') {
				event.preventDefault();
				event.stopPropagation();
				focusAvailableTarget(
					event.key === 'Home' ? 0 : targets.length - 1,
					event.key === 'Home' ? 1 : -1,
				);
				return;
			}

			if (event.key === ' ') {
				event.preventDefault();
				event.stopPropagation();
				selectTarget(target);
				return;
			}

			if (event.key === 'Enter') {
				event.preventDefault();
				event.stopPropagation();
				selectTarget(target);

				if (target.type === 'node') {
					onStartEditing(target.id);
				}
			}
		},
		[
			focusAvailableTarget,
			focusRelativeTarget,
			moveDistance,
			onResizeNode,
			onStartEditing,
			selectTarget,
			shiftMoveDistance,
			targets.length,
		],
	);

	return {
		focusedTarget,
		focusTarget,
		handleCanvasKeyDown,
		handleTargetBlur,
		handleTargetFocus,
		handleTargetKeyDown,
		registerTargetElement,
	};
}
