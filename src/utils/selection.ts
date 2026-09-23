import type { CanvasGroup, CanvasNode } from '@/types/canvas-node.types';
import type { Rect } from '@/types/geometry.types';
import type { SelectionMode } from '@/types/interaction.types';
import { doRectsIntersect } from '@/utils/geometry';
import { doesRectIntersectGroupFrame, type GroupRectById } from '@/utils/group';

export type CanvasSelection = {
	nodeIds: string[];
	groupIds: string[];
};

function normalizeSelection(
	groups: CanvasGroup[],
	selection: CanvasSelection,
): CanvasSelection {
	const groupIds = [...new Set(selection.groupIds)];
	const selectedGroupIdSet = new Set(groupIds);
	const selectedGroupNodeIdSet = new Set(
		groups
			.filter((group) => selectedGroupIdSet.has(group.id))
			.flatMap((group) => group.nodeIds),
	);

	return {
		groupIds,
		nodeIds: [...new Set(selection.nodeIds)].filter(
			(nodeId) => !selectedGroupNodeIdSet.has(nodeId),
		),
	};
}

export function mergeCanvasSelection(
	groups: CanvasGroup[],
	startSelection: CanvasSelection,
	nextSelection: CanvasSelection,
	mode: SelectionMode,
): CanvasSelection {
	if (mode === 'replace') {
		return normalizeSelection(groups, nextSelection);
	}

	const nodeIdSet = new Set(startSelection.nodeIds);
	const groupIdSet = new Set(startSelection.groupIds);

	for (const groupId of nextSelection.groupIds) {
		if (mode === 'toggle' && groupIdSet.has(groupId)) {
			groupIdSet.delete(groupId);
		} else {
			groupIdSet.add(groupId);
		}
	}

	for (const nodeId of nextSelection.nodeIds) {
		if (mode === 'toggle' && nodeIdSet.has(nodeId)) {
			nodeIdSet.delete(nodeId);
		} else {
			nodeIdSet.add(nodeId);
		}
	}

	return normalizeSelection(groups, {
		nodeIds: [...nodeIdSet],
		groupIds: [...groupIdSet],
	});
}

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
	groupRectById: GroupRectById,
): CanvasSelection {
	const groupIds = groups
		.filter((group) => {
			const groupRect = groupRectById.get(group.id);

			return groupRect ? doesRectIntersectGroupFrame(rect, groupRect) : false;
		})
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
