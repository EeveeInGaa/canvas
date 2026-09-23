import { describe, expect, it } from 'vitest';

import {
	createRectFromPoints,
	doRectsIntersect,
	getBoundingRect,
} from '@/utils/geometry';

describe('createRectFromPoints', () => {
	it.each([
		[
			{ x: 10, y: 20 },
			{ x: 40, y: 60 },
		],
		[
			{ x: 40, y: 20 },
			{ x: 10, y: 60 },
		],
		[
			{ x: 10, y: 60 },
			{ x: 40, y: 20 },
		],
		[
			{ x: 40, y: 60 },
			{ x: 10, y: 20 },
		],
	])('normalizes a drag from %o to %o', (start, end) => {
		expect(createRectFromPoints(start, end)).toEqual({
			x: 10,
			y: 20,
			width: 30,
			height: 40,
		});
	});
});

describe('doRectsIntersect', () => {
	it('detects a partial overlap', () => {
		expect(
			doRectsIntersect(
				{ x: 0, y: 0, width: 20, height: 20 },
				{ x: 15, y: 15, width: 20, height: 20 },
			),
		).toBe(true);
	});

	it('does not treat touching edges as an intersection', () => {
		expect(
			doRectsIntersect(
				{ x: 0, y: 0, width: 20, height: 20 },
				{ x: 20, y: 0, width: 20, height: 20 },
			),
		).toBe(false);
	});
});

describe('getBoundingRect', () => {
	it('handles large collections without spread arguments', () => {
		const rects = Array.from({ length: 150_000 }, (_, index) => ({
			x: index,
			y: -index,
			width: 10,
			height: 20,
		}));

		expect(getBoundingRect(rects)).toEqual({
			x: 0,
			y: -149_999,
			width: 150_009,
			height: 150_019,
		});
	});
});
