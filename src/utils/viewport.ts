import { clamp } from '@/utils/math.ts';

export const NODE_CONTENT_ZOOM_THRESHOLD = 0.6;

export function clampScale(scale: number): number {
	return clamp(scale, 0.25, 3);
}
