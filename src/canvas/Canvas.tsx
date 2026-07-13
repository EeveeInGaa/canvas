import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { CanvasDebugOverlay } from '@/canvas/components/CanvasDebugOverlay';
import { CanvasGrid } from '@/canvas/components/CanvasGrid';
import { CanvasGroupFrame } from '@/canvas/components/CanvasGroupFrame';
import { CanvasNodeView } from '@/canvas/components/CanvasNodeView';
import { CanvasSelectionBox } from '@/canvas/components/CanvasSelectionBox';
import { CanvasToolbar } from '@/canvas/components/CanvasToolbar';
import type { LinkNodeChanges } from '@/canvas/components/nodes/LinkNode.tsx';
import { useCanvasHistory } from '@/canvas/hooks/useCanvasHistory';
import { useCanvasInteractions } from '@/canvas/hooks/useCanvasInteractions';
import { useCanvasKeyboard } from '@/canvas/hooks/useCanvasKeyboard';
import { useCanvasViewport } from '@/canvas/hooks/useCanvasViewport';
import {
	type CanvasDocument,
	type CanvasGroup,
	type CanvasNode,
	CanvasNodeType,
} from '@/canvas/types/canvas-node.types';
import type { Point } from '@/canvas/types/geometry.types';
import { screenToCanvas } from '@/canvas/utils/coordinates';
import { getGridMetrics } from '@/canvas/utils/grid';
import { createGroupId } from '@/canvas/utils/group';
import {
	createLinkNode,
	createTextNode,
	duplicateNodes,
} from '@/canvas/utils/node';

function areCanvasNodesEqual(
	leftNodes: CanvasNode[],
	rightNodes: CanvasNode[],
) {
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
) {
	if (leftGroups.length !== rightGroups.length) {
		return false;
	}

	return leftGroups.every((leftGroup, index) => {
		const rightGroup = rightGroups[index];

		return (
			rightGroup &&
			leftGroup.id === rightGroup.id &&
			leftGroup.nodeIds.length === rightGroup.nodeIds.length &&
			leftGroup.nodeIds.every(
				(nodeId, nodeIndex) => nodeId === rightGroup.nodeIds[nodeIndex],
			)
		);
	});
}

function areCanvasDocumentsEqual(
	leftDocument: CanvasDocument,
	rightDocument: CanvasDocument,
) {
	return (
		areCanvasNodesEqual(leftDocument.nodes, rightDocument.nodes) &&
		areCanvasGroupsEqual(leftDocument.groups, rightDocument.groups)
	);
}

function sanitizeGroups(groups: CanvasGroup[], nodes: CanvasNode[]) {
	const nodeIds = new Set(nodes.map((node) => node.id));

	return groups
		.map((group) => ({
			...group,
			nodeIds: group.nodeIds.filter((nodeId) => nodeIds.has(nodeId)),
		}))
		.filter((group) => group.nodeIds.length > 1);
}

export function Canvas() {
	const canvasRef = useRef<HTMLDivElement | null>(null);
	const textEditStartDocumentRef = useRef<CanvasDocument | null>(null);
	const previousEditingNodeIdRef = useRef<string | null>(null);

	const {
		value: canvasDocument,
		commit: commitDocument,
		replace: replaceDocument,
		record: recordDocumentChange,
		undo,
		redo,
		canUndo,
		canRedo,
	} = useCanvasHistory<CanvasDocument>({
		nodes: [],
		groups: [],
	});

	const nodes = canvasDocument.nodes;
	const groups = canvasDocument.groups;

	const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
	const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
	const [editingNodeId, setEditingNodeId] = useState<string | null>(null);

	const [cursorCanvasPosition, setCursorCanvasPosition] =
		useState<Point | null>(null);

	const [isSnapEnabled, setIsSnapEnabled] = useState(false);
	const [isDebugEnabled, setIsDebugEnabled] = useState(false);

	const { viewport, setViewport, centerViewportOnOrigin } = useCanvasViewport({
		canvasRef,
	});

	const gridMetrics = getGridMetrics({
		viewport,
	});

	const selectedNodeIdSet = useMemo(
		() => new Set(selectedNodeIds),
		[selectedNodeIds],
	);

	const commitNodes = useCallback(
		(value: React.SetStateAction<CanvasNode[]>) => {
			commitDocument((currentDocument) => {
				const nextNodes =
					typeof value === 'function' ? value(currentDocument.nodes) : value;
				const nextGroups = sanitizeGroups(currentDocument.groups, nextNodes);

				return {
					nodes: nextNodes,
					groups: nextGroups,
				};
			});
		},
		[commitDocument],
	);

	const replaceNodes = useCallback(
		(value: React.SetStateAction<CanvasNode[]>) => {
			replaceDocument((currentDocument) => {
				const nextNodes =
					typeof value === 'function' ? value(currentDocument.nodes) : value;
				const nextGroups = sanitizeGroups(currentDocument.groups, nextNodes);

				return {
					nodes: nextNodes,
					groups: nextGroups,
				};
			});
		},
		[replaceDocument],
	);

	const commitPendingTextEdit = useCallback(() => {
		const textEditStartDocument = textEditStartDocumentRef.current;

		if (
			textEditStartDocument &&
			!areCanvasDocumentsEqual(textEditStartDocument, canvasDocument)
		) {
			recordDocumentChange(textEditStartDocument);
		}

		textEditStartDocumentRef.current = null;
	}, [canvasDocument, recordDocumentChange]);

	useEffect(() => {
		if (previousEditingNodeIdRef.current === editingNodeId) {
			return;
		}

		if (previousEditingNodeIdRef.current !== null) {
			commitPendingTextEdit();
		}

		textEditStartDocumentRef.current =
			editingNodeId !== null ? canvasDocument : null;
		previousEditingNodeIdRef.current = editingNodeId;
	}, [canvasDocument, commitPendingTextEdit, editingNodeId]);

	useEffect(() => {
		const nodeIds = new Set(nodes.map((node) => node.id));
		const groupIds = new Set(groups.map((group) => group.id));

		setSelectedNodeIds((currentSelectedNodeIds) => {
			const nextSelectedNodeIds = currentSelectedNodeIds.filter((nodeId) =>
				nodeIds.has(nodeId),
			);

			return nextSelectedNodeIds.length === currentSelectedNodeIds.length
				? currentSelectedNodeIds
				: nextSelectedNodeIds;
		});

		if (editingNodeId && !nodeIds.has(editingNodeId)) {
			setEditingNodeId(null);
		}

		if (selectedGroupId && !groupIds.has(selectedGroupId)) {
			setSelectedGroupId(null);
		}
	}, [editingNodeId, groups, nodes, selectedGroupId]);

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

			const newNode =
				type === CanvasNodeType.Text
					? createTextNode(position)
					: createLinkNode(position);

			commitNodes((currentNodes) => [...currentNodes, newNode]);

			setSelectedNodeIds([newNode.id]);
			setSelectedGroupId(null);
			setEditingNodeId(newNode.id);
		},
		[commitNodes, viewport],
	);
	/*const createNodeAtPointer = useCallback(
		(event: React.MouseEvent<HTMLDivElement>) => {
			event.preventDefault();

			const canvasElement = canvasRef.current;

			if (!canvasElement) {
				return;
			}

			const position = screenToCanvas({
				screenX: event.clientX,
				screenY: event.clientY,
				canvasRect: canvasElement.getBoundingClientRect(),
				viewport,
			});

			const newNode = createTextNode(position);

			commitNodes((currentNodes) => [...currentNodes, newNode]);

			setSelectedNodeIds([newNode.id]);
			setEditingNodeId(newNode.id);
		},
		[commitNodes, viewport],
	);*/

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
						? {
								...node,
								text,
							}
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
						? {
								...node,
								...changes,
							}
						: node,
				),
			);
		},
		[replaceNodes],
	);

	const deleteSelectedNodes = useCallback(() => {
		if (selectedNodeIds.length === 0) {
			return;
		}

		commitNodes((currentNodes) => {
			const nextNodes = currentNodes.filter(
				(node) => !selectedNodeIdSet.has(node.id),
			);

			return nextNodes.length === currentNodes.length
				? currentNodes
				: nextNodes;
		});

		setSelectedNodeIds([]);
		setSelectedGroupId(null);
		setEditingNodeId(null);
	}, [commitNodes, selectedNodeIds.length, selectedNodeIdSet]);

	const duplicateSelectedNodes = useCallback(() => {
		const selectedNodes = nodes.filter((node) =>
			selectedNodeIdSet.has(node.id),
		);

		if (selectedNodes.length === 0) {
			return;
		}

		const duplicatedNodes = duplicateNodes(selectedNodes);

		commitNodes((currentNodes) => [...currentNodes, ...duplicatedNodes]);

		setSelectedNodeIds(duplicatedNodes.map((node) => node.id));
		setEditingNodeId(null);
	}, [commitNodes, nodes, selectedNodeIdSet]);

	const groupSelectedNodes = useCallback(() => {
		const existingNodeIds = new Set(nodes.map((node) => node.id));

		const groupNodeIds = [...new Set(selectedNodeIds)].filter((nodeId) =>
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

		setSelectedNodeIds(groupNodeIds);
		setSelectedGroupId(newGroup.id);
		setEditingNodeId(null);
	}, [commitDocument, nodes, selectedNodeIds]);

	const ungroupSelectedGroup = useCallback(() => {
		if (!selectedGroupId) {
			return;
		}

		const selectedGroup = groups.find((group) => group.id === selectedGroupId);

		if (!selectedGroup) {
			setSelectedGroupId(null);
			return;
		}

		commitDocument((currentDocument) => ({
			nodes: currentDocument.nodes,
			groups: currentDocument.groups.filter(
				(group) => group.id !== selectedGroupId,
			),
		}));

		setSelectedNodeIds(selectedGroup.nodeIds);
		setSelectedGroupId(null);
		setEditingNodeId(null);
	}, [commitDocument, groups, selectedGroupId]);

	const startNodeEditing = useCallback((nodeId: string) => {
		setSelectedNodeIds([nodeId]);
		setEditingNodeId(nodeId);
	}, []);

	const stopNodeEditing = useCallback(() => {
		commitPendingTextEdit();
		setEditingNodeId(null);
	}, [commitPendingTextEdit]);

	const handleUndo = useCallback(() => {
		commitPendingTextEdit();
		setEditingNodeId(null);
		undo();
	}, [commitPendingTextEdit, undo]);

	const handleRedo = useCallback(() => {
		commitPendingTextEdit();
		setEditingNodeId(null);
		redo();
	}, [commitPendingTextEdit, redo]);

	const { isSpacePressed } = useCanvasKeyboard({
		onDelete: deleteSelectedNodes,
		onDuplicate: duplicateSelectedNodes,
		onUndo: handleUndo,
		onRedo: handleRedo,
		onGroup: groupSelectedNodes,
		onUngroup: ungroupSelectedGroup,
	});

	const {
		interaction,
		selectionRect,
		registerNodeElement,
		registerGroupElement,
		handleCanvasPointerDown,
		handleCanvasPointerMove,
		handleCanvasPointerUp,
		handleCanvasPointerCancel,
		handleNodePointerDown,
		handleGroupPointerDown,
		handleResizePointerDown,
	} = useCanvasInteractions({
		canvasRef,
		groups,
		nodes,
		selectedNodeIds,
		viewport,
		isSpacePressed,
		isSnapEnabled,
		gridSize: gridMetrics.canvasGridSize,
		setNodes: replaceNodes,
		commitNodes,
		recordDocumentChange,
		setSelectedNodeIds,
		setSelectedGroupId,
		setViewport,
		setEditingNodeId,
		setCursorCanvasPosition,
	});

	return (
		<div
			aria-label="Canvas workspace"
			role="application"
			ref={canvasRef}
			onPointerDown={handleCanvasPointerDown}
			onPointerMove={handleCanvasPointerMove}
			onPointerUp={handleCanvasPointerUp}
			onPointerCancel={handleCanvasPointerCancel}
			onPointerLeave={() => {
				setCursorCanvasPosition(null);
			}}
			style={{
				position: 'relative',
				width: '800px',
				height: '600px',
				overflow: 'hidden',
				border: '1px solid rgba(255,255,255,0.12)',
				borderRadius: 16,
				background: '#111318',
				cursor: isSpacePressed
					? interaction.type === 'panning'
						? 'grabbing'
						: 'grab'
					: 'crosshair',
				touchAction: 'none',
			}}
		>
			<CanvasGrid
				visibleGridSize={gridMetrics.visibleGridSize}
				offsetX={gridMetrics.offsetX}
				offsetY={gridMetrics.offsetY}
			/>

			<div
				style={{
					position: 'absolute',
					left: 0,
					top: 0,
					transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
					transformOrigin: '0 0',
				}}
			>
				{groups.map((group) => (
					<CanvasGroupFrame
						key={group.id}
						group={group}
						nodes={nodes}
						isSelected={selectedGroupId === group.id}
						isDragging={
							interaction.type === 'dragging' && selectedGroupId === group.id
						}
						onPointerDown={handleGroupPointerDown}
						onElementChange={registerGroupElement}
					/>
				))}
				{[...nodes]
					.sort((a, b) => {
						const aSelected = selectedNodeIdSet.has(a.id) ? 1 : 0;
						const bSelected = selectedNodeIdSet.has(b.id) ? 1 : 0;
						return aSelected - bSelected;
					})
					.map((node) => (
						<CanvasNodeView
							key={node.id}
							node={node}
							isSelected={
								selectedGroupId === null && selectedNodeIdSet.has(node.id)
							}
							isEditing={editingNodeId === node.id}
							isDragging={
								interaction.type === 'dragging' &&
								interaction.nodeIds.includes(node.id)
							}
							onPointerDown={handleNodePointerDown}
							onResizePointerDown={handleResizePointerDown}
							onStartEditing={startNodeEditing}
							onStopEditing={stopNodeEditing}
							onTextChange={updateNodeText}
							onLinkChange={updateLinkNode}
							onElementChange={registerNodeElement}
						/>
					))}

				<CanvasSelectionBox rect={selectionRect} />
			</div>

			<CanvasToolbar
				isDebugEnabled={isDebugEnabled}
				isSnapEnabled={isSnapEnabled}
				canRedo={canRedo}
				canUndo={canUndo}
				onCenterViewport={centerViewportOnOrigin}
				onRedo={handleRedo}
				onToggleDebug={() => {
					setIsDebugEnabled((currentValue) => !currentValue);
				}}
				onToggleSnap={() => {
					setIsSnapEnabled((currentValue) => !currentValue);
				}}
				onUndo={handleUndo}
				onCreateTextNode={createTextNodeAtCanvasCenter}
				onCreateLinkNode={createLinkNodeAtCanvasCenter}
			/>

			{isDebugEnabled && <CanvasDebugOverlay position={cursorCanvasPosition} />}
		</div>
	);
}
