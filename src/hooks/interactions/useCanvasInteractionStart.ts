import {
	type Dispatch,
	type PointerEvent as ReactPointerEvent,
	type RefObject,
	type SetStateAction,
	useCallback,
	useMemo,
} from 'react';

import type {
	CanvasDocument,
	CanvasGroup,
	CanvasNode,
} from '@/types/canvas-node.types';
import type { Point } from '@/types/geometry.types';
import type {
	InteractionState,
	SelectionMode,
} from '@/types/interaction.types';
import type { Viewport } from '@/types/viewport.types';
import { getNodePositions } from '@/utils/drag';
import {
	getEffectiveSelectedNodeIds,
	mergeCanvasSelection,
} from '@/utils/selection';

type UseCanvasInteractionStartParams = {
	canvasDocument: CanvasDocument;
	groups: CanvasGroup[];
	nodes: CanvasNode[];
	selectedNodeIds: string[];
	lockedNodeIdSet: Set<string>;
	selectedGroupIds: string[];
	viewport: Viewport;
	isSpacePressed: boolean;
	pointerCaptureTargetRef: RefObject<HTMLDivElement | null>;
	getCanvasPosition: (clientX: number, clientY: number) => Point | null;
	setInteraction: Dispatch<SetStateAction<InteractionState>>;
	setSelectedNodeIds: Dispatch<SetStateAction<string[]>>;
	setSelectedGroupIds: Dispatch<SetStateAction<string[]>>;
	setEditingNodeId: Dispatch<SetStateAction<string | null>>;
};

export function useCanvasInteractionStart({
	canvasDocument,
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
}: UseCanvasInteractionStartParams) {
	const selectedGroupIdSet = useMemo(
		() => new Set(selectedGroupIds),
		[selectedGroupIds],
	);
	const existingNodeIdSet = useMemo(
		() => new Set(nodes.map((node) => node.id)),
		[nodes],
	);
	const getSelectionMode = useCallback(
		(event: ReactPointerEvent<HTMLDivElement>): SelectionMode =>
			event.shiftKey
				? 'add'
				: event.metaKey || event.ctrlKey
					? 'toggle'
					: 'replace',
		[],
	);

	const handleCanvasPointerDown = useCallback(
		(event: ReactPointerEvent<HTMLDivElement>) => {
			if (event.button !== 0) {
				return;
			}

			event.currentTarget.setPointerCapture(event.pointerId);
			pointerCaptureTargetRef.current = event.currentTarget;
			setEditingNodeId(null);

			if (isSpacePressed) {
				setInteraction({
					type: 'panning',
					startPointerX: event.clientX,
					startPointerY: event.clientY,
					startViewportX: viewport.x,
					startViewportY: viewport.y,
				});
				return;
			}

			const canvasPosition = getCanvasPosition(event.clientX, event.clientY);

			if (!canvasPosition) {
				return;
			}

			const selectionMode = getSelectionMode(event);

			if (selectionMode === 'replace') {
				setSelectedNodeIds([]);
				setSelectedGroupIds([]);
			}

			setInteraction({
				type: 'selecting',
				startX: canvasPosition.x,
				startY: canvasPosition.y,
				currentX: canvasPosition.x,
				currentY: canvasPosition.y,
				selectionMode,
				startSelectedNodeIds: selectedNodeIds,
				startSelectedGroupIds: selectedGroupIds,
			});
		},
		[
			getCanvasPosition,
			getSelectionMode,
			isSpacePressed,
			pointerCaptureTargetRef,
			selectedGroupIds,
			selectedNodeIds,
			setEditingNodeId,
			setInteraction,
			setSelectedGroupIds,
			setSelectedNodeIds,
			viewport.x,
			viewport.y,
		],
	);

	const handleNodePointerDown = useCallback(
		(event: ReactPointerEvent<HTMLDivElement>, node: CanvasNode) => {
			if (event.button !== 0 || isSpacePressed) {
				return;
			}

			event.stopPropagation();
			event.currentTarget.setPointerCapture(event.pointerId);
			pointerCaptureTargetRef.current = event.currentTarget;
			setEditingNodeId(null);

			let nextSelectedNodeIds = selectedNodeIds;
			let nextSelectedGroupIds = selectedGroupIds;
			const currentEffectiveNodeIdSet = new Set(
				getEffectiveSelectedNodeIds(groups, selectedNodeIds, selectedGroupIds),
			);

			const selectionMode = getSelectionMode(event);

			if (selectionMode !== 'replace') {
				const nextSelection = mergeCanvasSelection(
					groups,
					{ nodeIds: selectedNodeIds, groupIds: selectedGroupIds },
					{ nodeIds: [node.id], groupIds: [] },
					selectionMode,
				);

				nextSelectedNodeIds = nextSelection.nodeIds;
				nextSelectedGroupIds = nextSelection.groupIds;
			} else if (!currentEffectiveNodeIdSet.has(node.id)) {
				nextSelectedNodeIds = [node.id];
				nextSelectedGroupIds = [];
			}

			setSelectedNodeIds(nextSelectedNodeIds);
			setSelectedGroupIds(nextSelectedGroupIds);

			const nextEffectiveNodeIds = getEffectiveSelectedNodeIds(
				groups,
				nextSelectedNodeIds,
				nextSelectedGroupIds,
			);
			const movableNodeIds = nextEffectiveNodeIds.filter(
				(nodeId) => !lockedNodeIdSet.has(nodeId),
			);

			if (
				!nextEffectiveNodeIds.includes(node.id) ||
				lockedNodeIdSet.has(node.id)
			) {
				setInteraction({ type: 'idle' });
				return;
			}

			setInteraction({
				type: 'dragging',
				dragSource: 'node',
				nodeIds: movableNodeIds,
				startPointerX: event.clientX,
				startPointerY: event.clientY,
				startNodePositions: getNodePositions(nodes, movableNodeIds),
			});
		},
		[
			getSelectionMode,
			groups,
			isSpacePressed,
			lockedNodeIdSet,
			nodes,
			pointerCaptureTargetRef,
			selectedGroupIds,
			selectedNodeIds,
			setEditingNodeId,
			setInteraction,
			setSelectedGroupIds,
			setSelectedNodeIds,
		],
	);

	const handleGroupPointerDown = useCallback(
		(event: ReactPointerEvent<HTMLDivElement>, group: CanvasGroup) => {
			if (event.button !== 0 || isSpacePressed) {
				return;
			}

			event.preventDefault();
			event.stopPropagation();
			event.currentTarget.setPointerCapture(event.pointerId);
			pointerCaptureTargetRef.current = event.currentTarget;

			const groupNodeIds = group.nodeIds.filter((nodeId) =>
				existingNodeIdSet.has(nodeId),
			);

			if (groupNodeIds.length === 0) {
				return;
			}

			let nextSelectedGroupIds = selectedGroupIds;
			let nextSelectedNodeIds = selectedNodeIds;

			const selectionMode = getSelectionMode(event);

			if (selectionMode !== 'replace') {
				const nextSelection = mergeCanvasSelection(
					groups,
					{ nodeIds: selectedNodeIds, groupIds: selectedGroupIds },
					{ nodeIds: [], groupIds: [group.id] },
					selectionMode,
				);

				nextSelectedNodeIds = nextSelection.nodeIds;
				nextSelectedGroupIds = nextSelection.groupIds;
			} else if (!selectedGroupIdSet.has(group.id)) {
				nextSelectedGroupIds = [group.id];
				nextSelectedNodeIds = [];
			}

			setSelectedGroupIds(nextSelectedGroupIds);
			setSelectedNodeIds(nextSelectedNodeIds);
			setEditingNodeId(null);

			const nextEffectiveNodeIds = getEffectiveSelectedNodeIds(
				groups,
				nextSelectedNodeIds,
				nextSelectedGroupIds,
			);
			const movableNodeIds = nextEffectiveNodeIds.filter(
				(nodeId) => !lockedNodeIdSet.has(nodeId),
			);

			if (
				!nextSelectedGroupIds.includes(group.id) ||
				group.isLocked ||
				movableNodeIds.length === 0
			) {
				setInteraction({ type: 'idle' });
				return;
			}

			setInteraction({
				type: 'dragging',
				dragSource: 'group',
				nodeIds: movableNodeIds,
				startPointerX: event.clientX,
				startPointerY: event.clientY,
				startNodePositions: getNodePositions(nodes, movableNodeIds),
			});
		},
		[
			existingNodeIdSet,
			getSelectionMode,
			groups,
			isSpacePressed,
			lockedNodeIdSet,
			nodes,
			pointerCaptureTargetRef,
			selectedGroupIds,
			selectedGroupIdSet,
			selectedNodeIds,
			setEditingNodeId,
			setInteraction,
			setSelectedGroupIds,
			setSelectedNodeIds,
		],
	);

	const handleResizePointerDown = useCallback(
		(event: ReactPointerEvent<HTMLDivElement>, node: CanvasNode) => {
			if (event.button !== 0 || lockedNodeIdSet.has(node.id)) {
				return;
			}

			event.preventDefault();
			event.stopPropagation();
			event.currentTarget.setPointerCapture(event.pointerId);
			pointerCaptureTargetRef.current = event.currentTarget;
			setSelectedNodeIds([node.id]);
			setSelectedGroupIds([]);
			setEditingNodeId(null);

			setInteraction({
				type: 'resizing',
				nodeId: node.id,
				handle: 'bottom-right',
				startPointerX: event.clientX,
				startPointerY: event.clientY,
				startWidth: node.width,
				startHeight: node.height,
				startDocument: canvasDocument,
			});
		},
		[
			canvasDocument,
			lockedNodeIdSet,
			pointerCaptureTargetRef,
			setEditingNodeId,
			setInteraction,
			setSelectedGroupIds,
			setSelectedNodeIds,
		],
	);

	return {
		handleCanvasPointerDown,
		handleNodePointerDown,
		handleGroupPointerDown,
		handleResizePointerDown,
	};
}
