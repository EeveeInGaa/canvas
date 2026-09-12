import {
	type Dispatch,
	type PointerEvent as ReactPointerEvent,
	type SetStateAction,
	useCallback,
} from 'react';

import type { CanvasDragPreview } from '@/hooks/interactions/useCanvasDragPreview';
import type { CanvasGroup, CanvasNode } from '@/types/canvas-node.types';
import type { Point } from '@/types/geometry.types';
import type { InteractionState } from '@/types/interaction.types';
import type { Viewport } from '@/types/viewport.types';
import { getDraggedNodePositions, getDropTargetGroupId } from '@/utils/drag';
import { createRectFromPoints } from '@/utils/geometry';
import { snapValueToGrid } from '@/utils/grid';
import { clampNodeSize } from '@/utils/node';
import { getSelectionInRect } from '@/utils/selection';

type UseCanvasInteractionMoveParams = {
	interaction: InteractionState;
	groups: CanvasGroup[];
	nodes: CanvasNode[];
	viewport: Viewport;
	isSnapEnabled: boolean;
	gridSize: number;
	getCanvasPosition: (clientX: number, clientY: number) => Point | null;
	dragPreview: CanvasDragPreview;
	setInteraction: Dispatch<SetStateAction<InteractionState>>;
	setNodes: Dispatch<SetStateAction<CanvasNode[]>>;
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
	viewport,
	isSnapEnabled,
	gridSize,
	getCanvasPosition,
	dragPreview,
	setInteraction,
	setNodes,
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
				const selection = getSelectionInRect(selectionRect, groups, nodes);

				setInteraction(nextInteraction);
				setSelectedGroupIds(selection.groupIds);
				setSelectedNodeIds(selection.nodeIds);
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
				});

				setDropTargetGroupId(
					getDropTargetGroupId(interaction, positions, groups, nodes),
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
			const width = isSnapEnabled
				? clampNodeSize(snapValueToGrid(rawWidth, gridSize))
				: rawWidth;
			const height = isSnapEnabled
				? clampNodeSize(snapValueToGrid(rawHeight, gridSize))
				: rawHeight;

			setNodes((currentNodes) => {
				let didChange = false;
				const nextNodes = currentNodes.map((node) => {
					if (
						node.id !== interaction.nodeId ||
						(node.width === width && node.height === height)
					) {
						return node;
					}

					didChange = true;
					return { ...node, width, height };
				});

				return didChange ? nextNodes : currentNodes;
			});
		},
		[
			dragPreview.schedulePreview,
			getCanvasPosition,
			gridSize,
			groups,
			interaction,
			isSnapEnabled,
			nodes,
			setCursorCanvasPosition,
			setDropTargetGroupId,
			setInteraction,
			setNodes,
			setSelectedGroupIds,
			setSelectedNodeIds,
			setViewport,
			viewport.scale,
		],
	);
}
