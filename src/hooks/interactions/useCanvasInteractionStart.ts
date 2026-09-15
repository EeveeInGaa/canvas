import {
	type Dispatch,
	type PointerEvent as ReactPointerEvent,
	type SetStateAction,
	useCallback,
	useMemo,
} from 'react';

import type { CanvasGroup, CanvasNode } from '@/types/canvas-node.types';
import type { Point } from '@/types/geometry.types';
import type { InteractionState } from '@/types/interaction.types';
import type { Viewport } from '@/types/viewport.types';
import { getNodePositions } from '@/utils/drag';
import { getEffectiveSelectedNodeIds } from '@/utils/selection';

type UseCanvasInteractionStartParams = {
	groups: CanvasGroup[];
	nodes: CanvasNode[];
	selectedNodeIds: string[];
	lockedNodeIdSet: Set<string>;
	selectedGroupIds: string[];
	viewport: Viewport;
	isSpacePressed: boolean;
	getCanvasPosition: (clientX: number, clientY: number) => Point | null;
	setInteraction: Dispatch<SetStateAction<InteractionState>>;
	setSelectedNodeIds: Dispatch<SetStateAction<string[]>>;
	setSelectedGroupIds: Dispatch<SetStateAction<string[]>>;
	setEditingNodeId: Dispatch<SetStateAction<string | null>>;
};

export function useCanvasInteractionStart({
	groups,
	nodes,
	selectedNodeIds,
	lockedNodeIdSet,
	selectedGroupIds,
	viewport,
	isSpacePressed,
	getCanvasPosition,
	setInteraction,
	setSelectedNodeIds,
	setSelectedGroupIds,
	setEditingNodeId,
}: UseCanvasInteractionStartParams) {
	const selectedNodeIdSet = useMemo(
		() => new Set(selectedNodeIds),
		[selectedNodeIds],
	);
	const selectedGroupIdSet = useMemo(
		() => new Set(selectedGroupIds),
		[selectedGroupIds],
	);
	const existingNodeIdSet = useMemo(
		() => new Set(nodes.map((node) => node.id)),
		[nodes],
	);

	const handleCanvasPointerDown = useCallback(
		(event: ReactPointerEvent<HTMLDivElement>) => {
			if (event.button !== 0) {
				return;
			}

			event.currentTarget.setPointerCapture(event.pointerId);
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

			const hasSelectionModifier =
				event.metaKey || event.ctrlKey || event.shiftKey;

			if (!hasSelectionModifier) {
				setSelectedNodeIds([]);
				setSelectedGroupIds([]);
			}

			setInteraction({
				type: 'selecting',
				startX: canvasPosition.x,
				startY: canvasPosition.y,
				currentX: canvasPosition.x,
				currentY: canvasPosition.y,
			});
		},
		[
			getCanvasPosition,
			isSpacePressed,
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
			setEditingNodeId(null);

			const hasSelectionModifier = event.metaKey || event.ctrlKey;
			let nextSelectedNodeIds = selectedNodeIds;
			let nextSelectedGroupIds = selectedGroupIds;
			const currentEffectiveNodeIdSet = new Set(
				getEffectiveSelectedNodeIds(groups, selectedNodeIds, selectedGroupIds),
			);

			if (hasSelectionModifier) {
				nextSelectedNodeIds = selectedNodeIdSet.has(node.id)
					? selectedNodeIds.filter((nodeId) => nodeId !== node.id)
					: [...selectedNodeIds, node.id];
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
			groups,
			isSpacePressed,
			lockedNodeIdSet,
			nodes,
			selectedGroupIds,
			selectedNodeIds,
			selectedNodeIdSet,
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

			const groupNodeIds = group.nodeIds.filter((nodeId) =>
				existingNodeIdSet.has(nodeId),
			);

			if (groupNodeIds.length === 0) {
				return;
			}

			const hasSelectionModifier = event.metaKey || event.ctrlKey;
			let nextSelectedGroupIds = selectedGroupIds;
			let nextSelectedNodeIds = selectedNodeIds;

			if (hasSelectionModifier) {
				nextSelectedGroupIds = selectedGroupIdSet.has(group.id)
					? selectedGroupIds.filter((groupId) => groupId !== group.id)
					: [...selectedGroupIds, group.id];
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
			groups,
			isSpacePressed,
			lockedNodeIdSet,
			nodes,
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
				startDocument: { nodes, groups },
			});
		},
		[
			groups,
			lockedNodeIdSet,
			nodes,
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
