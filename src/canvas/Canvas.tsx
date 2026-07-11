import { useCallback, useMemo, useRef, useState } from 'react';

import { CanvasDebugOverlay } from '@/canvas/components/CanvasDebugOverlay';
import { CanvasGrid } from '@/canvas/components/CanvasGrid';
import { CanvasNodeView } from '@/canvas/components/CanvasNodeView';
import { CanvasSelectionBox } from '@/canvas/components/CanvasSelectionBox';
import { CanvasToolbar } from '@/canvas/components/CanvasToolbar';
import { useCanvasInteractions } from '@/canvas/hooks/useCanvasInteractions';
import { useCanvasKeyboard } from '@/canvas/hooks/useCanvasKeyboard';
import { useCanvasViewport } from '@/canvas/hooks/useCanvasViewport';
import type { CanvasNode } from '@/canvas/types/canvas-node.types';
import type { Point } from '@/canvas/types/geometry.types';
import { screenToCanvas } from '@/canvas/utils/coordinates';
import { getGridMetrics } from '@/canvas/utils/grid';
import { createTextNode, duplicateNodes } from '@/canvas/utils/node';

export function Canvas() {
	const canvasRef = useRef<HTMLDivElement | null>(null);

	const [nodes, setNodes] = useState<CanvasNode[]>([]);
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

			setNodes((currentNodes) => [...currentNodes, newNode]);

			setSelectedNodeIds([newNode.id]);
			setEditingNodeId(newNode.id);
		},
		[viewport],
	);

	const updateNodeText = useCallback((nodeId: string, text: string) => {
		setNodes((currentNodes) =>
			currentNodes.map((node) =>
				node.id === nodeId
					? {
							...node,
							text,
						}
					: node,
			),
		);
	}, []);

	const deleteSelectedNodes = useCallback(() => {
		setNodes((currentNodes) =>
			currentNodes.filter((node) => !selectedNodeIdSet.has(node.id)),
		);

		setSelectedNodeIds([]);
		setEditingNodeId(null);
	}, [selectedNodeIdSet]);

	const duplicateSelectedNodes = useCallback(() => {
		const selectedNodes = nodes.filter((node) =>
			selectedNodeIdSet.has(node.id),
		);

		if (selectedNodes.length === 0) {
			return;
		}

		const duplicatedNodes = duplicateNodes(selectedNodes);

		setNodes((currentNodes) => [...currentNodes, ...duplicatedNodes]);

		setSelectedNodeIds(duplicatedNodes.map((node) => node.id));
		setEditingNodeId(null);
	}, [nodes, selectedNodeIdSet]);

	const startNodeEditing = useCallback((nodeId: string) => {
		setSelectedNodeIds([nodeId]);
		setEditingNodeId(nodeId);
	}, []);

	const stopNodeEditing = useCallback(() => {
		setEditingNodeId(null);
	}, []);

	const { isSpacePressed } = useCanvasKeyboard({
		onDelete: deleteSelectedNodes,
		onDuplicate: duplicateSelectedNodes,
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
		setNodes,
		setSelectedNodeIds,
		setViewport,
		setEditingNodeId,
		setCursorCanvasPosition,
	});

	return (
		<div
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
				onCenterViewport={centerViewportOnOrigin}
				onToggleDebug={() => {
					setIsDebugEnabled((currentValue) => !currentValue);
				}}
				onToggleSnap={() => {
					setIsSnapEnabled((currentValue) => !currentValue);
				}}
			/>

			{isDebugEnabled && <CanvasDebugOverlay position={cursorCanvasPosition} />}
		</div>
	);
}
