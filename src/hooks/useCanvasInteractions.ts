import {
	type Dispatch,
	type PointerEvent as ReactPointerEvent,
	type RefObject,
	type SetStateAction,
	useCallback,
	useMemo,
	useState,
} from 'react';

import { useCanvasDragPreview } from '@/hooks/interactions/useCanvasDragPreview';
import { useCanvasElementRegistry } from '@/hooks/interactions/useCanvasElementRegistry';
import { useCanvasInteractionEnd } from '@/hooks/interactions/useCanvasInteractionEnd';
import { useCanvasInteractionMove } from '@/hooks/interactions/useCanvasInteractionMove';
import { useCanvasInteractionStart } from '@/hooks/interactions/useCanvasInteractionStart';
import type {
	CanvasDocument,
	CanvasGroup,
	CanvasNode,
} from '@/types/canvas-node.types';
import type { Point, Rect } from '@/types/geometry.types';
import type { InteractionState } from '@/types/interaction.types';
import type { Viewport } from '@/types/viewport.types';
import { screenToCanvas } from '@/utils/coordinates';
import { createRectFromPoints } from '@/utils/geometry';

type UseCanvasInteractionsParams = {
	canvasRef: RefObject<HTMLDivElement | null>;
	groups: CanvasGroup[];
	nodes: CanvasNode[];
	selectedNodeIds: string[];
	viewport: Viewport;
	isSpacePressed: boolean;
	isSnapEnabled: boolean;
	gridSize: number;
	setNodes: Dispatch<SetStateAction<CanvasNode[]>>;
	commitDocument: Dispatch<SetStateAction<CanvasDocument>>;
	recordDocumentChange: (previousDocument: CanvasDocument) => void;
	setSelectedNodeIds: Dispatch<SetStateAction<string[]>>;
	selectedGroupIds: string[];
	setSelectedGroupIds: Dispatch<SetStateAction<string[]>>;
	setViewport: Dispatch<SetStateAction<Viewport>>;
	setEditingNodeId: Dispatch<SetStateAction<string | null>>;
	setCursorCanvasPosition: Dispatch<SetStateAction<Point | null>>;
};

type UseCanvasInteractionsResult = {
	interaction: InteractionState;
	selectionRect: Rect | null;
	dropTargetGroupId: string | null;
	registerNodeElement: (nodeId: string, element: HTMLDivElement | null) => void;
	registerGroupElement: (
		groupId: string,
		element: HTMLDivElement | null,
	) => void;
	handleCanvasPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
	handleCanvasPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void;
	handleCanvasPointerUp: (event: ReactPointerEvent<HTMLDivElement>) => void;
	handleCanvasPointerCancel: (event: ReactPointerEvent<HTMLDivElement>) => void;
	handleNodePointerDown: (
		event: ReactPointerEvent<HTMLDivElement>,
		node: CanvasNode,
	) => void;
	handleGroupPointerDown: (
		event: ReactPointerEvent<HTMLDivElement>,
		group: CanvasGroup,
	) => void;
	handleResizePointerDown: (
		event: ReactPointerEvent<HTMLDivElement>,
		node: CanvasNode,
	) => void;
};

export function useCanvasInteractions({
	canvasRef,
	groups,
	nodes,
	selectedNodeIds,
	selectedGroupIds,
	viewport,
	isSpacePressed,
	isSnapEnabled,
	gridSize,
	setNodes,
	commitDocument,
	recordDocumentChange,
	setSelectedNodeIds,
	setSelectedGroupIds,
	setViewport,
	setEditingNodeId,
	setCursorCanvasPosition,
}: UseCanvasInteractionsParams): UseCanvasInteractionsResult {
	const [interaction, setInteraction] = useState<InteractionState>({
		type: 'idle',
	});
	const [dropTargetGroupId, setDropTargetGroupId] = useState<string | null>(
		null,
	);
	const elementRegistry = useCanvasElementRegistry();
	const dragPreview = useCanvasDragPreview({
		groups,
		nodes,
		nodeElementsRef: elementRegistry.nodeElementsRef,
		groupElementsRef: elementRegistry.groupElementsRef,
	});

	const getCanvasPosition = useCallback(
		(clientX: number, clientY: number): Point | null => {
			const canvasElement = canvasRef.current;

			if (!canvasElement) {
				return null;
			}

			return screenToCanvas({
				screenX: clientX,
				screenY: clientY,
				canvasRect: canvasElement.getBoundingClientRect(),
				viewport,
			});
		},
		[canvasRef, viewport],
	);

	const selectionRect = useMemo<Rect | null>(() => {
		if (interaction.type !== 'selecting') {
			return null;
		}

		return createRectFromPoints(
			{ x: interaction.startX, y: interaction.startY },
			{ x: interaction.currentX, y: interaction.currentY },
		);
	}, [interaction]);

	const interactionStart = useCanvasInteractionStart({
		groups,
		nodes,
		selectedNodeIds,
		selectedGroupIds,
		viewport,
		isSpacePressed,
		getCanvasPosition,
		setInteraction,
		setSelectedNodeIds,
		setSelectedGroupIds,
		setEditingNodeId,
	});

	const handleCanvasPointerMove = useCanvasInteractionMove({
		interaction,
		groups,
		nodes,
		viewport,
		isSnapEnabled,
		gridSize,
		getCanvasPosition,
		dragPreview,
		setInteraction,
		setNodes,
		setSelectedNodeIds,
		setSelectedGroupIds,
		setViewport,
		setCursorCanvasPosition,
		setDropTargetGroupId,
	});

	const handleCanvasPointerEnd = useCanvasInteractionEnd({
		interaction,
		dragPreview,
		commitDocument,
		recordDocumentChange,
		setInteraction,
		setDropTargetGroupId,
	});

	return {
		interaction,
		selectionRect,
		dropTargetGroupId,
		registerNodeElement: elementRegistry.registerNodeElement,
		registerGroupElement: elementRegistry.registerGroupElement,
		handleCanvasPointerDown: interactionStart.handleCanvasPointerDown,
		handleCanvasPointerMove,
		handleCanvasPointerUp: handleCanvasPointerEnd,
		handleCanvasPointerCancel: handleCanvasPointerEnd,
		handleNodePointerDown: interactionStart.handleNodePointerDown,
		handleGroupPointerDown: interactionStart.handleGroupPointerDown,
		handleResizePointerDown: interactionStart.handleResizePointerDown,
	};
}
