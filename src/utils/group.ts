import type { CanvasGroup, CanvasNode } from '@/types/canvas-node.types.ts';
import type { Point, Rect } from '@/types/geometry.types.ts';
import {
	doRectsIntersect,
	getBoundingRect,
	getNodeRect,
	isPointInsideRect,
} from '@/utils/geometry.ts';
import { SNAP_GRID_SIZE } from '@/utils/grid.ts';

export const GROUP_FRAME_PADDING = SNAP_GRID_SIZE;

export type NodeById = ReadonlyMap<string, CanvasNode>;
export type GroupRectById = ReadonlyMap<string, Rect>;

export function createGroupId(): string {
	return crypto.randomUUID();
}

export function getGroupRect(
	group: CanvasGroup,
	nodeById: NodeById,
): Rect | null {
	const groupRects = group.nodeIds
		.map((nodeId) => nodeById.get(nodeId))
		.filter((node) => node !== undefined)
		.map(getNodeRect);

	return getBoundingRect(groupRects);
}

export function createNodeById(nodes: CanvasNode[]): NodeById {
	return new Map(nodes.map((node) => [node.id, node]));
}

export function createGroupRectById(
	groups: CanvasGroup[],
	nodeById: NodeById,
): GroupRectById {
	return new Map(
		groups.flatMap((group) => {
			const rect = getGroupRect(group, nodeById);

			return rect ? [[group.id, rect] as const] : [];
		}),
	);
}

export const GROUP_FRAME_HIT_THICKNESS = 8;

export function getGroupFrameRect(groupRect: Rect): Rect {
	return {
		x: groupRect.x - GROUP_FRAME_PADDING,
		y: groupRect.y - GROUP_FRAME_PADDING,
		width: groupRect.width + GROUP_FRAME_PADDING * 2,
		height: groupRect.height + GROUP_FRAME_PADDING * 2,
	};
}

export function doesRectIntersectGroupFrame(
	rect: Rect,
	groupRect: Rect,
): boolean {
	const frameRect = getGroupFrameRect(groupRect);

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
	groupRectById: GroupRectById,
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

			const groupRect = groupRectById.get(group.id);
			const frameRect = groupRect ? getGroupFrameRect(groupRect) : null;

			return frameRect !== null && isPointInsideRect(nodeCenter, frameRect);
		}) ?? null
	);
}
