import { describe, expect, it } from 'vitest';

import { type CanvasNode, CanvasNodeType } from '@/types/canvas-node.types';
import {
	createLinkNode,
	createTextNode,
	moveNodes,
	offsetNodeFromOccupiedPosition,
	resizeNode,
} from '@/utils/node';

function withId(node: CanvasNode, id: string): CanvasNode {
	return { ...node, id };
}

describe('offsetNodeFromOccupiedPosition', () => {
	it('keeps an unoccupied target position', () => {
		const node = createTextNode({ x: 200, y: 150 });

		expect(offsetNodeFromOccupiedPosition(node, [])).toBe(node);
	});

	it('offsets nodes that target the same center across node types', () => {
		const existingNode = withId(createTextNode({ x: 200, y: 150 }), 'text');
		const node = withId(createLinkNode({ x: 200, y: 150 }), 'link');

		expect(offsetNodeFromOccupiedPosition(node, [existingNode])).toMatchObject({
			type: CanvasNodeType.Link,
			x: node.x + 24,
			y: node.y + 24,
		});
	});

	it('continues the offset cascade when earlier positions are occupied', () => {
		const firstNode = withId(createTextNode({ x: 200, y: 150 }), 'first');
		const secondNode = withId(
			{
				...createTextNode({ x: 200, y: 150 }),
				x: firstNode.x + 24,
				y: firstNode.y + 24,
			},
			'second',
		);
		const node = withId(createTextNode({ x: 200, y: 150 }), 'third');

		expect(
			offsetNodeFromOccupiedPosition(node, [firstNode, secondNode]),
		).toMatchObject({
			x: node.x + 48,
			y: node.y + 48,
		});
	});
});

describe('geometry updates', () => {
	const node = withId(createTextNode({ x: 200, y: 150 }), 'node');
	const nodes = [node];

	it('preserves node-array identity for zero-distance movement', () => {
		expect(moveNodes(nodes, new Set(['node']), { x: 0, y: 0 })).toBe(nodes);
	});

	it('preserves node-array identity for an unchanged resize', () => {
		expect(
			resizeNode(nodes, 'node', {
				width: node.width,
				height: node.height,
			}),
		).toBe(nodes);
	});
});
