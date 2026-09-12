import type { CanvasNode } from '../types/canvas-node.types.ts';
import type { Point, Rect } from '../types/geometry.types.ts';

export function createRectFromPoints(start: Point, end: Point): Rect {
	return {
		x: Math.min(start.x, end.x),
		y: Math.min(start.y, end.y),
		width: Math.abs(end.x - start.x),
		height: Math.abs(end.y - start.y),
	};
}

export function doRectsIntersect(first: Rect, second: Rect): boolean {
	return (
		first.x < second.x + second.width &&
		first.x + first.width > second.x &&
		first.y < second.y + second.height &&
		first.y + first.height > second.y
	);
}

export function getNodeRect(node: CanvasNode): Rect {
	return {
		x: node.x,
		y: node.y,
		width: node.width,
		height: node.height,
	};
}

export function getBoundingRect(rects: Rect[]): Rect | null {
	if (rects.length === 0) {
		return null;
	}

	const minX = Math.min(...rects.map((rect) => rect.x));
	const minY = Math.min(...rects.map((rect) => rect.y));
	const maxX = Math.max(...rects.map((rect) => rect.x + rect.width));
	const maxY = Math.max(...rects.map((rect) => rect.y + rect.height));

	return {
		x: minX,
		y: minY,
		width: maxX - minX,
		height: maxY - minY,
	};
}

export function isPointInsideRect(point: Point, rect: Rect): boolean {
	return (
		point.x >= rect.x &&
		point.x <= rect.x + rect.width &&
		point.y >= rect.y &&
		point.y <= rect.y + rect.height
	);
}
