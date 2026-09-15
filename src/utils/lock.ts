import type { CanvasGroup, CanvasNode } from '@/types/canvas-node.types';

export function getLockedNodeIdSet(
	nodes: CanvasNode[],
	groups: CanvasGroup[],
): Set<string> {
	const lockedNodeIds = new Set(
		nodes.filter((node) => node.isLocked).map((node) => node.id),
	);

	for (const group of groups) {
		if (!group.isLocked) {
			continue;
		}

		for (const nodeId of group.nodeIds) {
			lockedNodeIds.add(nodeId);
		}
	}

	return lockedNodeIds;
}
