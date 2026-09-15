import type { CanvasNode } from '@/types/canvas-node.types';
import {
	CanvasOrientation,
	CanvasSizePreset,
	type CanvasSpace,
} from '@/types/canvas-space.types';
import type { Point, Rect, Size } from '@/types/geometry.types';
import { getBoundingRect, getNodeRect } from '@/utils/geometry';
import { clamp } from '@/utils/math';

const CANVAS_UNITS_PER_INCH = 96;
const MILLIMETERS_PER_INCH = 25.4;

type CanvasPresetDefinition = {
	label: string;
	physicalWidth: number;
	physicalHeight: number;
	unit: 'in' | 'mm';
};

export const CANVAS_PRESETS: Record<CanvasSizePreset, CanvasPresetDefinition> =
	{
		[CanvasSizePreset.A4]: {
			label: 'A4',
			physicalWidth: 210,
			physicalHeight: 297,
			unit: 'mm',
		},
		[CanvasSizePreset.A5]: {
			label: 'A5',
			physicalWidth: 148,
			physicalHeight: 210,
			unit: 'mm',
		},
		[CanvasSizePreset.Letter]: {
			label: 'Letter',
			physicalWidth: 8.5,
			physicalHeight: 11,
			unit: 'in',
		},
	};

export const INFINITE_CANVAS_SPACE: CanvasSpace = { kind: 'infinite' };

function toCanvasUnits(value: number, unit: 'in' | 'mm'): number {
	return unit === 'in'
		? value * CANVAS_UNITS_PER_INCH
		: (value / MILLIMETERS_PER_INCH) * CANVAS_UNITS_PER_INCH;
}

export function getCanvasWorldSize(space: CanvasSpace): Size | null {
	if (space.kind === 'infinite') {
		return null;
	}

	const preset = CANVAS_PRESETS[space.preset];
	const portraitSize = {
		width: toCanvasUnits(preset.physicalWidth, preset.unit),
		height: toCanvasUnits(preset.physicalHeight, preset.unit),
	};

	return space.orientation === CanvasOrientation.Portrait
		? portraitSize
		: { width: portraitSize.height, height: portraitSize.width };
}

export function getCanvasBounds(space: CanvasSpace): Rect | null {
	const size = getCanvasWorldSize(space);

	if (!size) {
		return null;
	}

	return {
		x: -size.width / 2,
		y: -size.height / 2,
		width: size.width,
		height: size.height,
	};
}

export function isRectInsideBounds(rect: Rect, bounds: Rect): boolean {
	return (
		rect.x >= bounds.x &&
		rect.y >= bounds.y &&
		rect.x + rect.width <= bounds.x + bounds.width &&
		rect.y + rect.height <= bounds.y + bounds.height
	);
}

export function canNodesFitCanvas(
	nodes: readonly CanvasNode[],
	space: CanvasSpace,
): boolean {
	const bounds = getCanvasBounds(space);

	return !bounds || nodes.every((node) => isRectInsideBounds(node, bounds));
}

export function constrainNodeToBounds<T extends CanvasNode>(
	node: T,
	bounds: Rect | null,
): T {
	if (!bounds) {
		return node;
	}

	return {
		...node,
		x: clamp(node.x, bounds.x, bounds.x + bounds.width - node.width),
		y: clamp(node.y, bounds.y, bounds.y + bounds.height - node.height),
	};
}

export function getConstrainedMovementDelta(
	nodes: readonly CanvasNode[],
	nodeIds: ReadonlySet<string>,
	delta: Point,
	bounds: Rect | null,
): Point {
	if (!bounds) {
		return delta;
	}

	const selectionRect = getBoundingRect(
		nodes.filter((node) => nodeIds.has(node.id)).map(getNodeRect),
	);

	if (!selectionRect) {
		return delta;
	}

	return {
		x: clamp(
			delta.x,
			bounds.x - selectionRect.x,
			bounds.x + bounds.width - (selectionRect.x + selectionRect.width),
		),
		y: clamp(
			delta.y,
			bounds.y - selectionRect.y,
			bounds.y + bounds.height - (selectionRect.y + selectionRect.height),
		),
	};
}

export function moveNodesInsideBounds<T extends CanvasNode>(
	nodes: T[],
	bounds: Rect | null,
): T[] {
	if (!bounds || nodes.length === 0) {
		return nodes;
	}

	const nodeIds = new Set(nodes.map((node) => node.id));
	const delta = getConstrainedMovementDelta(
		nodes,
		nodeIds,
		{ x: 0, y: 0 },
		bounds,
	);

	if (delta.x === 0 && delta.y === 0) {
		return nodes;
	}

	return nodes.map((node) => ({
		...node,
		x: node.x + delta.x,
		y: node.y + delta.y,
	}));
}
