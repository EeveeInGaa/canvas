import type { CanvasGroup, CanvasNode } from '@/types/canvas-node.types';
import type { Rect } from '@/types/geometry.types';
import { doRectsIntersect } from '@/utils/geometry';
import { doesRectIntersectGroupFrame } from '@/utils/group';

export type CanvasSelection = {
	nodeIds: string[];
	groupIds: string[];
};

export function getEffectiveSelectedNodeIds(
	groups: CanvasGroup[],
	selectedNodeIds: string[],
	selectedGroupIds: string[],
): string[] {
	const effectiveNodeIds = new Set(selectedNodeIds);
	const selectedGroupIdSet = new Set(selectedGroupIds);

	for (const group of groups) {
		if (!selectedGroupIdSet.has(group.id)) {
			continue;
		}

		for (const nodeId of group.nodeIds) {
			effectiveNodeIds.add(nodeId);
		}
	}

	return [...effectiveNodeIds];
}

export function getSelectionInRect(
	rect: Rect,
	groups: CanvasGroup[],
	nodes: CanvasNode[],
): CanvasSelection {
	const groupIds = groups
		.filter((group) => doesRectIntersectGroupFrame(rect, group, nodes))
		.map((group) => group.id);
	const selectedGroupIdSet = new Set(groupIds);
	const groupedNodeIds = new Set(
		groups
			.filter((group) => selectedGroupIdSet.has(group.id))
			.flatMap((group) => group.nodeIds),
	);
	const nodeIds = nodes
		.filter(
			(node) =>
				doRectsIntersect(rect, {
					x: node.x,
					y: node.y,
					width: node.width,
					height: node.height,
				}) && !groupedNodeIds.has(node.id),
		)
		.map((node) => node.id);

	return { nodeIds, groupIds };
}
