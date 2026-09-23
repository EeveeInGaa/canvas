import {
	type Dispatch,
	type PointerEvent as ReactPointerEvent,
	type RefObject,
	type SetStateAction,
	useCallback,
	useMemo,
	useRef,
	useState,
} from 'react';

import { useCanvasDragPreview } from '@/hooks/interactions/useCanvasDragPreview';
import { useCanvasElementRegistry } from '@/hooks/interactions/useCanvasElementRegistry';
import { useCanvasInteractionEnd } from '@/hooks/interactions/useCanvasInteractionEnd';
import { useCanvasInteractionMove } from '@/hooks/interactions/useCanvasInteractionMove';
import { useCanvasInteractionStart } from '@/hooks/interactions/useCanvasInteractionStart';
import { useCanvasResizePreview } from '@/hooks/interactions/useCanvasResizePreview';
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
import type { GroupRectById, NodeById } from '@/utils/group';

type UseCanvasInteractionsParams = {
	canvasRef: RefObject<HTMLDivElement | null>;
	canvasBounds: Rect | null;
	groups: CanvasGroup[];
	nodes: CanvasNode[];
	nodeById: NodeById;
	groupRectById: GroupRectById;
	selectedNodeIds: string[];
	lockedNodeIdSet: Set<string>;
	viewport: Viewport;
	isSpacePressed: boolean;
	isSnapEnabled: boolean;
	gridSize: number;
	commitDocument: Dispatch<SetStateAction<CanvasDocument>>;
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
	canvasBounds,
	groups,
	nodes,
	nodeById,
	groupRectById,
	selectedNodeIds,
	lockedNodeIdSet,
	selectedGroupIds,
	viewport,
	isSpacePressed,
	isSnapEnabled,
	gridSize,
	commitDocument,
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
	const pointerCaptureTargetRef = useRef<HTMLDivElement | null>(null);
	const elementRegistry = useCanvasElementRegistry();
	const dragPreview = useCanvasDragPreview({
		groups,
		nodeById,
		groupRectById,
		nodeElementsRef: elementRegistry.nodeElementsRef,
		groupElementsRef: elementRegistry.groupElementsRef,
	});
	const resizePreview = useCanvasResizePreview({
		groups,
		nodeById,
		groupRectById,
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
		lockedNodeIdSet,
		selectedGroupIds,
		viewport,
		isSpacePressed,
		pointerCaptureTargetRef,
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
		nodeById,
		groupRectById,
		viewport,
		isSnapEnabled,
		gridSize,
		canvasBounds,
		getCanvasPosition,
		dragPreview,
		resizePreview,
		setInteraction,
		setSelectedNodeIds,
		setSelectedGroupIds,
		setViewport,
		setCursorCanvasPosition,
		setDropTargetGroupId,
	});

	const { handlePointerUp, handlePointerCancel } = useCanvasInteractionEnd({
		interaction,
		dragPreview,
		resizePreview,
		pointerCaptureTargetRef,
		commitDocument,
		setViewport,
		setSelectedNodeIds,
		setSelectedGroupIds,
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
		handleCanvasPointerUp: handlePointerUp,
		handleCanvasPointerCancel: handlePointerCancel,
		handleNodePointerDown: interactionStart.handleNodePointerDown,
		handleGroupPointerDown: interactionStart.handleGroupPointerDown,
		handleResizePointerDown: interactionStart.handleResizePointerDown,
	};
}
