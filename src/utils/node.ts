import {
	type CanvasNode,
	CanvasNodeType,
	type LinkCanvasNode,
	type TextCanvasNode,
} from '../types/canvas-node.types.ts';
import type { Point } from '../types/geometry.types.ts';

export function createNodeId(): string {
	return crypto.randomUUID();
}

const DUPLICATE_OFFSET = 24;
const MINIMUM_NODE_SIZE = 80;

export function createTextNode(position: Point): TextCanvasNode {
	const width = 180;
	const height = 90;

	return {
		id: createNodeId(),
		type: CanvasNodeType.Text,
		x: position.x - width / 2,
		y: position.y - height / 2,
		width,
		height,
		text: '',
	};
}

export function createLinkNode(position: Point): LinkCanvasNode {
	const width = 180;
	const height = 100;

	return {
		id: createNodeId(),
		type: CanvasNodeType.Link,
		x: position.x - width / 2,
		y: position.y - height / 2,
		width,
		height,
		url: '',
		label: '',
	};
}

export function duplicateNodes(nodes: CanvasNode[]): CanvasNode[] {
	return nodes.map((node) => ({
		...node,
		id: createNodeId(),
		x: node.x + DUPLICATE_OFFSET,
		y: node.y + DUPLICATE_OFFSET,
	}));
}

export function clampNodeSize(value: number): number {
	return Math.max(MINIMUM_NODE_SIZE, value);
}
