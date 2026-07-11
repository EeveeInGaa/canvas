import { clamp } from '@/canvas/utils/math.ts';

export function clampScale(scale: number): number {
	return clamp(scale, 0.25, 3);
}
