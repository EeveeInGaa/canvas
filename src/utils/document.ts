import {
	type CanvasDocument,
	type CanvasGroup,
	type CanvasNode,
	CanvasNodeType,
} from '@/types/canvas-node.types';

function areCanvasNodesEqual(
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
	return (
		areCanvasNodesEqual(leftDocument.nodes, rightDocument.nodes) &&
		areCanvasGroupsEqual(leftDocument.groups, rightDocument.groups)
	);
}

export function sanitizeGroups(
	groups: CanvasGroup[],
	nodes: CanvasNode[],
): CanvasGroup[] {
	const nodeIds = new Set(nodes.map((node) => node.id));

	return groups
		.map((group) => ({
			...group,
			nodeIds: group.nodeIds.filter((nodeId) => nodeIds.has(nodeId)),
		}))
		.filter((group) => group.nodeIds.length > 1);
}
