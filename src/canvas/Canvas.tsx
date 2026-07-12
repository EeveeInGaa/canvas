import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { CanvasDebugOverlay } from '@/canvas/components/CanvasDebugOverlay';
import { CanvasGrid } from '@/canvas/components/CanvasGrid';
import { CanvasNodeView } from '@/canvas/components/CanvasNodeView';
import { CanvasSelectionBox } from '@/canvas/components/CanvasSelectionBox';
import { CanvasToolbar } from '@/canvas/components/CanvasToolbar';
import { useCanvasHistory } from '@/canvas/hooks/useCanvasHistory';
import { useCanvasInteractions } from '@/canvas/hooks/useCanvasInteractions';
import { useCanvasKeyboard } from '@/canvas/hooks/useCanvasKeyboard';
import { useCanvasViewport } from '@/canvas/hooks/useCanvasViewport';
import type { CanvasNode } from '@/canvas/types/canvas-node.types';
import type { Point } from '@/canvas/types/geometry.types';
import { screenToCanvas } from '@/canvas/utils/coordinates';
import { getGridMetrics } from '@/canvas/utils/grid';
import { createTextNode, duplicateNodes } from '@/canvas/utils/node';

function areCanvasNodesEqual(
	leftNodes: CanvasNode[],
	rightNodes: CanvasNode[],
) {
	if (leftNodes.length !== rightNodes.length) {
		return false;
	}

	return leftNodes.every((leftNode, index) => {
		const rightNode = rightNodes[index];

		return (
			rightNode &&
			leftNode.id === rightNode.id &&
			leftNode.type === rightNode.type &&
			leftNode.x === rightNode.x &&
			leftNode.y === rightNode.y &&
			leftNode.width === rightNode.width &&
			leftNode.height === rightNode.height &&
			leftNode.text === rightNode.text
		);
	});
}

export function Canvas() {
	const canvasRef = useRef<HTMLDivElement | null>(null);
	const textEditStartNodesRef = useRef<CanvasNode[] | null>(null);
	const previousEditingNodeIdRef = useRef<string | null>(null);

	const {
		value: nodes,
		commit: commitNodes,
		replace: replaceNodes,
		record: recordNodesChange,
		undo,
		redo,
		canUndo,
		canRedo,
	} = useCanvasHistory<CanvasNode[]>([]);

	const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
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

	const commitPendingTextEdit = useCallback(() => {
		const textEditStartNodes = textEditStartNodesRef.current;

		if (textEditStartNodes && !areCanvasNodesEqual(textEditStartNodes, nodes)) {
			recordNodesChange(textEditStartNodes);
		}

		textEditStartNodesRef.current = null;
	}, [nodes, recordNodesChange]);

	useEffect(() => {
		if (previousEditingNodeIdRef.current === editingNodeId) {
			return;
		}

		if (previousEditingNodeIdRef.current !== null) {
			commitPendingTextEdit();
		}

		textEditStartNodesRef.current = editingNodeId !== null ? nodes : null;
		previousEditingNodeIdRef.current = editingNodeId;
	}, [commitPendingTextEdit, editingNodeId, nodes]);

	useEffect(() => {
		const nodeIds = new Set(nodes.map((node) => node.id));

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
	}, [editingNodeId, nodes]);

	const createNodeAtPointer = useCallback(
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
	);

	const updateNodeText = useCallback(
		(nodeId: string, text: string) => {
			replaceNodes((currentNodes) =>
				currentNodes.map((node) =>
					node.id === nodeId
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

	const deleteSelectedNodes = useCallback(() => {
		commitNodes((currentNodes) => {
			const nextNodes = currentNodes.filter(
				(node) => !selectedNodeIdSet.has(node.id),
			);

			return nextNodes.length === currentNodes.length
				? currentNodes
				: nextNodes;
		});

		setSelectedNodeIds([]);
		setEditingNodeId(null);
	}, [commitNodes, selectedNodeIdSet]);

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
	});

	const {
		interaction,
		selectionRect,
		registerNodeElement,
		handleCanvasPointerDown,
		handleCanvasPointerMove,
		handleCanvasPointerUp,
		handleCanvasPointerCancel,
		handleNodePointerDown,
		handleResizePointerDown,
	} = useCanvasInteractions({
		canvasRef,
		nodes,
		selectedNodeIds,
		viewport,
		isSpacePressed,
		isSnapEnabled,
		gridSize: gridMetrics.canvasGridSize,
		setNodes: replaceNodes,
		commitNodes,
		recordNodesChange,
		setSelectedNodeIds,
		setViewport,
		setEditingNodeId,
		setCursorCanvasPosition,
	});

	return (
		<div
			aria-label="Canvas workspace"
			role="application"
			ref={canvasRef}
			onDoubleClick={createNodeAtPointer}
			onContextMenu={createNodeAtPointer}
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
							isSelected={selectedNodeIdSet.has(node.id)}
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
			/>

			{isDebugEnabled && <CanvasDebugOverlay position={cursorCanvasPosition} />}
		</div>
	);
}
