import { ContextMenu } from '@base-ui/react/context-menu';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { CanvasDebugOverlay } from '@/components/CanvasDebugOverlay';
import { CanvasGrid } from '@/components/CanvasGrid';
import { CanvasGroupFrame } from '@/components/CanvasGroupFrame';
import { CanvasNodeView } from '@/components/CanvasNodeView';
import { CanvasSelectionBox } from '@/components/CanvasSelectionBox';
import { CanvasSurface } from '@/components/CanvasSurface';
import { CanvasContextMenu } from '@/components/context-menu/CanvasContextMenu';
import { CanvasToolbar } from '@/components/toolbar/CanvasToolbar';
import { useCanvasCommands } from '@/hooks/useCanvasCommands';
import { useCanvasContextMenu } from '@/hooks/useCanvasContextMenu';
import { useCanvasDocument } from '@/hooks/useCanvasDocument';
import { useCanvasInteractions } from '@/hooks/useCanvasInteractions';
import { useCanvasKeyboard } from '@/hooks/useCanvasKeyboard';
import { useCanvasSelection } from '@/hooks/useCanvasSelection';
import { useCanvasTextEditHistory } from '@/hooks/useCanvasTextEditHistory';
import { useCanvasViewport } from '@/hooks/useCanvasViewport';
import { useCanvasViewportSize } from '@/hooks/useCanvasViewportSize';
import type { CanvasSpace } from '@/types/canvas-space.types';
import type { Point } from '@/types/geometry.types';
import { canNodesFitCanvas, getCanvasBounds } from '@/utils/canvas-space';
import { getCanvasDebugStats } from '@/utils/debug';
import { doRectsIntersect } from '@/utils/geometry';
import { getGridMetrics, SNAP_GRID_SIZE } from '@/utils/grid';
import { getLockedNodeIdSet } from '@/utils/lock';
import {
	getVisibleCanvasRect,
	NODE_CONTENT_ZOOM_THRESHOLD,
} from '@/utils/viewport';

const VIEWPORT_OVERSCAN_PIXELS = 160;

export function Canvas() {
	const canvasRef = useRef<HTMLDivElement | null>(null);
	const canvasViewportSize = useCanvasViewportSize(canvasRef);

	const documentController = useCanvasDocument();
	const { canvasDocument, canvasSpace, nodes, groups, setCanvasSpace } =
		documentController;
	const canvasBounds = useMemo(
		() => getCanvasBounds(canvasSpace),
		[canvasSpace],
	);

	const selectionController = useCanvasSelection({ nodes, groups });
	const {
		selectedNodeIds,
		selectedGroupIds,
		editingNodeId,
		selectedNodeIdSet,
		selectedGroupIdSet,
		selectedGroupNodeIdSet,
		effectiveSelectedNodeIds,
		setSelectedNodeIds,
		setSelectedGroupIds,
		setEditingNodeId,
	} = selectionController;

	const { commitPendingTextEdit } = useCanvasTextEditHistory({
		canvasDocument,
		editingNodeId,
		recordDocumentChange: documentController.recordDocumentChange,
	});

	const {
		viewport,
		setViewport,
		centerViewportOnOrigin,
		setViewportScale,
		fitViewportToBounds,
	} = useCanvasViewport({ canvasRef });

	const commands = useCanvasCommands({
		canvasRef,
		viewport,
		canvasBounds,
		documentController,
		selectionController,
		commitPendingTextEdit,
	});

	const [cursorCanvasPosition, setCursorCanvasPosition] =
		useState<Point | null>(null);
	const [isSnapEnabled, setIsSnapEnabled] = useState(false);
	const [isDebugEnabled, setIsDebugEnabled] = useState(false);
	const [isInfoOpen, setIsInfoOpen] = useState(false);

	const gridMetrics = getGridMetrics({ viewport });
	const showNodeContent = viewport.scale >= NODE_CONTENT_ZOOM_THRESHOLD;
	const lockedNodeIdSet = useMemo(
		() => getLockedNodeIdSet(nodes, groups),
		[nodes, groups],
	);
	const isSelectionLocked = useMemo(() => {
		if (selectedNodeIds.length === 0 && selectedGroupIds.length === 0) {
			return false;
		}

		return (
			selectedNodeIds.every(
				(nodeId) => nodes.find((node) => node.id === nodeId)?.isLocked,
			) &&
			selectedGroupIds.every(
				(groupId) => groups.find((group) => group.id === groupId)?.isLocked,
			)
		);
	}, [groups, nodes, selectedGroupIds, selectedNodeIds]);

	useEffect(() => {
		if (showNodeContent || editingNodeId === null) {
			return;
		}

		commands.stopNodeEditing();
	}, [commands.stopNodeEditing, editingNodeId, showNodeContent]);

	const contextMenu = useCanvasContextMenu({
		canvasRef,
		viewport,
		commands,
		selectionController,
	});

	const toggleDebug = useCallback(() => {
		setIsDebugEnabled((currentValue) => !currentValue);
	}, []);

	const toggleInfo = useCallback(() => {
		setIsInfoOpen((currentValue) => !currentValue);
	}, []);

	const toggleSnap = useCallback(() => {
		setIsSnapEnabled((currentValue) => !currentValue);
	}, []);
	const isCanvasSpaceAvailable = useCallback(
		(space: CanvasSpace) => canNodesFitCanvas(nodes, space),
		[nodes],
	);
	const fitCanvas = useCallback(() => {
		if (canvasBounds) {
			fitViewportToBounds(canvasBounds);
		}
	}, [canvasBounds, fitViewportToBounds]);
	const changeCanvasSpace = useCallback(
		(space: CanvasSpace) => {
			commitPendingTextEdit();
			setEditingNodeId(null);
			setCanvasSpace(space);
		},
		[commitPendingTextEdit, setCanvasSpace, setEditingNodeId],
	);
	const zoomBy = useCallback(
		(scaleDelta: number) => {
			setViewportScale((currentScale) => currentScale + scaleDelta);
		},
		[setViewportScale],
	);

	const { isSpacePressed } = useCanvasKeyboard({
		moveDistance: isSnapEnabled ? SNAP_GRID_SIZE : 5,
		shiftMoveDistance: isSnapEnabled ? SNAP_GRID_SIZE * 2 : 20,
		onCenterViewport: centerViewportOnOrigin,
		onCreateLinkNode: commands.createLinkNodeAtCanvasCenter,
		onCreateTextNode: commands.createTextNodeAtCanvasCenter,
		onDelete: contextMenu.deleteSelection,
		onDuplicate: contextMenu.duplicateSelection,
		onMoveSelection: commands.moveSelectedNodes,
		onUndo: commands.undoDocument,
		onRedo: commands.redoDocument,
		onGroup: commands.groupSelectedNodes,
		onToggleDebug: toggleDebug,
		onToggleInfo: toggleInfo,
		onToggleSnap: toggleSnap,
		onToggleLockSelection: commands.toggleSelectedElementsLock,
		onUngroup: commands.ungroupSelectedGroups,
		onZoomBy: zoomBy,
	});

	const {
		interaction,
		selectionRect,
		dropTargetGroupId,
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
		canvasDocument,
		canvasBounds,
		groups,
		nodes,
		selectedNodeIds,
		lockedNodeIdSet,
		viewport,
		isSpacePressed,
		isSnapEnabled,
		gridSize: SNAP_GRID_SIZE,
		setNodes: documentController.replaceNodes,
		commitDocument: documentController.commitDocument,
		recordDocumentChange: documentController.recordDocumentChange,
		setSelectedNodeIds,
		selectedGroupIds,
		setSelectedGroupIds,
		setViewport,
		setEditingNodeId,
		setCursorCanvasPosition,
	});

	const orderedNodes = useMemo(
		() =>
			[...nodes].sort((leftNode, rightNode) => {
				const leftSelected = selectedNodeIdSet.has(leftNode.id) ? 1 : 0;
				const rightSelected = selectedNodeIdSet.has(rightNode.id) ? 1 : 0;

				return leftSelected - rightSelected;
			}),
		[nodes, selectedNodeIdSet],
	);
	const retainedNodeIdSet = useMemo(() => {
		const retainedNodeIds = new Set<string>();

		if (editingNodeId !== null) {
			retainedNodeIds.add(editingNodeId);
		}

		if (interaction.type === 'dragging') {
			for (const nodeId of interaction.nodeIds) {
				retainedNodeIds.add(nodeId);
			}
		} else if (interaction.type === 'resizing') {
			retainedNodeIds.add(interaction.nodeId);
		}

		return retainedNodeIds;
	}, [editingNodeId, interaction]);
	const viewportCanvasRect = useMemo(
		() => getVisibleCanvasRect(viewport, canvasViewportSize),
		[canvasViewportSize, viewport],
	);
	const renderingCanvasRect = useMemo(
		() =>
			getVisibleCanvasRect(
				viewport,
				canvasViewportSize,
				VIEWPORT_OVERSCAN_PIXELS,
			),
		[canvasViewportSize, viewport],
	);
	const renderedNodes = useMemo(
		() =>
			orderedNodes.filter(
				(node) =>
					retainedNodeIdSet.has(node.id) ||
					doRectsIntersect(node, renderingCanvasRect),
			),
		[orderedNodes, retainedNodeIdSet, renderingCanvasRect],
	);
	const debugStats = useMemo(
		() =>
			isDebugEnabled
				? getCanvasDebugStats({
						nodes,
						renderedNodes,
						viewportRect: viewportCanvasRect,
						renderingRect: renderingCanvasRect,
						totalGroupCount: groups.length,
						selectedNodeCount: selectedNodeIds.length,
						selectedGroupCount: selectedGroupIds.length,
						affectedNodeCount: effectiveSelectedNodeIds.length,
					})
				: null,
		[
			effectiveSelectedNodeIds.length,
			groups.length,
			isDebugEnabled,
			nodes,
			renderedNodes,
			renderingCanvasRect,
			selectedGroupIds.length,
			selectedNodeIds.length,
			viewportCanvasRect,
		],
	);

	return (
		<ContextMenu.Root
			onOpenChange={contextMenu.setIsOpen}
			open={contextMenu.isOpen}
		>
			<ContextMenu.Trigger
				aria-label="Canvas workspace"
				className="relative size-full touch-none overflow-hidden bg-canvas"
				data-canvas-space={canvasSpace.kind}
				role="application"
				ref={canvasRef}
				onPointerDown={handleCanvasPointerDown}
				onPointerMove={handleCanvasPointerMove}
				onPointerUp={handleCanvasPointerUp}
				onPointerCancel={handleCanvasPointerCancel}
				onContextMenu={contextMenu.handleContextMenu}
				onPointerLeave={() => {
					setCursorCanvasPosition(null);
				}}
				style={{
					cursor: isSpacePressed
						? interaction.type === 'panning'
							? 'grabbing'
							: 'grab'
						: 'crosshair',
				}}
			>
				{canvasBounds ? null : (
					<CanvasGrid
						visibleGridSize={gridMetrics.visibleGridSize}
						offsetX={gridMetrics.offsetX}
						offsetY={gridMetrics.offsetY}
					/>
				)}

				<div
					className="absolute left-0 top-0 origin-top-left"
					data-canvas-viewport
					style={{
						transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
					}}
				>
					{canvasBounds ? (
						<CanvasSurface
							bounds={canvasBounds}
							gridSize={gridMetrics.canvasGridSize}
						/>
					) : null}
					{groups.map((group) => (
						<CanvasGroupFrame
							key={group.id}
							group={group}
							nodes={nodes}
							isSelected={selectedGroupIdSet.has(group.id)}
							isDragging={
								interaction.type === 'dragging' &&
								selectedGroupIdSet.has(group.id)
							}
							isDropTarget={dropTargetGroupId === group.id}
							onPointerDown={handleGroupPointerDown}
							onElementChange={registerGroupElement}
						/>
					))}

					{renderedNodes.map((node) => (
						<CanvasNodeView
							key={node.id}
							node={node}
							isPositionLocked={lockedNodeIdSet.has(node.id)}
							isSelected={
								selectedNodeIdSet.has(node.id) &&
								!selectedGroupNodeIdSet.has(node.id)
							}
							isEditing={editingNodeId === node.id}
							showContent={showNodeContent}
							isDragging={
								interaction.type === 'dragging' &&
								interaction.nodeIds.includes(node.id)
							}
							onPointerDown={handleNodePointerDown}
							onResizePointerDown={handleResizePointerDown}
							onStartEditing={commands.startNodeEditing}
							onStopEditing={commands.stopNodeEditing}
							onTextChange={commands.updateNodeText}
							onLinkChange={commands.updateLinkNode}
							onElementChange={registerNodeElement}
						/>
					))}

					<CanvasSelectionBox rect={selectionRect} />
				</div>

				<CanvasToolbar
					canvasSpace={canvasSpace}
					isDebugEnabled={isDebugEnabled}
					isInfoOpen={isInfoOpen}
					isSnapEnabled={isSnapEnabled}
					zoom={viewport.scale}
					canRedo={documentController.canRedo}
					canUndo={documentController.canUndo}
					onCenterViewport={centerViewportOnOrigin}
					onCanvasSpaceChange={changeCanvasSpace}
					onFitCanvas={fitCanvas}
					isCanvasSpaceAvailable={isCanvasSpaceAvailable}
					onInfoOpenChange={setIsInfoOpen}
					onRedo={commands.redoDocument}
					onToggleDebug={toggleDebug}
					onToggleSnap={toggleSnap}
					onUndo={commands.undoDocument}
					onZoomChange={setViewportScale}
					onCreateTextNode={commands.createTextNodeAtCanvasCenter}
					onCreateLinkNode={commands.createLinkNodeAtCanvasCenter}
				/>

				{debugStats ? (
					<CanvasDebugOverlay
						position={cursorCanvasPosition}
						stats={debugStats}
						zoom={viewport.scale}
						interactionType={interaction.type}
						showNodeContent={showNodeContent}
					/>
				) : null}
			</ContextMenu.Trigger>

			<CanvasContextMenu
				canGroup={
					effectiveSelectedNodeIds.length > 1 &&
					effectiveSelectedNodeIds.every(
						(nodeId) => !lockedNodeIdSet.has(nodeId),
					)
				}
				canUngroup={selectedGroupIds.length > 0}
				isSelectionMenu={contextMenu.isSelectionMenu}
				isSelectionLocked={isSelectionLocked}
				isSnapEnabled={isSnapEnabled}
				selectionCount={effectiveSelectedNodeIds.length}
				onCenterViewport={centerViewportOnOrigin}
				onCreateLinkNode={contextMenu.createLinkNode}
				onCreateTextNode={contextMenu.createTextNode}
				onDelete={contextMenu.deleteSelection}
				onDuplicate={contextMenu.duplicateSelection}
				onGroup={commands.groupSelectedNodes}
				onToggleLock={commands.toggleSelectedElementsLock}
				onToggleSnap={toggleSnap}
				onUngroup={commands.ungroupSelectedGroups}
			/>
		</ContextMenu.Root>
	);
}
