import {
	type Dispatch,
	type PointerEvent as ReactPointerEvent,
	type SetStateAction,
	useCallback,
} from 'react';

import type { CanvasDragPreview } from '@/hooks/interactions/useCanvasDragPreview';
import type { CanvasResizePreview } from '@/hooks/interactions/useCanvasResizePreview';
import type { CanvasGroup, CanvasNode } from '@/types/canvas-node.types';
import type { Point, Rect } from '@/types/geometry.types';
import type { InteractionState } from '@/types/interaction.types';
import type { Viewport } from '@/types/viewport.types';
import { getDraggedNodePositions, getDropTargetGroupId } from '@/utils/drag';
import { createRectFromPoints } from '@/utils/geometry';
import { snapValueToGrid } from '@/utils/grid';
import type { GroupRectById, NodeById } from '@/utils/group';
import { clampNodeSize } from '@/utils/node';
import { getSelectionInRect, mergeCanvasSelection } from '@/utils/selection';

type UseCanvasInteractionMoveParams = {
	interaction: InteractionState;
	groups: CanvasGroup[];
	nodes: CanvasNode[];
	nodeById: NodeById;
	groupRectById: GroupRectById;
	viewport: Viewport;
	isSnapEnabled: boolean;
	gridSize: number;
	canvasBounds: Rect | null;
	getCanvasPosition: (clientX: number, clientY: number) => Point | null;
	dragPreview: CanvasDragPreview;
	resizePreview: CanvasResizePreview;
	setInteraction: Dispatch<SetStateAction<InteractionState>>;
	setSelectedNodeIds: Dispatch<SetStateAction<string[]>>;
	setSelectedGroupIds: Dispatch<SetStateAction<string[]>>;
	setViewport: Dispatch<SetStateAction<Viewport>>;
	setCursorCanvasPosition: Dispatch<SetStateAction<Point | null>>;
	setDropTargetGroupId: Dispatch<SetStateAction<string | null>>;
};

export function useCanvasInteractionMove({
	interaction,
	groups,
	nodes,
	nodeById,
	groupRectById,
	viewport,
	isSnapEnabled,
	gridSize,
	canvasBounds,
	getCanvasPosition,
	dragPreview,
	resizePreview,
	setInteraction,
	setSelectedNodeIds,
	setSelectedGroupIds,
	setViewport,
	setCursorCanvasPosition,
	setDropTargetGroupId,
}: UseCanvasInteractionMoveParams) {
	return useCallback(
		(event: ReactPointerEvent<HTMLDivElement>) => {
			const canvasPosition = getCanvasPosition(event.clientX, event.clientY);

			setCursorCanvasPosition(canvasPosition);

			if (interaction.type === 'idle') {
				return;
			}

			if (interaction.type === 'panning') {
				const deltaX = event.clientX - interaction.startPointerX;
				const deltaY = event.clientY - interaction.startPointerY;

				setViewport((currentViewport) => ({
					...currentViewport,
					x: interaction.startViewportX + deltaX,
					y: interaction.startViewportY + deltaY,
				}));
				return;
			}

			if (interaction.type === 'selecting') {
				if (!canvasPosition) {
					return;
				}

				const nextInteraction: InteractionState = {
					...interaction,
					currentX: canvasPosition.x,
					currentY: canvasPosition.y,
				};
				const selectionRect = createRectFromPoints(
					{ x: nextInteraction.startX, y: nextInteraction.startY },
					{ x: nextInteraction.currentX, y: nextInteraction.currentY },
				);
				const selection = getSelectionInRect(
					selectionRect,
					groups,
					nodes,
					groupRectById,
				);
				const nextSelection = mergeCanvasSelection(
					groups,
					{
						nodeIds: interaction.startSelectedNodeIds,
						groupIds: interaction.startSelectedGroupIds,
					},
					selection,
					interaction.selectionMode,
				);

				setInteraction(nextInteraction);
				setSelectedGroupIds(nextSelection.groupIds);
				setSelectedNodeIds(nextSelection.nodeIds);
				return;
			}

			if (interaction.type === 'dragging') {
				const positions = getDraggedNodePositions({
					interaction,
					clientX: event.clientX,
					clientY: event.clientY,
					viewportScale: viewport.scale,
					isSnapEnabled,
					gridSize,
					nodes,
					canvasBounds,
				});

				setDropTargetGroupId(
					getDropTargetGroupId(
						interaction,
						positions,
						groups,
						nodeById,
						groupRectById,
					),
				);
				dragPreview.schedulePreview(positions);
				return;
			}

			const deltaWidth =
				(event.clientX - interaction.startPointerX) / viewport.scale;
			const deltaHeight =
				(event.clientY - interaction.startPointerY) / viewport.scale;
			const rawWidth = clampNodeSize(interaction.startWidth + deltaWidth);
			const rawHeight = clampNodeSize(interaction.startHeight + deltaHeight);
			let width = isSnapEnabled
				? clampNodeSize(snapValueToGrid(rawWidth, gridSize))
				: rawWidth;
			let height = isSnapEnabled
				? clampNodeSize(snapValueToGrid(rawHeight, gridSize))
				: rawHeight;
			const resizedNode = nodeById.get(interaction.nodeId);

			if (canvasBounds && resizedNode) {
				width = Math.min(
					width,
					canvasBounds.x + canvasBounds.width - resizedNode.x,
				);
				height = Math.min(
					height,
					canvasBounds.y + canvasBounds.height - resizedNode.y,
				);
			}

			resizePreview.schedulePreview({
				nodeId: interaction.nodeId,
				width,
				height,
			});
		},
		[
			canvasBounds,
			dragPreview.schedulePreview,
			getCanvasPosition,
			gridSize,
			groupRectById,
			groups,
			interaction,
			isSnapEnabled,
			nodes,
			nodeById,
			resizePreview.schedulePreview,
			setCursorCanvasPosition,
			setDropTargetGroupId,
			setInteraction,
			setSelectedGroupIds,
			setSelectedNodeIds,
			setViewport,
			viewport.scale,
		],
	);
}
