import { describe, expect, it } from 'vitest';

import { screenToCanvas } from '@/utils/coordinates';

describe('screenToCanvas', () => {
	it('accounts for the canvas offset, viewport translation, and zoom', () => {
		expect(
			screenToCanvas({
				screenX: 140,
				screenY: 80,
				canvasRect: new DOMRect(100, 50, 800, 600),
				viewport: { x: 20, y: -10, scale: 2 },
			}),
		).toEqual({ x: 10, y: 20 });
	});
});
