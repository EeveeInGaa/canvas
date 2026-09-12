import { type RefObject, useCallback } from 'react';

import type { CanvasDocumentController } from '@/hooks/useCanvasDocument';
import type { CanvasSelectionController } from '@/hooks/useCanvasSelection';
import {
	type CanvasGroup,
	CanvasNodeType,
	type LinkNodeChanges,
} from '@/types/canvas-node.types';
import type { Point } from '@/types/geometry.types';
import type { Viewport } from '@/types/viewport.types';
import { screenToCanvas } from '@/utils/coordinates';
import { sanitizeGroups } from '@/utils/document';
import { createGroupId } from '@/utils/group';
import { createLinkNode, createTextNode, duplicateNodes } from '@/utils/node';

type UseCanvasCommandsParams = {
	canvasRef: RefObject<HTMLDivElement | null>;
	viewport: Viewport;
	documentController: CanvasDocumentController;
	selectionController: CanvasSelectionController;
	commitPendingTextEdit: () => void;
};

export function useCanvasCommands({
	canvasRef,
	viewport,
	documentController,
	selectionController,
	commitPendingTextEdit,
}: UseCanvasCommandsParams) {
	const {
		nodes,
		groups,
		commitDocument,
		commitNodes,
		replaceNodes,
		undo,
		redo,
	} = documentController;
	const {
		selectedGroupIds,
		effectiveSelectedNodeIdSet,
		effectiveSelectedNodeIds,
		setSelectedNodeIds,
		setSelectedGroupIds,
		setEditingNodeId,
	} = selectionController;

	const createNodeAtPosition = useCallback(
		(type: CanvasNodeType, position: Point) => {
			const newNode =
				type === CanvasNodeType.Text
					? createTextNode(position)
					: createLinkNode(position);

			commitNodes((currentNodes) => [...currentNodes, newNode]);
			setSelectedNodeIds([newNode.id]);
			setSelectedGroupIds([]);
			setEditingNodeId(newNode.id);
		},
		[commitNodes, setEditingNodeId, setSelectedGroupIds, setSelectedNodeIds],
	);

	const createNodeAtCanvasCenter = useCallback(
		(type: CanvasNodeType) => {
			const canvasElement = canvasRef.current;

			if (!canvasElement) {
				return;
			}

			const canvasRect = canvasElement.getBoundingClientRect();
			const position = screenToCanvas({
				screenX: canvasRect.left + canvasRect.width / 2,
				screenY: canvasRect.top + canvasRect.height / 2,
				canvasRect,
				viewport,
			});

			createNodeAtPosition(type, position);
		},
		[canvasRef, createNodeAtPosition, viewport],
	);

	const createTextNodeAtCanvasCenter = useCallback(() => {
		createNodeAtCanvasCenter(CanvasNodeType.Text);
	}, [createNodeAtCanvasCenter]);

	const createLinkNodeAtCanvasCenter = useCallback(() => {
		createNodeAtCanvasCenter(CanvasNodeType.Link);
	}, [createNodeAtCanvasCenter]);

	const updateNodeText = useCallback(
		(nodeId: string, text: string) => {
			replaceNodes((currentNodes) =>
				currentNodes.map((node) =>
					node.id === nodeId && node.type === CanvasNodeType.Text
						? { ...node, text }
						: node,
				),
			);
		},
		[replaceNodes],
	);

	const updateLinkNode = useCallback(
		(nodeId: string, changes: LinkNodeChanges) => {
			replaceNodes((currentNodes) =>
				currentNodes.map((node) =>
					node.id === nodeId && node.type === CanvasNodeType.Link
						? { ...node, ...changes }
						: node,
				),
			);
		},
		[replaceNodes],
	);

	const deleteSelectedNodes = useCallback(() => {
		if (effectiveSelectedNodeIdSet.size === 0) {
			return;
		}

		commitNodes((currentNodes) => {
			const nextNodes = currentNodes.filter(
				(node) => !effectiveSelectedNodeIdSet.has(node.id),
			);

			return nextNodes.length === currentNodes.length
				? currentNodes
				: nextNodes;
		});

		setSelectedNodeIds([]);
		setSelectedGroupIds([]);
		setEditingNodeId(null);
	}, [
		commitNodes,
		effectiveSelectedNodeIdSet,
		setEditingNodeId,
		setSelectedGroupIds,
		setSelectedNodeIds,
	]);

	const duplicateSelectedNodes = useCallback(() => {
		const selectedNodes = nodes.filter((node) =>
			effectiveSelectedNodeIdSet.has(node.id),
		);

		if (selectedNodes.length === 0) {
			return;
		}

		const duplicatedNodes = duplicateNodes(selectedNodes);

		commitNodes((currentNodes) => [...currentNodes, ...duplicatedNodes]);
		setSelectedNodeIds(duplicatedNodes.map((node) => node.id));
		setSelectedGroupIds([]);
		setEditingNodeId(null);
	}, [
		commitNodes,
		effectiveSelectedNodeIdSet,
		nodes,
		setEditingNodeId,
		setSelectedGroupIds,
		setSelectedNodeIds,
	]);

	const moveSelectedNodes = useCallback(
		(deltaX: number, deltaY: number) => {
			if (effectiveSelectedNodeIdSet.size === 0) {
				return false;
			}

			commitNodes((currentNodes) =>
				currentNodes.map((node) =>
					effectiveSelectedNodeIdSet.has(node.id)
						? {
								...node,
								x: node.x + deltaX,
								y: node.y + deltaY,
							}
						: node,
				),
			);

			return true;
		},
		[commitNodes, effectiveSelectedNodeIdSet],
	);

	const groupSelectedNodes = useCallback(() => {
		const existingNodeIds = new Set(nodes.map((node) => node.id));
		const groupNodeIds = effectiveSelectedNodeIds.filter((nodeId) =>
			existingNodeIds.has(nodeId),
		);

		if (groupNodeIds.length < 2) {
			return;
		}

		const groupedNodeIdSet = new Set(groupNodeIds);
		const newGroup: CanvasGroup = {
			id: createGroupId(),
			nodeIds: groupNodeIds,
		};

		commitDocument((currentDocument) => {
			const remainingGroups = sanitizeGroups(
				currentDocument.groups.map((group) => ({
					...group,
					nodeIds: group.nodeIds.filter(
						(nodeId) => !groupedNodeIdSet.has(nodeId),
					),
				})),
				currentDocument.nodes,
			);

			return {
				nodes: currentDocument.nodes,
				groups: [...remainingGroups, newGroup],
			};
		});

		setSelectedNodeIds([]);
		setSelectedGroupIds([newGroup.id]);
		setEditingNodeId(null);
	}, [
		commitDocument,
		effectiveSelectedNodeIds,
		nodes,
		setEditingNodeId,
		setSelectedGroupIds,
		setSelectedNodeIds,
	]);

	const ungroupSelectedGroups = useCallback(() => {
		if (selectedGroupIds.length === 0) {
			return;
		}

		const selectedGroupIdSet = new Set(selectedGroupIds);
		const ungroupedNodeIds = [
			...new Set(
				groups
					.filter((group) => selectedGroupIdSet.has(group.id))
					.flatMap((group) => group.nodeIds),
			),
		];

		commitDocument((currentDocument) => ({
			nodes: currentDocument.nodes,
			groups: currentDocument.groups.filter(
				(group) => !selectedGroupIdSet.has(group.id),
			),
		}));

		setSelectedNodeIds(ungroupedNodeIds);
		setSelectedGroupIds([]);
		setEditingNodeId(null);
	}, [
		commitDocument,
		groups,
		selectedGroupIds,
		setEditingNodeId,
		setSelectedGroupIds,
		setSelectedNodeIds,
	]);

	const startNodeEditing = useCallback(
		(nodeId: string) => {
			setSelectedNodeIds([nodeId]);
			setSelectedGroupIds([]);
			setEditingNodeId(nodeId);
		},
		[setEditingNodeId, setSelectedGroupIds, setSelectedNodeIds],
	);

	const stopNodeEditing = useCallback(() => {
		commitPendingTextEdit();
		setEditingNodeId(null);
	}, [commitPendingTextEdit, setEditingNodeId]);

	const undoDocument = useCallback(() => {
		commitPendingTextEdit();
		setEditingNodeId(null);
		undo();
	}, [commitPendingTextEdit, setEditingNodeId, undo]);

	const redoDocument = useCallback(() => {
		commitPendingTextEdit();
		setEditingNodeId(null);
		redo();
	}, [commitPendingTextEdit, redo, setEditingNodeId]);

	return {
		createNodeAtPosition,
		createNodeAtCanvasCenter,
		createTextNodeAtCanvasCenter,
		createLinkNodeAtCanvasCenter,
		updateNodeText,
		updateLinkNode,
		deleteSelectedNodes,
		duplicateSelectedNodes,
		moveSelectedNodes,
		groupSelectedNodes,
		ungroupSelectedGroups,
		startNodeEditing,
		stopNodeEditing,
		undoDocument,
		redoDocument,
	};
}

export type CanvasCommands = ReturnType<typeof useCanvasCommands>;
