import { describe, expect, it } from 'vitest';

import { getVisibleCanvasRect } from '@/utils/viewport';

describe('getVisibleCanvasRect', () => {
	it('converts the screen viewport and overscan into canvas coordinates', () => {
		expect(
			getVisibleCanvasRect(
				{ x: 100, y: 50, scale: 2 },
				{ width: 800, height: 600 },
				160,
			),
		).toEqual({
			x: -130,
			y: -105,
			width: 560,
			height: 460,
		});
	});
});
