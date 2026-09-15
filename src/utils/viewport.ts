import type { Rect, Size } from '@/types/geometry.types';
import type { Viewport } from '@/types/viewport.types';
import { clamp } from '@/utils/math.ts';

export const NODE_CONTENT_ZOOM_THRESHOLD = 0.6;

export function clampScale(scale: number): number {
	return clamp(scale, 0.25, 3);
}

export function getVisibleCanvasRect(
	viewport: Viewport,
	viewportSize: Size,
	overscanPixels = 0,
): Rect {
	return {
		x: (0 - viewport.x - overscanPixels) / viewport.scale,
		y: (0 - viewport.y - overscanPixels) / viewport.scale,
		width: (viewportSize.width + overscanPixels * 2) / viewport.scale,
		height: (viewportSize.height + overscanPixels * 2) / viewport.scale,
	};
}
