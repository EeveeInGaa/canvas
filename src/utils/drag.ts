import type {
	CanvasDocument,
	CanvasGroup,
	CanvasNode,
} from '@/types/canvas-node.types';
import type { InteractionState } from '@/types/interaction.types';
import { snapValueToGrid } from '@/utils/grid';
import { findGroupDropTarget } from '@/utils/group';

export type DraggingInteraction = Extract<
	InteractionState,
	{ type: 'dragging' }
>;

export type NodePosition = {
	nodeId: string;
	x: number;
	y: number;
};

type GetDraggedNodePositionsParams = {
	interaction: DraggingInteraction;
	clientX: number;
	clientY: number;
	viewportScale: number;
	isSnapEnabled: boolean;
	gridSize: number;
};

export function getNodePositions(
	nodes: CanvasNode[],
	nodeIds: string[],
): NodePosition[] {
	const nodeIdSet = new Set(nodeIds);

	return nodes
		.filter((node) => nodeIdSet.has(node.id))
		.map((node) => ({ nodeId: node.id, x: node.x, y: node.y }));
}

export function getDraggedNodePositions({
	interaction,
	clientX,
	clientY,
	viewportScale,
	isSnapEnabled,
	gridSize,
}: GetDraggedNodePositionsParams): NodePosition[] {
	const deltaX = (clientX - interaction.startPointerX) / viewportScale;
	const deltaY = (clientY - interaction.startPointerY) / viewportScale;
	const selectionStartX = Math.min(
		...interaction.startNodePositions.map((position) => position.x),
	);
	const selectionStartY = Math.min(
		...interaction.startNodePositions.map((position) => position.y),
	);
	const snappedDeltaX = isSnapEnabled
		? snapValueToGrid(selectionStartX + deltaX, gridSize) - selectionStartX
		: deltaX;
	const snappedDeltaY = isSnapEnabled
		? snapValueToGrid(selectionStartY + deltaY, gridSize) - selectionStartY
		: deltaY;

	return interaction.startNodePositions.map((position) => ({
		nodeId: position.nodeId,
		x: position.x + snappedDeltaX,
		y: position.y + snappedDeltaY,
	}));
}

export function getDropTargetGroupId(
	interaction: DraggingInteraction,
	positions: NodePosition[],
	groups: CanvasGroup[],
	nodes: CanvasNode[],
): string | null {
	if (interaction.dragSource !== 'node' || interaction.nodeIds.length !== 1) {
		return null;
	}

	const draggedNodeId = interaction.nodeIds[0];
	const nextPosition = positions.find(
		(position) => position.nodeId === draggedNodeId,
	);
	const draggedNode = nodes.find((node) => node.id === draggedNodeId);

	if (!draggedNode || !nextPosition) {
		return null;
	}

	const positionedNode = {
		...draggedNode,
		x: nextPosition.x,
		y: nextPosition.y,
	};
	const previewNodes = nodes.map((node) =>
		node.id === draggedNodeId ? positionedNode : node,
	);

	return findGroupDropTarget(positionedNode, groups, previewNodes)?.id ?? null;
}

export function applyDraggedNodePositions(
	canvasDocument: CanvasDocument,
	interaction: DraggingInteraction,
	positions: NodePosition[],
): CanvasDocument {
	const positionsByNodeId = new Map(
		positions.map((position) => [position.nodeId, position]),
	);
	let didNodesChange = false;
	const nextNodes = canvasDocument.nodes.map((node) => {
		const position = positionsByNodeId.get(node.id);

		if (!position || (node.x === position.x && node.y === position.y)) {
			return node;
		}

		didNodesChange = true;

		return { ...node, x: position.x, y: position.y };
	});

	if (!didNodesChange) {
		return canvasDocument;
	}

	if (interaction.dragSource !== 'node' || interaction.nodeIds.length !== 1) {
		return { nodes: nextNodes, groups: canvasDocument.groups };
	}

	const draggedNodeId = interaction.nodeIds[0];
	const draggedNode = nextNodes.find((node) => node.id === draggedNodeId);

	if (!draggedNode) {
		return { nodes: nextNodes, groups: canvasDocument.groups };
	}

	const targetGroup = findGroupDropTarget(
		draggedNode,
		canvasDocument.groups,
		nextNodes,
	);

	if (!targetGroup) {
		return { nodes: nextNodes, groups: canvasDocument.groups };
	}

	const nextGroups = canvasDocument.groups.map((group) => {
		const nodeIds = group.nodeIds.filter((nodeId) => nodeId !== draggedNodeId);

		return {
			...group,
			nodeIds:
				group.id === targetGroup.id ? [...nodeIds, draggedNodeId] : nodeIds,
		};
	});

	return {
		nodes: nextNodes,
		groups: nextGroups.filter((group) => group.nodeIds.length >= 2),
	};
}
