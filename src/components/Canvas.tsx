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
import { useCanvasFocus } from '@/hooks/useCanvasFocus';
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
import {
	createGroupRectById,
	createNodeById,
	getGroupFrameRect,
} from '@/utils/group';
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
	const nodeById = useMemo(() => createNodeById(nodes), [nodes]);
	const groupRectById = useMemo(
		() => createGroupRectById(groups, nodeById),
		[groups, nodeById],
	);
	const lockedNodeIdSet = useMemo(
		() => getLockedNodeIdSet(nodes, groups),
		[nodes, groups],
	);
	const isSelectionLocked = useMemo(() => {
		if (selectedNodeIds.length === 0 && selectedGroupIds.length === 0) {
			return false;
		}

		return (
			selectedNodeIds.every((nodeId) => nodeById.get(nodeId)?.isLocked) &&
			selectedGroupIds.every(
				(groupId) => groups.find((group) => group.id === groupId)?.isLocked,
			)
		);
	}, [groups, nodeById, selectedGroupIds, selectedNodeIds]);

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
	const moveDistance = isSnapEnabled ? SNAP_GRID_SIZE : 5;
	const shiftMoveDistance = isSnapEnabled ? SNAP_GRID_SIZE * 2 : 20;

	const { isSpacePressed } = useCanvasKeyboard({
		moveDistance,
		shiftMoveDistance,
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

	const selectFocusedNode = useCallback(
		(nodeId: string) => {
			setSelectedNodeIds([nodeId]);
			setSelectedGroupIds([]);
		},
		[setSelectedGroupIds, setSelectedNodeIds],
	);
	const selectFocusedGroup = useCallback(
		(groupId: string) => {
			setSelectedNodeIds([]);
			setSelectedGroupIds([groupId]);
		},
		[setSelectedGroupIds, setSelectedNodeIds],
	);
	const focusController = useCanvasFocus({
		canvasRef,
		nodes,
		groups,
		moveDistance,
		shiftMoveDistance,
		onResizeNode: commands.resizeNode,
		onSelectNode: selectFocusedNode,
		onSelectGroup: selectFocusedGroup,
		onStartEditing: commands.startNodeEditing,
	});
	const stopNodeEditing = useCallback(
		(restoreNodeFocus = false) => {
			const nodeId = editingNodeId;

			commands.stopNodeEditing();

			if (restoreNodeFocus && nodeId) {
				requestAnimationFrame(() => {
					focusController.focusTarget({ type: 'node', id: nodeId });
				});
			}
		},
		[commands.stopNodeEditing, editingNodeId, focusController.focusTarget],
	);

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
		canvasBounds,
		groups,
		nodes,
		nodeById,
		groupRectById,
		selectedNodeIds,
		lockedNodeIdSet,
		viewport,
		isSpacePressed,
		isSnapEnabled,
		gridSize: SNAP_GRID_SIZE,
		commitDocument: documentController.commitDocument,
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
	const groupedNodeIdSet = useMemo(
		() => new Set(groups.flatMap((group) => group.nodeIds)),
		[groups],
	);
	const retainedNodeIdSet = useMemo(() => {
		const retainedNodeIds = new Set<string>();

		if (editingNodeId !== null) {
			retainedNodeIds.add(editingNodeId);
		}

		if (focusController.focusedTarget?.type === 'node') {
			retainedNodeIds.add(focusController.focusedTarget.id);
		}

		if (interaction.type === 'dragging') {
			for (const nodeId of interaction.nodeIds) {
				retainedNodeIds.add(nodeId);
			}
		} else if (interaction.type === 'resizing') {
			retainedNodeIds.add(interaction.nodeId);
		}

		return retainedNodeIds;
	}, [editingNodeId, focusController.focusedTarget, interaction]);
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
	const retainedGroupIdSet = useMemo(() => {
		const retainedGroupIds = new Set(selectedGroupIds);

		if (focusController.focusedTarget?.type === 'group') {
			retainedGroupIds.add(focusController.focusedTarget.id);
		}

		if (dropTargetGroupId) {
			retainedGroupIds.add(dropTargetGroupId);
		}

		const manipulatedNodeIds =
			interaction.type === 'dragging'
				? new Set(interaction.nodeIds)
				: interaction.type === 'resizing'
					? new Set([interaction.nodeId])
					: null;

		if (manipulatedNodeIds) {
			for (const group of groups) {
				if (group.nodeIds.some((nodeId) => manipulatedNodeIds.has(nodeId))) {
					retainedGroupIds.add(group.id);
				}
			}
		}

		return retainedGroupIds;
	}, [
		dropTargetGroupId,
		focusController.focusedTarget,
		groups,
		interaction,
		selectedGroupIds,
	]);
	const renderedGroups = useMemo(
		() =>
			groups.flatMap((group) => {
				const groupRect = groupRectById.get(group.id);

				return groupRect &&
					(retainedGroupIdSet.has(group.id) ||
						doRectsIntersect(getGroupFrameRect(groupRect), renderingCanvasRect))
					? [{ group, rect: groupRect }]
					: [];
			}),
		[groups, groupRectById, renderingCanvasRect, retainedGroupIdSet],
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
	const focusAnnouncement = useMemo(() => {
		const target = focusController.focusedTarget;

		if (!target) {
			return '';
		}

		if (target.type === 'group') {
			const group = groups.find((candidate) => candidate.id === target.id);

			if (!group) {
				return '';
			}

			const state = selectedGroupIdSet.has(group.id) ? 'selected' : 'focused';

			return `Node group ${state}. ${group.nodeIds.length} items. Position ${group.isLocked ? 'locked' : 'unlocked'}.`;
		}

		const node = nodeById.get(target.id);

		if (!node) {
			return '';
		}

		const state = selectedNodeIdSet.has(node.id) ? 'selected' : 'focused';

		return `${node.type === 'text' ? 'Text' : 'Link'} node ${state}. Position ${lockedNodeIdSet.has(node.id) ? 'locked' : 'unlocked'}.`;
	}, [
		focusController.focusedTarget,
		groups,
		lockedNodeIdSet,
		nodeById,
		selectedGroupIdSet,
		selectedNodeIdSet,
	]);

	return (
		<div className="relative size-full overflow-hidden bg-canvas">
			<ContextMenu.Root
				onOpenChange={contextMenu.setIsOpen}
				open={contextMenu.isOpen}
			>
				<ContextMenu.Trigger
					aria-describedby="canvas-keyboard-instructions"
					aria-label="Canvas workspace"
					className="absolute inset-0 touch-none overflow-hidden focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus"
					data-canvas-space={canvasSpace.kind}
					role="region"
					tabIndex={0}
					ref={canvasRef}
					onKeyDown={focusController.handleCanvasKeyDown}
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
						{renderedGroups.map(({ group, rect }) => (
							<CanvasGroupFrame
								key={group.id}
								group={group}
								rect={rect}
								isSelected={selectedGroupIdSet.has(group.id)}
								isDragging={
									interaction.type === 'dragging' &&
									selectedGroupIdSet.has(group.id)
								}
								isDropTarget={dropTargetGroupId === group.id}
								onPointerDown={handleGroupPointerDown}
								onElementChange={(groupId, element) => {
									registerGroupElement(groupId, element);
									focusController.registerTargetElement(
										{ type: 'group', id: groupId },
										element,
									);
								}}
								onFocus={(event, focusedGroup) =>
									focusController.handleTargetFocus(event, {
										type: 'group',
										id: focusedGroup.id,
									})
								}
								onBlur={focusController.handleTargetBlur}
								onKeyDown={(event, focusedGroup) =>
									focusController.handleTargetKeyDown(event, {
										type: 'group',
										id: focusedGroup.id,
									})
								}
							/>
						))}

						{renderedNodes.map((node) => (
							<CanvasNodeView
								key={node.id}
								node={node}
								isPositionLocked={lockedNodeIdSet.has(node.id)}
								isKeyboardTarget={!groupedNodeIdSet.has(node.id)}
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
								onStopEditing={stopNodeEditing}
								onTextChange={commands.updateNodeText}
								onLinkChange={commands.updateLinkNode}
								onElementChange={(nodeId, element) => {
									registerNodeElement(nodeId, element);

									if (!groupedNodeIdSet.has(nodeId)) {
										focusController.registerTargetElement(
											{ type: 'node', id: nodeId },
											element,
										);
									}
								}}
								onFocus={
									groupedNodeIdSet.has(node.id)
										? undefined
										: (event, focusedNode) =>
												focusController.handleTargetFocus(event, {
													type: 'node',
													id: focusedNode.id,
												})
								}
								onBlur={
									groupedNodeIdSet.has(node.id)
										? undefined
										: focusController.handleTargetBlur
								}
								onKeyDown={
									groupedNodeIdSet.has(node.id)
										? undefined
										: (event, focusedNode) =>
												focusController.handleTargetKeyDown(event, {
													type: 'node',
													id: focusedNode.id,
												})
								}
							/>
						))}

						<CanvasSelectionBox rect={selectionRect} />
					</div>

					<div
						aria-atomic="true"
						aria-live="polite"
						className="sr-only"
						role="status"
					>
						{focusAnnouncement}
					</div>
					<p className="sr-only" id="canvas-keyboard-instructions">
						Use an arrow key to enter the canvas. Use Control or Command plus an
						arrow key to move between items. Press Enter to edit a node, arrow
						keys to move the selection, Alt plus an arrow key to resize a node,
						and Delete to remove the selection. Press Tab to leave the canvas.
					</p>
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
		</div>
	);
}
