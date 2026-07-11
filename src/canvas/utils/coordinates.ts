import type { Point } from '@/canvas/types/geometry.types.ts';
import type { Viewport } from '@/canvas/types/viewport.types.ts';

type ScreenToCanvasParams = {
	screenX: number;
	screenY: number;
	canvasRect: DOMRect;
	viewport: Viewport;
};

export function screenToCanvas({
	screenX,
	screenY,
	canvasRect,
	viewport,
}: ScreenToCanvasParams): Point {
	const localX = screenX - canvasRect.left;
	const localY = screenY - canvasRect.top;

	return {
		x: (localX - viewport.x) / viewport.scale,
		y: (localY - viewport.y) / viewport.scale,
	};
}

export function screenDeltaToCanvasDelta(delta: Point, scale: number): Point {
	return {
		x: delta.x / scale,
		y: delta.y / scale,
	};
}
