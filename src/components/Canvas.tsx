import { ContextMenu } from '@base-ui/react/context-menu';
import { useCallback, useMemo, useRef, useState } from 'react';

import { CanvasContextMenu } from '@/components/CanvasContextMenu';
import { CanvasDebugOverlay } from '@/components/CanvasDebugOverlay';
import { CanvasGrid } from '@/components/CanvasGrid';
import { CanvasGroupFrame } from '@/components/CanvasGroupFrame';
import { CanvasNodeView } from '@/components/CanvasNodeView';
import { CanvasSelectionBox } from '@/components/CanvasSelectionBox';
import { CanvasToolbar } from '@/components/CanvasToolbar';
import { useCanvasCommands } from '@/hooks/useCanvasCommands';
import { useCanvasContextMenu } from '@/hooks/useCanvasContextMenu';
import { useCanvasDocument } from '@/hooks/useCanvasDocument';
import { useCanvasInteractions } from '@/hooks/useCanvasInteractions';
import { useCanvasKeyboard } from '@/hooks/useCanvasKeyboard';
import { useCanvasSelection } from '@/hooks/useCanvasSelection';
import { useCanvasTextEditHistory } from '@/hooks/useCanvasTextEditHistory';
import { useCanvasViewport } from '@/hooks/useCanvasViewport';
import type { Point } from '@/types/geometry.types';
import { getGridMetrics, SNAP_GRID_SIZE } from '@/utils/grid';

export function Canvas() {
	const canvasRef = useRef<HTMLDivElement | null>(null);

	const documentController = useCanvasDocument();
	const { canvasDocument, nodes, groups } = documentController;

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

	const { viewport, setViewport, centerViewportOnOrigin } = useCanvasViewport({
		canvasRef,
	});

	const commands = useCanvasCommands({
		canvasRef,
		viewport,
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
		onUngroup: commands.ungroupSelectedGroups,
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
		groups,
		nodes,
		selectedNodeIds,
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

	return (
		<ContextMenu.Root
			onOpenChange={contextMenu.setIsOpen}
			open={contextMenu.isOpen}
		>
			<ContextMenu.Trigger
				aria-label="Canvas workspace"
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

					{orderedNodes.map((node) => (
						<CanvasNodeView
							key={node.id}
							node={node}
							isSelected={
								selectedNodeIdSet.has(node.id) &&
								!selectedGroupNodeIdSet.has(node.id)
							}
							isEditing={editingNodeId === node.id}
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
					isDebugEnabled={isDebugEnabled}
					isInfoOpen={isInfoOpen}
					isSnapEnabled={isSnapEnabled}
					canRedo={documentController.canRedo}
					canUndo={documentController.canUndo}
					onCenterViewport={centerViewportOnOrigin}
					onInfoOpenChange={setIsInfoOpen}
					onRedo={commands.redoDocument}
					onToggleDebug={toggleDebug}
					onToggleSnap={toggleSnap}
					onUndo={commands.undoDocument}
					onCreateTextNode={commands.createTextNodeAtCanvasCenter}
					onCreateLinkNode={commands.createLinkNodeAtCanvasCenter}
				/>

				{isDebugEnabled && (
					<CanvasDebugOverlay position={cursorCanvasPosition} />
				)}
			</ContextMenu.Trigger>

			<CanvasContextMenu
				canGroup={effectiveSelectedNodeIds.length > 1}
				canUngroup={selectedGroupIds.length > 0}
				isSelectionMenu={contextMenu.isSelectionMenu}
				isSnapEnabled={isSnapEnabled}
				selectionCount={effectiveSelectedNodeIds.length}
				onCenterViewport={centerViewportOnOrigin}
				onCreateLinkNode={contextMenu.createLinkNode}
				onCreateTextNode={contextMenu.createTextNode}
				onDelete={contextMenu.deleteSelection}
				onDuplicate={contextMenu.duplicateSelection}
				onGroup={commands.groupSelectedNodes}
				onToggleSnap={toggleSnap}
				onUngroup={commands.ungroupSelectedGroups}
			/>
		</ContextMenu.Root>
	);
}
