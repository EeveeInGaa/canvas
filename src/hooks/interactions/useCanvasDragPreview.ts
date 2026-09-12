import { type RefObject, useCallback, useEffect, useMemo, useRef } from 'react';

import type { CanvasGroup, CanvasNode } from '@/types/canvas-node.types';
import type { NodePosition } from '@/utils/drag';
import { getBoundingRect } from '@/utils/geometry';
import { GROUP_FRAME_PADDING } from '@/utils/group';

type UseCanvasDragPreviewParams = {
	groups: CanvasGroup[];
	nodes: CanvasNode[];
	nodeElementsRef: RefObject<Map<string, HTMLDivElement>>;
	groupElementsRef: RefObject<Map<string, HTMLDivElement>>;
};

export function useCanvasDragPreview({
	groups,
	nodes,
	nodeElementsRef,
	groupElementsRef,
}: UseCanvasDragPreviewParams) {
	const animationFrameRef = useRef<number | null>(null);
	const latestPositionsRef = useRef<NodePosition[] | null>(null);
	const nodeById = useMemo(
		() => new Map(nodes.map((node) => [node.id, node])),
		[nodes],
	);

	const cancelScheduledPreview = useCallback(() => {
		if (animationFrameRef.current === null) {
			return;
		}

		cancelAnimationFrame(animationFrameRef.current);
		animationFrameRef.current = null;
	}, []);

	useEffect(() => cancelScheduledPreview, [cancelScheduledPreview]);

	const schedulePreview = useCallback(
		(positions: NodePosition[]) => {
			latestPositionsRef.current = positions;
			cancelScheduledPreview();

			animationFrameRef.current = requestAnimationFrame(() => {
				const positionsByNodeId = new Map(
					positions.map((position) => [position.nodeId, position]),
				);

				for (const position of positions) {
					const nodeElement = nodeElementsRef.current.get(position.nodeId);

					if (nodeElement) {
						nodeElement.style.left = `${position.x}px`;
						nodeElement.style.top = `${position.y}px`;
					}
				}

				for (const group of groups) {
					if (!group.nodeIds.some((nodeId) => positionsByNodeId.has(nodeId))) {
						continue;
					}

					const groupElement = groupElementsRef.current.get(group.id);

					if (!groupElement) {
						continue;
					}

					const groupRect = getBoundingRect(
						group.nodeIds.flatMap((nodeId) => {
							const node = nodeById.get(nodeId);

							if (!node) {
								return [];
							}

							const position = positionsByNodeId.get(nodeId);

							return [
								{
									x: position?.x ?? node.x,
									y: position?.y ?? node.y,
									width: node.width,
									height: node.height,
								},
							];
						}),
					);

					if (!groupRect) {
						continue;
					}

					groupElement.style.left = `${groupRect.x - GROUP_FRAME_PADDING}px`;
					groupElement.style.top = `${groupRect.y - GROUP_FRAME_PADDING}px`;
					groupElement.style.width = `${groupRect.width + GROUP_FRAME_PADDING * 2}px`;
					groupElement.style.height = `${groupRect.height + GROUP_FRAME_PADDING * 2}px`;
				}

				animationFrameRef.current = null;
			});
		},
		[
			cancelScheduledPreview,
			groupElementsRef,
			groups,
			nodeById,
			nodeElementsRef,
		],
	);

	const clearPreview = useCallback(() => {
		cancelScheduledPreview();
		latestPositionsRef.current = null;
	}, [cancelScheduledPreview]);

	return {
		latestPositionsRef,
		schedulePreview,
		clearPreview,
	};
}

export type CanvasDragPreview = ReturnType<typeof useCanvasDragPreview>;
