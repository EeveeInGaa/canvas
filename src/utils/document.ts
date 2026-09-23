import {
	type CanvasDocument,
	type CanvasGroup,
	type CanvasNode,
	CanvasNodeType,
} from '@/types/canvas-node.types';

export function areCanvasNodesEqual(
	leftNodes: CanvasNode[],
	rightNodes: CanvasNode[],
): boolean {
	if (leftNodes.length !== rightNodes.length) {
		return false;
	}

	return leftNodes.every((leftNode, index) => {
		const rightNode = rightNodes[index];

		if (!rightNode) {
			return false;
		}

		const sharedFieldsAreEqual =
			leftNode.id === rightNode.id &&
			leftNode.isLocked === rightNode.isLocked &&
			leftNode.type === rightNode.type &&
			leftNode.x === rightNode.x &&
			leftNode.y === rightNode.y &&
			leftNode.width === rightNode.width &&
			leftNode.height === rightNode.height;

		if (!sharedFieldsAreEqual) {
			return false;
		}

		if (
			leftNode.type === CanvasNodeType.Text &&
			rightNode.type === CanvasNodeType.Text
		) {
			return leftNode.text === rightNode.text;
		}

		if (
			leftNode.type === CanvasNodeType.Link &&
			rightNode.type === CanvasNodeType.Link
		) {
			return (
				leftNode.url === rightNode.url && leftNode.label === rightNode.label
			);
		}

		return false;
	});
}

function areCanvasGroupsEqual(
	leftGroups: CanvasGroup[],
	rightGroups: CanvasGroup[],
): boolean {
	if (leftGroups.length !== rightGroups.length) {
		return false;
	}

	return leftGroups.every((leftGroup, index) => {
		const rightGroup = rightGroups[index];

		if (!rightGroup) {
			return false;
		}

		return (
			leftGroup.id === rightGroup.id &&
			leftGroup.isLocked === rightGroup.isLocked &&
			leftGroup.nodeIds.length === rightGroup.nodeIds.length &&
			leftGroup.nodeIds.every(
				(nodeId, nodeIndex) => nodeId === rightGroup.nodeIds[nodeIndex],
			)
		);
	});
}

export function areCanvasDocumentsEqual(
	leftDocument: CanvasDocument,
	rightDocument: CanvasDocument,
): boolean {
	const spacesAreEqual =
		leftDocument.canvasSpace.kind === rightDocument.canvasSpace.kind &&
		(leftDocument.canvasSpace.kind === 'infinite' ||
			(rightDocument.canvasSpace.kind === 'bounded' &&
				leftDocument.canvasSpace.preset === rightDocument.canvasSpace.preset &&
				leftDocument.canvasSpace.orientation ===
					rightDocument.canvasSpace.orientation));

	return (
		spacesAreEqual &&
		areCanvasNodesEqual(leftDocument.nodes, rightDocument.nodes) &&
		areCanvasGroupsEqual(leftDocument.groups, rightDocument.groups)
	);
}

export function sanitizeGroups(
	groups: CanvasGroup[],
	nodes: CanvasNode[],
): CanvasGroup[] {
	const nodeIds = new Set(nodes.map((node) => node.id));

	let didChange = false;
	const sanitizedGroups: CanvasGroup[] = [];

	for (const group of groups) {
		const nextNodeIds = group.nodeIds.filter((nodeId) => nodeIds.has(nodeId));

		if (nextNodeIds.length < 2) {
			didChange = true;
			continue;
		}

		if (nextNodeIds.length === group.nodeIds.length) {
			sanitizedGroups.push(group);
			continue;
		}

		didChange = true;
		sanitizedGroups.push({ ...group, nodeIds: nextNodeIds });
	}

	return didChange ? sanitizedGroups : groups;
}

export function replaceCanvasDocumentNodes(
	canvasDocument: CanvasDocument,
	nodes: CanvasNode[],
): CanvasDocument {
	if (
		Object.is(nodes, canvasDocument.nodes) ||
		areCanvasNodesEqual(nodes, canvasDocument.nodes)
	) {
		return canvasDocument;
	}

	return {
		...canvasDocument,
		nodes,
		groups: sanitizeGroups(canvasDocument.groups, nodes),
	};
}
