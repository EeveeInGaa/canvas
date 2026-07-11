import type { CanvasNode } from '../types/canvas-node.types';
import type { Point } from '../types/geometry.types';

export function createNodeId(): string {
	return crypto.randomUUID();
}

const DEFAULT_TEXT_NODE_WIDTH = 180;
const DEFAULT_TEXT_NODE_HEIGHT = 90;
const DUPLICATE_OFFSET = 24;
const MINIMUM_NODE_SIZE = 80;

export function createTextNode(position: Point): CanvasNode {
	return {
		id: crypto.randomUUID(),
		type: 'text',
		x: position.x - DEFAULT_TEXT_NODE_WIDTH / 2,
		y: position.y - DEFAULT_TEXT_NODE_HEIGHT / 2,
		width: DEFAULT_TEXT_NODE_WIDTH,
		height: DEFAULT_TEXT_NODE_HEIGHT,
		text: '',
	};
}

export function duplicateNodes(nodes: CanvasNode[]): CanvasNode[] {
	return nodes.map((node) => ({
		...node,
		id: crypto.randomUUID(),
		x: node.x + DUPLICATE_OFFSET,
		y: node.y + DUPLICATE_OFFSET,
	}));
}

export function clampNodeSize(value: number): number {
	return Math.max(MINIMUM_NODE_SIZE, value);
}
