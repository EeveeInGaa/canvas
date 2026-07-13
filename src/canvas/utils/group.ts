import type { CanvasGroup, CanvasNode } from '@/canvas/types/canvas-node.types';
import type { Rect } from '@/canvas/types/geometry.types';
import { getBoundingRect, getNodeRect } from '@/canvas/utils/geometry';

export const GROUP_FRAME_PADDING = 10;

export function createGroupId(): string {
	return crypto.randomUUID();
}

export function getGroupRect(
	group: CanvasGroup,
	nodes: CanvasNode[],
): Rect | null {
	const nodeById = new Map(nodes.map((node) => [node.id, node]));

	const groupRects = group.nodeIds
		.map((nodeId) => nodeById.get(nodeId))
		.filter((node) => node !== undefined)
		.map(getNodeRect);

	return getBoundingRect(groupRects);
}
