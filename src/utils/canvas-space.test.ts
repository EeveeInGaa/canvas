import { describe, expect, it } from 'vitest';

import type { CanvasNode } from '@/types/canvas-node.types';
import {
	CanvasOrientation,
	CanvasSizePreset,
} from '@/types/canvas-space.types';
import {
	getCanvasBounds,
	getConstrainedMovementDelta,
	isRectInsideBounds,
} from '@/utils/canvas-space';

const node: CanvasNode = {
	id: 'node',
	isLocked: false,
	type: 'text',
	x: -50,
	y: -40,
	width: 100,
	height: 80,
	text: '',
};

describe('canvas bounds', () => {
	it('centers a preset around the world origin', () => {
		const bounds = getCanvasBounds({
			kind: 'bounded',
			preset: CanvasSizePreset.Letter,
			orientation: CanvasOrientation.Portrait,
		});

		expect(bounds).toEqual({ x: -408, y: -528, width: 816, height: 1056 });
	});

	it('checks complete rectangles rather than only their origin', () => {
		const bounds = { x: 0, y: 0, width: 200, height: 200 };

		expect(
			isRectInsideBounds({ x: 100, y: 100, width: 100, height: 100 }, bounds),
		).toBe(true);
		expect(
			isRectInsideBounds({ x: 101, y: 100, width: 100, height: 100 }, bounds),
		).toBe(false);
	});

	it('clamps a movement delta while preserving the node dimensions', () => {
		expect(
			getConstrainedMovementDelta(
				[node],
				new Set([node.id]),
				{ x: 500, y: -500 },
				{ x: -100, y: -100, width: 200, height: 200 },
			),
		).toEqual({ x: 50, y: -60 });
	});
});
