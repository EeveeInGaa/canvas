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

const NODE_OFFSET = 24;
const SAME_POSITION_TOLERANCE = 0.001;
const MINIMUM_NODE_SIZE = 80;

export function createTextNode(position: Point): TextCanvasNode {
	const width = 180;
	const height = 90;

	return {
		id: createNodeId(),
		isLocked: false,
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
		isLocked: false,
		type: CanvasNodeType.Link,
		x: position.x - width / 2,
		y: position.y - height / 2,
		width,
		height,
		url: '',
		label: '',
	};
}

function haveSameCenter(first: CanvasNode, second: CanvasNode): boolean {
	return (
		Math.abs(first.x + first.width / 2 - (second.x + second.width / 2)) <
			SAME_POSITION_TOLERANCE &&
		Math.abs(first.y + first.height / 2 - (second.y + second.height / 2)) <
			SAME_POSITION_TOLERANCE
	);
}

export function offsetNodeFromOccupiedPosition<T extends CanvasNode>(
	node: T,
	existingNodes: readonly CanvasNode[],
): T {
	let offset = 0;
	let positionedNode = node;

	while (
		existingNodes.some((existingNode) =>
			haveSameCenter(existingNode, positionedNode),
		)
	) {
		offset += NODE_OFFSET;
		positionedNode = {
			...node,
			x: node.x + offset,
			y: node.y + offset,
		};
	}

	return positionedNode;
}

export function duplicateNodes(nodes: CanvasNode[]): CanvasNode[] {
	return nodes.map((node) => ({
		...node,
		id: createNodeId(),
		x: node.x + NODE_OFFSET,
		y: node.y + NODE_OFFSET,
	}));
}

export function clampNodeSize(value: number): number {
	return Math.max(MINIMUM_NODE_SIZE, value);
}

export function moveNodes(
	nodes: CanvasNode[],
	nodeIds: ReadonlySet<string>,
	delta: Point,
): CanvasNode[] {
	if (delta.x === 0 && delta.y === 0) {
		return nodes;
	}

	return nodes.map((node) =>
		nodeIds.has(node.id)
			? { ...node, x: node.x + delta.x, y: node.y + delta.y }
			: node,
	);
}

export function resizeNode(
	nodes: CanvasNode[],
	nodeId: string,
	size: { width: number; height: number },
): CanvasNode[] {
	let didChange = false;
	const nextNodes = nodes.map((node) => {
		if (
			node.id !== nodeId ||
			(node.width === size.width && node.height === size.height)
		) {
			return node;
		}

		didChange = true;
		return { ...node, width: size.width, height: size.height };
	});

	return didChange ? nextNodes : nodes;
}
