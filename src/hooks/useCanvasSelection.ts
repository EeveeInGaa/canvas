import { useEffect, useMemo, useState } from 'react';

import type { CanvasGroup, CanvasNode } from '@/types/canvas-node.types';

type UseCanvasSelectionParams = {
	nodes: CanvasNode[];
	groups: CanvasGroup[];
};

export function useCanvasSelection({
	nodes,
	groups,
}: UseCanvasSelectionParams) {
	const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
	const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
	const [editingNodeId, setEditingNodeId] = useState<string | null>(null);

	const selectedNodeIdSet = useMemo(
		() => new Set(selectedNodeIds),
		[selectedNodeIds],
	);

	const selectedGroupIdSet = useMemo(
		() => new Set(selectedGroupIds),
		[selectedGroupIds],
	);

	const selectedGroupNodeIdSet = useMemo(() => {
		const nodeIds = new Set<string>();

		for (const group of groups) {
			if (!selectedGroupIdSet.has(group.id)) {
				continue;
			}

			for (const nodeId of group.nodeIds) {
				nodeIds.add(nodeId);
			}
		}

		return nodeIds;
	}, [groups, selectedGroupIdSet]);

	const effectiveSelectedNodeIdSet = useMemo(
		() => new Set([...selectedNodeIds, ...selectedGroupNodeIdSet]),
		[selectedGroupNodeIdSet, selectedNodeIds],
	);

	const effectiveSelectedNodeIds = useMemo(
		() => [...effectiveSelectedNodeIdSet],
		[effectiveSelectedNodeIdSet],
	);

	useEffect(() => {
		const nodeIds = new Set(nodes.map((node) => node.id));
		const groupIds = new Set(groups.map((group) => group.id));

		setSelectedNodeIds((currentSelectedNodeIds) => {
			const nextSelectedNodeIds = currentSelectedNodeIds.filter((nodeId) =>
				nodeIds.has(nodeId),
			);

			return nextSelectedNodeIds.length === currentSelectedNodeIds.length
				? currentSelectedNodeIds
				: nextSelectedNodeIds;
		});

		if (editingNodeId && !nodeIds.has(editingNodeId)) {
			setEditingNodeId(null);
		}

		setSelectedGroupIds((currentSelectedGroupIds) => {
			const nextSelectedGroupIds = currentSelectedGroupIds.filter((groupId) =>
				groupIds.has(groupId),
			);

			return nextSelectedGroupIds.length === currentSelectedGroupIds.length
				? currentSelectedGroupIds
				: nextSelectedGroupIds;
		});
	}, [editingNodeId, groups, nodes]);

	return {
		selectedNodeIds,
		selectedGroupIds,
		editingNodeId,
		selectedNodeIdSet,
		selectedGroupIdSet,
		selectedGroupNodeIdSet,
		effectiveSelectedNodeIdSet,
		effectiveSelectedNodeIds,
		setSelectedNodeIds,
		setSelectedGroupIds,
		setEditingNodeId,
	};
}

export type CanvasSelectionController = ReturnType<typeof useCanvasSelection>;
