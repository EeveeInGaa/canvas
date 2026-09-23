import { type RefObject, useCallback, useEffect, useRef } from 'react';

import type { CanvasGroup } from '@/types/canvas-node.types';
import type { Rect } from '@/types/geometry.types';
import { getBoundingRect, getNodeRect } from '@/utils/geometry';
import {
	GROUP_FRAME_PADDING,
	type GroupRectById,
	type NodeById,
} from '@/utils/group';

export type CanvasResizePreviewValue = {
	nodeId: string;
	width: number;
	height: number;
};

type UseCanvasResizePreviewParams = {
	groups: CanvasGroup[];
	nodeById: NodeById;
	groupRectById: GroupRectById;
	nodeElementsRef: RefObject<Map<string, HTMLDivElement>>;
	groupElementsRef: RefObject<Map<string, HTMLDivElement>>;
};

function setGroupElementRect(element: HTMLDivElement, rect: Rect) {
	element.style.left = `${rect.x - GROUP_FRAME_PADDING}px`;
	element.style.top = `${rect.y - GROUP_FRAME_PADDING}px`;
	element.style.width = `${rect.width + GROUP_FRAME_PADDING * 2}px`;
	element.style.height = `${rect.height + GROUP_FRAME_PADDING * 2}px`;
}

export function useCanvasResizePreview({
	groups,
	nodeById,
	groupRectById,
	nodeElementsRef,
	groupElementsRef,
}: UseCanvasResizePreviewParams) {
	const animationFrameRef = useRef<number | null>(null);
	const latestSizeRef = useRef<CanvasResizePreviewValue | null>(null);

	const cancelScheduledPreview = useCallback(() => {
		if (animationFrameRef.current === null) {
			return;
		}

		cancelAnimationFrame(animationFrameRef.current);
		animationFrameRef.current = null;
	}, []);

	useEffect(() => cancelScheduledPreview, [cancelScheduledPreview]);

	const schedulePreview = useCallback(
		(value: CanvasResizePreviewValue) => {
			latestSizeRef.current = value;

			if (animationFrameRef.current !== null) {
				return;
			}

			animationFrameRef.current = requestAnimationFrame(() => {
				const latestSize = latestSizeRef.current;

				if (!latestSize) {
					animationFrameRef.current = null;
					return;
				}

				const nodeElement = nodeElementsRef.current.get(latestSize.nodeId);

				if (nodeElement) {
					nodeElement.style.width = `${latestSize.width}px`;
					nodeElement.style.height = `${latestSize.height}px`;
				}

				for (const group of groups) {
					if (!group.nodeIds.includes(latestSize.nodeId)) {
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

							return [
								getNodeRect(
									nodeId === latestSize.nodeId
										? { ...node, ...latestSize }
										: node,
								),
							];
						}),
					);

					if (groupRect) {
						setGroupElementRect(groupElement, groupRect);
					}
				}

				animationFrameRef.current = null;
			});
		},
		[groupElementsRef, groups, nodeById, nodeElementsRef],
	);

	const clearPreview = useCallback(() => {
		const latestSize = latestSizeRef.current;

		cancelScheduledPreview();

		if (latestSize) {
			const node = nodeById.get(latestSize.nodeId);
			const nodeElement = nodeElementsRef.current.get(latestSize.nodeId);

			if (node && nodeElement) {
				nodeElement.style.width = `${node.width}px`;
				nodeElement.style.height = `${node.height}px`;
			}

			for (const group of groups) {
				if (!group.nodeIds.includes(latestSize.nodeId)) {
					continue;
				}

				const groupElement = groupElementsRef.current.get(group.id);
				const groupRect = groupRectById.get(group.id);

				if (groupElement && groupRect) {
					setGroupElementRect(groupElement, groupRect);
				}
			}
		}

		latestSizeRef.current = null;
	}, [
		cancelScheduledPreview,
		groupElementsRef,
		groupRectById,
		groups,
		nodeById,
		nodeElementsRef,
	]);

	const completePreview = useCallback(() => {
		cancelScheduledPreview();
		latestSizeRef.current = null;
	}, [cancelScheduledPreview]);

	return {
		latestSizeRef,
		schedulePreview,
		clearPreview,
		completePreview,
	};
}

export type CanvasResizePreview = ReturnType<typeof useCanvasResizePreview>;
