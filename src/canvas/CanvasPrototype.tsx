import { useCallback, useEffect, useRef, useState } from 'react';
import type {
	CanvasNode,
	InteractionState,
	Viewport,
} from '@/canvas/Canvas.ts';
import {
	clampScale,
	clampSize,
	createId,
	screenToCanvas,
} from '@/canvas/canvas-fn.ts';

export function CanvasPrototype() {
	const canvasRef = useRef<HTMLDivElement | null>(null);
	const isSpacePressedRef = useRef(false);
	const [nodes, setNodes] = useState<CanvasNode[]>([]);
	const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
	const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
	const [interaction, setInteraction] = useState<InteractionState>({
		type: 'idle',
	});
	const [viewport, setViewport] = useState<Viewport>({
		x: 0,
		y: 0,
		scale: 1,
	});
	const selectionBox =
		interaction.type === 'selecting'
			? {
					x: Math.min(interaction.startX, interaction.currentX),
					y: Math.min(interaction.startY, interaction.currentY),
					width: Math.abs(interaction.currentX - interaction.startX),
					height: Math.abs(interaction.currentY - interaction.startY),
				}
			: null;
	const selectedNodeIdSet = new Set(selectedNodeIds);
	const baseGridSize = 24;
	const minVisibleGridSize = 16;
	const maxVisibleGridSize = 48;

	let canvasGridSize = baseGridSize;
	let visibleGridSize = canvasGridSize * viewport.scale;

	while (visibleGridSize < minVisibleGridSize) {
		canvasGridSize *= 2;
		visibleGridSize = canvasGridSize * viewport.scale;
	}

	while (visibleGridSize > maxVisibleGridSize) {
		canvasGridSize /= 2;
		visibleGridSize = canvasGridSize * viewport.scale;
	}

	const gridOffsetX = viewport.x % visibleGridSize;
	const gridOffsetY = viewport.y % visibleGridSize;

	const createTextNode = useCallback(
		(event: React.MouseEvent<HTMLDivElement>) => {
			event.preventDefault();

			const canvasRect = event.currentTarget.getBoundingClientRect();
			const canvasPosition = screenToCanvas({
				screenX: event.clientX,
				screenY: event.clientY,
				canvasRect,
				viewport,
			});

			const defaultWidth = 180;
			const defaultHeight = 90;

			const newNode: CanvasNode = {
				id: createId(),
				type: 'text',
				x: canvasPosition.x - defaultWidth / 2,
				y: canvasPosition.y - defaultHeight / 2,
				width: defaultWidth,
				height: defaultHeight,
				text: '',
			};

			setNodes((currentNodes) => [...currentNodes, newNode]);
			setSelectedNodeIds([newNode.id])
		},
		[viewport],
	);

	const updateNodeText = useCallback((nodeId: string, text: string) => {
		setNodes((currentNodes) =>
			currentNodes.map((node) =>
				node.id === nodeId ? { ...node, text } : node,
			),
		);
	}, []);

	const startDrag = useCallback(
		(event: React.PointerEvent<HTMLDivElement>, node: CanvasNode) => {
			event.stopPropagation();

			if (editingNodeId === node.id) {
				return;
			}

			event.currentTarget.setPointerCapture(event.pointerId);

			const isMetaSelection = event.metaKey || event.ctrlKey;
			const isAlreadySelected = selectedNodeIds.includes(node.id);

			const nextSelectedNodeIds = isMetaSelection
				? isAlreadySelected
					? selectedNodeIds.filter((selectedNodeId) => selectedNodeId !== node.id)
					: [...selectedNodeIds, node.id]
				: isAlreadySelected
					? selectedNodeIds
					: [node.id];

			setSelectedNodeIds(nextSelectedNodeIds);

			if (isMetaSelection) {
				setInteraction({ type: 'idle' });
				return;
			}

			setInteraction({
				type: 'dragging',
				nodeIds: nextSelectedNodeIds,
				startPointerX: event.clientX,
				startPointerY: event.clientY,
				startNodePositions: nodes
					.filter((currentNode) => nextSelectedNodeIds.includes(currentNode.id))
					.map((currentNode) => ({
						nodeId: currentNode.id,
						x: currentNode.x,
						y: currentNode.y,
					})),
			});
		},
		[editingNodeId, nodes, selectedNodeIds],
	);

	const startResize = useCallback(
		(event: React.PointerEvent<HTMLDivElement>, node: CanvasNode) => {
			event.stopPropagation();
			event.currentTarget.setPointerCapture(event.pointerId);

			setSelectedNodeIds([node.id])
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
		[],
	);

	const startPan = useCallback(
		(event: React.PointerEvent<HTMLDivElement>) => {
			const isEmptyCanvasDrag =
				event.button === 0 && event.currentTarget === event.target;
			const shouldPan =
				(isEmptyCanvasDrag && isSpacePressedRef.current) || event.button === 1;

			if (!shouldPan) {
				return false;
			}

			event.preventDefault();
			event.currentTarget.setPointerCapture(event.pointerId);

			const nextInteraction: InteractionState = {
				type: 'panning',
				startPointerX: event.clientX,
				startPointerY: event.clientY,
				startViewportX: viewport.x,
				startViewportY: viewport.y,
			};

			setInteraction(nextInteraction);
			return true;
		},
		[viewport.x, viewport.y],
	);

	const startSelection = useCallback(
		(event: React.PointerEvent<HTMLDivElement>) => {
			const isEmptyCanvasDrag =
				event.button === 0 && event.currentTarget === event.target;

			if (!isEmptyCanvasDrag) {
				return;
			}

			event.preventDefault();
			event.currentTarget.setPointerCapture(event.pointerId);

			setInteraction({
				type: 'selecting',
				startX: event.clientX,
				startY: event.clientY,
				currentX: event.clientX,
				currentY: event.clientY,
			});
		},
		[],
	);

	const handlePointerMove = useCallback(
		(event: React.PointerEvent<HTMLDivElement>) => {
			if (interaction.type === 'idle') return;

			if (interaction.type === 'panning') {
				const nextViewportX =
					interaction.startViewportX +
					(event.clientX - interaction.startPointerX);
				const nextViewportY =
					interaction.startViewportY +
					(event.clientY - interaction.startPointerY);

				setViewport((currentViewport) => ({
					...currentViewport,
					x: nextViewportX,
					y: nextViewportY,
				}));
				return;
			}

			if (interaction.type === 'selecting') {
				const canvasElement = canvasRef.current;

				if (!canvasElement) {
					return;
				}

				const canvasRect = canvasElement.getBoundingClientRect();
				const selectionStart = screenToCanvas({
					screenX: interaction.startX,
					screenY: interaction.startY,
					canvasRect,
					viewport,
				});
				const selectionEnd = screenToCanvas({
					screenX: event.clientX,
					screenY: event.clientY,
					canvasRect,
					viewport,
				});

				const selectionRect = {
					x: Math.min(selectionStart.x, selectionEnd.x),
					y: Math.min(selectionStart.y, selectionEnd.y),
					width: Math.abs(selectionEnd.x - selectionStart.x),
					height: Math.abs(selectionEnd.y - selectionStart.y),
				};

				const selectedIds = nodes
					.filter((node) => {
						const nodeRight = node.x + node.width;
						const nodeBottom = node.y + node.height;
						const selectionRight = selectionRect.x + selectionRect.width;
						const selectionBottom = selectionRect.y + selectionRect.height;

						return (
							node.x < selectionRight &&
							nodeRight > selectionRect.x &&
							node.y < selectionBottom &&
							nodeBottom > selectionRect.y
						);
					})
					.map((node) => node.id);

				setSelectedNodeIds(selectedIds);
				setInteraction({
					...interaction,
					currentX: event.clientX,
					currentY: event.clientY,
				});
				return;
			}

			setNodes((currentNodes) =>
				currentNodes.map((node) => {
					const deltaX = (event.clientX - interaction.startPointerX) / viewport.scale;
					const deltaY = (event.clientY - interaction.startPointerY) / viewport.scale;

					if (interaction.type === 'dragging') {
						const startNodePosition = interaction.startNodePositions.find(
							(position) => position.nodeId === node.id,
						);

						if (!startNodePosition) return node;

						return {
							...node,
							x: startNodePosition.x + deltaX,
							y: startNodePosition.y + deltaY,
						};
					}

					if (node.id !== interaction.nodeId) return node;

					return {
						...node,
						width: clampSize(interaction.startWidth + deltaX),
						height: clampSize(interaction.startHeight + deltaY),
					};
				}),
			);
		},
		[interaction, nodes, viewport],
	);

	const stopInteraction = useCallback(() => {
		if (interaction.type === 'selecting') {
			const canvasElement = canvasRef.current;

			if (!canvasElement) {
				setInteraction({ type: 'idle' });
				return;
			}

			const canvasRect = canvasElement.getBoundingClientRect();

			const selectionStart = screenToCanvas({
				screenX: interaction.startX,
				screenY: interaction.startY,
				canvasRect,
				viewport,
			});

			const selectionEnd = screenToCanvas({
				screenX: interaction.currentX,
				screenY: interaction.currentY,
				canvasRect,
				viewport,
			});

			const selectionRect = {
				x: Math.min(selectionStart.x, selectionEnd.x),
				y: Math.min(selectionStart.y, selectionEnd.y),
				width: Math.abs(selectionEnd.x - selectionStart.x),
				height: Math.abs(selectionEnd.y - selectionStart.y),
			};

			const selectedIds = nodes
				.filter((node) => {
					const nodeRight = node.x + node.width;
					const nodeBottom = node.y + node.height;
					const selectionRight = selectionRect.x + selectionRect.width;
					const selectionBottom = selectionRect.y + selectionRect.height;

					return (
						node.x < selectionRight &&
						nodeRight > selectionRect.x &&
						node.y < selectionBottom &&
						nodeBottom > selectionRect.y
					);
				})
				.map((node) => node.id);

			setSelectedNodeIds(selectedIds);
		}

		setInteraction({ type: 'idle' });
	}, [interaction, nodes, viewport]);

	const handleWheel = useCallback((event: WheelEvent) => {
		event.preventDefault();
		event.stopPropagation();

		const shouldZoom = event.ctrlKey || event.metaKey;

		if (!shouldZoom) {
			setViewport((currentViewport) => ({
				...currentViewport,
				x: currentViewport.x - event.deltaX,
				y: currentViewport.y - event.deltaY,
			}));
			return;
		}

		const canvasElement = canvasRef.current;
		if (!canvasElement) return;

		const canvasRect = canvasElement.getBoundingClientRect();

		const localX = event.clientX - canvasRect.left;
		const localY = event.clientY - canvasRect.top;

		const normalizedDeltaY =
			event.deltaMode === WheelEvent.DOM_DELTA_LINE
				? event.deltaY * 16
				: event.deltaY;
		const zoomSpeed = 0.01;

		setViewport((currentViewport) => {
			const nextScale = clampScale(
				currentViewport.scale * Math.exp(-normalizedDeltaY * zoomSpeed),
			);
			const scaleRatio = nextScale / currentViewport.scale;

			return {
				scale: nextScale,
				x: localX - (localX - currentViewport.x) * scaleRatio,
				y: localY - (localY - currentViewport.y) * scaleRatio,
			};
		});
	}, []);

	useEffect(() => {
		const canvasElement = canvasRef.current;
		if (!canvasElement) return;

		canvasElement.addEventListener('wheel', handleWheel, { passive: false });

		return () => {
			canvasElement.removeEventListener('wheel', handleWheel);
		};
	}, [handleWheel]);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.code === 'Space') {
				isSpacePressedRef.current = true;
			}
		};

		const handleKeyUp = (event: KeyboardEvent) => {
			if (event.code === 'Space') {
				isSpacePressedRef.current = false;
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		window.addEventListener('keyup', handleKeyUp);

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
			window.removeEventListener('keyup', handleKeyUp);
		};
	}, []);

	return (
		<div
			ref={canvasRef}
			onContextMenu={createTextNode}
			onPointerMove={handlePointerMove}
			onPointerUp={stopInteraction}
			onPointerCancel={stopInteraction}
			onPointerDown={(event) => {
				if (event.currentTarget === event.target) {
					setSelectedNodeIds([])
					setEditingNodeId(null);
				}

				const didStartPan = startPan(event);

				if (!didStartPan) {
					startSelection(event);
				}
			}}
			style={{
				position: 'relative',
				width: 800,
				height: 600,
				overflow: 'hidden',
				border: '1px solid rgba(255,255,255,0.12)',
				borderRadius: 16,
				background: '#111217',
				userSelect: 'none',
				cursor:
					interaction.type === 'panning'
						? 'grabbing'
						: isSpacePressedRef.current
							? 'grab'
							: 'crosshair',
				touchAction: 'none',
			}}
		>
			<div
				aria-hidden="true"
				style={{
					position: 'absolute',
					inset: 0,
					background:
						'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)',
					backgroundSize: `${visibleGridSize}px ${visibleGridSize}px`,
					backgroundPosition: `${gridOffsetX}px ${gridOffsetY}px`,
					pointerEvents: 'none',
				}}
			/>
			{selectionBox && (
				<div
					aria-hidden="true"
					style={{
						position: 'fixed',
						left: selectionBox.x,
						top: selectionBox.y,
						width: selectionBox.width,
						height: selectionBox.height,
						border: '1px solid rgba(124,156,255,0.9)',
						background: 'rgba(124,156,255,0.12)',
						pointerEvents: 'none',
					}}
				/>
			)}
			<div
				style={{
					position: 'absolute',
					inset: 0,
					transform: `translate3d(${viewport.x}px, ${viewport.y}px, 0) scale(${viewport.scale})`,
					transformOrigin: '0 0',
					pointerEvents: 'none',
				}}
			>
				{nodes.map((node) => {
					const isSelected = selectedNodeIdSet.has(node.id);
					const isEditing = editingNodeId === node.id;
					const nodeZIndex = isSelected ? 1 : 0;

					return (
						<div
							key={node.id}
							onPointerDown={(event) => startDrag(event, node)}
							onDoubleClick={(event) => {
								event.stopPropagation();
								setSelectedNodeIds([node.id])
								setEditingNodeId(node.id);
							}}
							style={{
								position: 'absolute',
								zIndex: nodeZIndex,
								pointerEvents: 'auto',
								width: node.width,
								height: node.height,
								transform: `translate3d(${node.x}px, ${node.y}px, 0)`,
								border: isSelected
									? '1px solid #7c9cff'
									: '1px solid rgba(255,255,255,0.2)',
								borderRadius: 12,
								background: '#1b1d24',
								padding: 12,
								boxSizing: 'border-box',
								cursor: isEditing
									? 'text'
									: interaction.type === 'dragging'
										? 'grabbing'
										: 'move',
							}}
						>
							{isEditing ? (
								<textarea
									value={node.text}
									autoFocus
									placeholder="Text"
									onPointerDown={(event) => event.stopPropagation()}
									onChange={(event) =>
										updateNodeText(node.id, event.target.value)
									}
									onBlur={() => setEditingNodeId(null)}
									onKeyDown={(event) => {
										if (event.key === 'Escape') {
											event.currentTarget.blur();
										}
									}}
									style={{
										width: '100%',
										height: '100%',
										border: 'none',
										outline: 'none',
										resize: 'none',
										background: 'transparent',
										color: 'inherit',
										font: 'inherit',
										lineHeight: 1.4,
										padding: 0,
										margin: 0,
										overflow: 'hidden',
									}}
								/>
							) : (
								<div
									style={{
										width: '100%',
										height: '100%',
										overflow: 'hidden',
										fontSize: 16,
										lineHeight: 1.4,
										whiteSpace: 'pre-wrap',
										opacity: node.text ? 1 : 0.45,
									}}
								>
									{node.text || 'Text'}
								</div>
							)}

							{isSelected && (
								<div
									onPointerDown={(event) => startResize(event, node)}
									style={{
										position: 'absolute',
										right: -5,
										bottom: -5,
										width: 10,
										height: 10,
										borderRadius: 999,
										background: '#7c9cff',
										cursor: 'nwse-resize',
									}}
								/>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}
