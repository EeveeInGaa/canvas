import type { CanvasGroup, CanvasNode } from '@/canvas/types/canvas-node.types';
import type { Point, Rect } from '@/canvas/types/geometry.types';
import {
	doRectsIntersect,
	getBoundingRect,
	getNodeRect,
	isPointInsideRect,
} from '@/canvas/utils/geometry';
import { SNAP_GRID_SIZE } from '@/canvas/utils/grid.ts';

export const GROUP_FRAME_PADDING = SNAP_GRID_SIZE;

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

export const GROUP_FRAME_HIT_THICKNESS = 8;

export function getGroupFrameRect(
	group: CanvasGroup,
	nodes: CanvasNode[],
): Rect | null {
	const groupRect = getGroupRect(group, nodes);

	if (!groupRect) {
		return null;
	}

	return {
		x: groupRect.x - GROUP_FRAME_PADDING,
		y: groupRect.y - GROUP_FRAME_PADDING,
		width: groupRect.width + GROUP_FRAME_PADDING * 2,
		height: groupRect.height + GROUP_FRAME_PADDING * 2,
	};
}

export function doesRectIntersectGroupFrame(
	rect: Rect,
	group: CanvasGroup,
	nodes: CanvasNode[],
): boolean {
	const frameRect = getGroupFrameRect(group, nodes);

	if (!frameRect) {
		return false;
	}

	const frameParts: Rect[] = [
		{
			x: frameRect.x,
			y: frameRect.y,
			width: frameRect.width,
			height: GROUP_FRAME_HIT_THICKNESS,
		},
		{
			x: frameRect.x,
			y: frameRect.y + frameRect.height - GROUP_FRAME_HIT_THICKNESS,
			width: frameRect.width,
			height: GROUP_FRAME_HIT_THICKNESS,
		},
		{
			x: frameRect.x,
			y: frameRect.y,
			width: GROUP_FRAME_HIT_THICKNESS,
			height: frameRect.height,
		},
		{
			x: frameRect.x + frameRect.width - GROUP_FRAME_HIT_THICKNESS,
			y: frameRect.y,
			width: GROUP_FRAME_HIT_THICKNESS,
			height: frameRect.height,
		},
	];

	return frameParts.some((framePart) => doRectsIntersect(rect, framePart));
}

export function findGroupDropTarget(
	node: CanvasNode,
	groups: CanvasGroup[],
	nodes: CanvasNode[],
): CanvasGroup | null {
	const nodeCenter: Point = {
		x: node.x + node.width / 2,
		y: node.y + node.height / 2,
	};

	return (
		[...groups].reverse().find((group) => {
			if (group.nodeIds.includes(node.id)) {
				return false;
			}

			const frameRect = getGroupFrameRect(group, nodes);

			return frameRect !== null && isPointInsideRect(nodeCenter, frameRect);
		}) ?? null
	);
}
