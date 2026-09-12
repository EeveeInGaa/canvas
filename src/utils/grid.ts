import type { Viewport } from '../types/viewport.types.ts';

export type GridMetrics = {
	visibleGridSize: number;
	offsetX: number;
	offsetY: number;
};

type GetGridMetricsOptions = {
	viewport: Viewport;
	baseGridSize?: number;
	minVisibleGridSize?: number;
	maxVisibleGridSize?: number;
};

export const SNAP_GRID_SIZE = 24;

export function getGridMetrics({
	viewport,
	baseGridSize = SNAP_GRID_SIZE,
	minVisibleGridSize = 16,
	maxVisibleGridSize = 48,
}: GetGridMetricsOptions): GridMetrics {
	let canvasGridSize = baseGridSize;
	let visibleGridSize = canvasGridSize * viewport.scale;

	while (visibleGridSize < minVisibleGridSize) {
		canvasGridSize *= 2;
		visibleGridSize = canvasGridSize * viewport.scale;
	}

	while (visibleGridSize > maxVisibleGridSize) {
		canvasGridSize /= 2;
		visibleGridSize = canvasGridSize * viewport.scale;
	}

	return {
		visibleGridSize,
		offsetX: viewport.x % visibleGridSize,
		offsetY: viewport.y % visibleGridSize,
	};
}

export function snapValueToGrid(value: number, gridSize: number): number {
	return Math.round(value / gridSize) * gridSize;
}
