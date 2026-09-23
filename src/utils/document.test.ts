import { describe, expect, it } from 'vitest';

import type { CanvasDocument } from '@/types/canvas-node.types';
import { INFINITE_CANVAS_SPACE } from '@/utils/canvas-space';
import { replaceCanvasDocumentNodes } from '@/utils/document';
import { createTextNode } from '@/utils/node';

describe('replaceCanvasDocumentNodes', () => {
	it('preserves document identity for a semantic no-op', () => {
		const node = { ...createTextNode({ x: 100, y: 100 }), id: 'node' };
		const canvasDocument: CanvasDocument = {
			canvasSpace: INFINITE_CANVAS_SPACE,
			nodes: [node],
			groups: [],
		};

		expect(replaceCanvasDocumentNodes(canvasDocument, [{ ...node }])).toBe(
			canvasDocument,
		);
	});
});
