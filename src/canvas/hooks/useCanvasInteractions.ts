import {
	type Dispatch,
	type PointerEvent as ReactPointerEvent,
	type RefObject,
	type SetStateAction,
	useCallback,
	useMemo,
	useRef,
	useState,
} from 'react';

import type { CanvasNode } from '@/canvas/types/canvas-node.types';
import type { Point, Rect } from '@/canvas/types/geometry.types';
import type { InteractionState } from '@/canvas/types/interaction.types';
import type { Viewport } from '@/canvas/types/viewport.types';
import { screenToCanvas } from '@/canvas/utils/coordinates';
import {
	createRectFromPoints,
	doRectsIntersect,
} from '@/canvas/utils/geometry';
import { snapValueToGrid } from '@/canvas/utils/grid';
import { clampNodeSize } from '@/canvas/utils/node';

type UseCanvasInteractionsParams = {
	canvasRef: RefObject<HTMLDivElement | null>;
	nodes: CanvasNode[];
	selectedNodeIds: string[];
	viewport: Viewport;
	isSpacePressed: boolean;
	isSnapEnabled: boolean;
	gridSize: number;
	setNodes: Dispatch<SetStateAction<CanvasNode[]>>;
	setSelectedNodeIds: Dispatch<SetStateAction<string[]>>;
	setViewport: Dispatch<SetStateAction<Viewport>>;
	setEditingNodeId: Dispatch<SetStateAction<string | null>>;
	setCursorCanvasPosition: Dispatch<SetStateAction<Point | null>>;
};

type UseCanvasInteractionsResult = {
	interaction: InteractionState;
	selectionRect: Rect | null;

	registerNodeElement: (nodeId: string, element: HTMLDivElement | null) => void;

	handleCanvasPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;

	handleCanvasPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void;

	handleCanvasPointerUp: (event: ReactPointerEvent<HTMLDivElement>) => void;

	handleCanvasPointerCancel: (event: ReactPointerEvent<HTMLDivElement>) => void;

	handleNodePointerDown: (
		event: ReactPointerEvent<HTMLDivElement>,
		node: CanvasNode,
	) => void;

	handleResizePointerDown: (
		event: ReactPointerEvent<HTMLDivElement>,
		node: CanvasNode,
	) => void;
};

type NodePosition = {
	nodeId: string;
	x: number;
	y: number;
};

const IDLE_INTERACTION: InteractionState = {
	type: 'idle',
};

export function useCanvasInteractions({
	canvasRef,
	nodes,
	selectedNodeIds,
	viewport,
	isSpacePressed,
	isSnapEnabled,
	gridSize,
	setNodes,
	setSelectedNodeIds,
	setViewport,
	setEditingNodeId,
	setCursorCanvasPosition,
}: UseCanvasInteractionsParams): UseCanvasInteractionsResult {
	const [interaction, setInteraction] =
		useState<InteractionState>(IDLE_INTERACTION);

	const nodeElementRefs = useRef(new Map<string, HTMLDivElement>());

	const pointerMoveFrameRef = useRef<number | null>(null);

	const latestDraggedNodePositionsRef = useRef<NodePosition[] | null>(null);

	const selectedNodeIdSet = useMemo(
		() => new Set(selectedNodeIds),
		[selectedNodeIds],
	);

	const selectionRect = useMemo<Rect | null>(() => {
		if (interaction.type !== 'selecting') {
			return null;
		}

		return createRectFromPoints(
			{
				x: interaction.startX,
				y: interaction.startY,
			},
			{
				x: interaction.currentX,
				y: interaction.currentY,
			},
		);
	}, [interaction]);

	const registerNodeElement = useCallback(
		(nodeId: string, element: HTMLDivElement | null) => {
			if (element) {
				nodeElementRefs.current.set(nodeId, element);
				return;
			}

			nodeElementRefs.current.delete(nodeId);
		},
		[],
	);

	const getCanvasPosition = useCallback(
		(clientX: number, clientY: number): Point | null => {
			const canvasElement = canvasRef.current;

			if (!canvasElement) {
				return null;
			}

			return screenToCanvas({
				screenX: clientX,
				screenY: clientY,
				canvasRect: canvasElement.getBoundingClientRect(),
				viewport,
			});
		},
		[canvasRef, viewport],
	);

	const updateSelectedNodesFromRect = useCallback(
		(rect: Rect) => {
			const nextSelectedNodeIds = nodes
				.filter((node) =>
					doRectsIntersect(rect, {
						x: node.x,
						y: node.y,
						width: node.width,
						height: node.height,
					}),
				)
				.map((node) => node.id);

			setSelectedNodeIds(nextSelectedNodeIds);
		},
		[nodes, setSelectedNodeIds],
	);

	const handleCanvasPointerDown = useCallback(
		(event: ReactPointerEvent<HTMLDivElement>) => {
			if (event.button !== 0) {
				return;
			}

			event.currentTarget.setPointerCapture(event.pointerId);

			setEditingNodeId(null);

			if (isSpacePressed) {
				setInteraction({
					type: 'panning',
					startPointerX: event.clientX,
					startPointerY: event.clientY,
					startViewportX: viewport.x,
					startViewportY: viewport.y,
				});

				return;
			}

			const canvasPosition = getCanvasPosition(event.clientX, event.clientY);

			if (!canvasPosition) {
				return;
			}

			if (!event.shiftKey) {
				setSelectedNodeIds([]);
			}

			setInteraction({
				type: 'selecting',
				startX: canvasPosition.x,
				startY: canvasPosition.y,
				currentX: canvasPosition.x,
				currentY: canvasPosition.y,
			});
		},
		[
			getCanvasPosition,
			isSpacePressed,
			setEditingNodeId,
			setSelectedNodeIds,
			viewport.x,
			viewport.y,
		],
	);

	const handleNodePointerDown = useCallback(
		(event: ReactPointerEvent<HTMLDivElement>, node: CanvasNode) => {
			if (event.button !== 0 || isSpacePressed) {
				return;
			}

			event.stopPropagation();

			event.currentTarget.setPointerCapture(event.pointerId);

			setEditingNodeId(null);

			let nextSelectedNodeIds = selectedNodeIds;

			if (event.metaKey) {
				nextSelectedNodeIds = selectedNodeIdSet.has(node.id)
					? selectedNodeIds.filter((nodeId) => nodeId !== node.id)
					: [...selectedNodeIds, node.id];

				setSelectedNodeIds(nextSelectedNodeIds);
			} else if (!selectedNodeIdSet.has(node.id)) {
				nextSelectedNodeIds = [node.id];
				setSelectedNodeIds(nextSelectedNodeIds);
			}

			if (!nextSelectedNodeIds.includes(node.id)) {
				return;
			}

			const startNodePositions = nodes
				.filter((currentNode) => nextSelectedNodeIds.includes(currentNode.id))
				.map((currentNode) => ({
					nodeId: currentNode.id,
					x: currentNode.x,
					y: currentNode.y,
				}));

			setInteraction({
				type: 'dragging',
				nodeIds: nextSelectedNodeIds,
				startPointerX: event.clientX,
				startPointerY: event.clientY,
				startNodePositions,
			});
		},
		[
			isSpacePressed,
			nodes,
			selectedNodeIds,
			selectedNodeIdSet,
			setEditingNodeId,
			setSelectedNodeIds,
		],
	);

	const handleResizePointerDown = useCallback(
		(event: ReactPointerEvent<HTMLDivElement>, node: CanvasNode) => {
			if (event.button !== 0) {
				return;
			}

			event.preventDefault();
			event.stopPropagation();

			event.currentTarget.setPointerCapture(event.pointerId);

			setSelectedNodeIds([node.id]);
			setEditingNodeId(null);

			setInteraction({
				type: 'resizing',
				nodeId: node.id,
				handle: 'bottom-right',
				startPointerX: event.clientX,
				startPointerY: event.clientY,
				startWidth: node.width,
				startHeight: node.height,
			});
		},
		[setEditingNodeId, setSelectedNodeIds],
	);

	const handleCanvasPointerMove = useCallback(
		(event: ReactPointerEvent<HTMLDivElement>) => {
			const canvasPosition = getCanvasPosition(event.clientX, event.clientY);

			setCursorCanvasPosition(canvasPosition);

			if (interaction.type === 'idle') {
				return;
			}

			if (interaction.type === 'panning') {
				const deltaX = event.clientX - interaction.startPointerX;

				const deltaY = event.clientY - interaction.startPointerY;

				setViewport((currentViewport) => ({
					...currentViewport,
					x: interaction.startViewportX + deltaX,
					y: interaction.startViewportY + deltaY,
				}));

				return;
			}

			if (interaction.type === 'selecting') {
				if (!canvasPosition) {
					return;
				}

				const nextInteraction: InteractionState = {
					...interaction,
					currentX: canvasPosition.x,
					currentY: canvasPosition.y,
				};

				setInteraction(nextInteraction);

				const rect = createRectFromPoints(
					{
						x: nextInteraction.startX,
						y: nextInteraction.startY,
					},
					{
						x: nextInteraction.currentX,
						y: nextInteraction.currentY,
					},
				);

				updateSelectedNodesFromRect(rect);

				return;
			}

			if (interaction.type === 'dragging') {
				const deltaX =
					(event.clientX - interaction.startPointerX) / viewport.scale;

				const deltaY =
					(event.clientY - interaction.startPointerY) / viewport.scale;

				const nextPositions = interaction.startNodePositions.map(
					(startPosition) => {
						const rawX = startPosition.x + deltaX;

						const rawY = startPosition.y + deltaY;

						return {
							nodeId: startPosition.nodeId,
							x: isSnapEnabled ? snapValueToGrid(rawX, gridSize) : rawX,
							y: isSnapEnabled ? snapValueToGrid(rawY, gridSize) : rawY,
						};
					},
				);

				latestDraggedNodePositionsRef.current = nextPositions;

				if (pointerMoveFrameRef.current !== null) {
					cancelAnimationFrame(pointerMoveFrameRef.current);
				}

				pointerMoveFrameRef.current = requestAnimationFrame(() => {
					for (const position of nextPositions) {
						const nodeElement = nodeElementRefs.current.get(position.nodeId);

						if (!nodeElement) {
							continue;
						}

						nodeElement.style.left = `${position.x}px`;

						nodeElement.style.top = `${position.y}px`;
					}

					pointerMoveFrameRef.current = null;
				});

				return;
			}

			if (interaction.type === 'resizing') {
				const deltaWidth =
					(event.clientX - interaction.startPointerX) / viewport.scale;

				const deltaHeight =
					(event.clientY - interaction.startPointerY) / viewport.scale;

				const rawWidth = clampNodeSize(interaction.startWidth + deltaWidth);

				const rawHeight = clampNodeSize(interaction.startHeight + deltaHeight);

				const width = isSnapEnabled
					? clampNodeSize(snapValueToGrid(rawWidth, gridSize))
					: rawWidth;

				const height = isSnapEnabled
					? clampNodeSize(snapValueToGrid(rawHeight, gridSize))
					: rawHeight;

				setNodes((currentNodes) =>
					currentNodes.map((node) =>
						node.id === interaction.nodeId
							? {
									...node,
									width,
									height,
								}
							: node,
					),
				);
			}
		},
		[
			getCanvasPosition,
			gridSize,
			interaction,
			isSnapEnabled,
			setCursorCanvasPosition,
			setNodes,
			setViewport,
			updateSelectedNodesFromRect,
			viewport.scale,
		],
	);

	const stopInteraction = useCallback(() => {
		if (
			interaction.type === 'dragging' &&
			latestDraggedNodePositionsRef.current
		) {
			const positionsByNodeId = new Map(
				latestDraggedNodePositionsRef.current.map((position) => [
					position.nodeId,
					position,
				]),
			);

			setNodes((currentNodes) =>
				currentNodes.map((node) => {
					const position = positionsByNodeId.get(node.id);

					if (!position) {
						return node;
					}

					return {
						...node,
						x: position.x,
						y: position.y,
					};
				}),
			);
		}

		if (pointerMoveFrameRef.current !== null) {
			cancelAnimationFrame(pointerMoveFrameRef.current);

			pointerMoveFrameRef.current = null;
		}

		latestDraggedNodePositionsRef.current = null;
		setInteraction(IDLE_INTERACTION);
	}, [interaction, setNodes]);

	const handleCanvasPointerUp = useCallback(
		(event: ReactPointerEvent<HTMLDivElement>) => {
			if (event.currentTarget.hasPointerCapture(event.pointerId)) {
				event.currentTarget.releasePointerCapture(event.pointerId);
			}

			stopInteraction();
		},
		[stopInteraction],
	);

	const handleCanvasPointerCancel = useCallback(
		(event: ReactPointerEvent<HTMLDivElement>) => {
			if (event.currentTarget.hasPointerCapture(event.pointerId)) {
				event.currentTarget.releasePointerCapture(event.pointerId);
			}

			stopInteraction();
		},
		[stopInteraction],
	);

	return {
		interaction,
		selectionRect,
		registerNodeElement,
		handleCanvasPointerDown,
		handleCanvasPointerMove,
		handleCanvasPointerUp,
		handleCanvasPointerCancel,
		handleNodePointerDown,
		handleResizePointerDown,
	};
}
