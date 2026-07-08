import { useCallback, useEffect, useRef, useState } from 'react';
import type { CanvasNode, InteractionState, Viewport } from '@/canvas/Canvas.ts';
import { clampScale, clampSize, createId, screenToCanvas } from '@/canvas/canvas-fn.ts';


export function CanvasPrototype() {
    const canvasRef = useRef<HTMLDivElement | null>(null);
    const [nodes, setNodes] = useState<CanvasNode[]>([]);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [interaction, setInteraction] = useState<InteractionState>({ type: 'idle' });
    const [viewport, setViewport] = useState<Viewport>({
        x: 0,
        y: 0,
        scale: 1,
    });

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
                text: 'Text',
            };

            setNodes((currentNodes) => [...currentNodes, newNode]);
            setSelectedNodeId(newNode.id);
        },
        [viewport],
    );

    const startDrag = useCallback(
        (event: React.PointerEvent<HTMLDivElement>, node: CanvasNode) => {
            event.stopPropagation();
            event.currentTarget.setPointerCapture(event.pointerId);

            setSelectedNodeId(node.id);
            setInteraction({
                type: 'dragging',
                nodeId: node.id,
                startPointerX: event.clientX,
                startPointerY: event.clientY,
                startNodeX: node.x,
                startNodeY: node.y,
            });
        },
        [],
    );

    const startResize = useCallback(
        (event: React.PointerEvent<HTMLDivElement>, node: CanvasNode) => {
            event.stopPropagation();
            event.currentTarget.setPointerCapture(event.pointerId);

            setSelectedNodeId(node.id);
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
            const isEmptyCanvasDrag = event.button === 0 && event.currentTarget === event.target;
            const shouldPan = isEmptyCanvasDrag || event.button === 1 || event.shiftKey || event.altKey;

            if (!shouldPan) {
                return;
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
        },
        [viewport.x, viewport.y],
    );

    const handlePointerMove = useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            if (interaction.type === 'idle') return;

            if (interaction.type === 'panning') {
                const nextViewportX = interaction.startViewportX + (event.clientX - interaction.startPointerX);
                const nextViewportY = interaction.startViewportY + (event.clientY - interaction.startPointerY);

                setViewport((currentViewport) => ({
                    ...currentViewport,
                    x: nextViewportX,
                    y: nextViewportY,
                }));
                return;
            }

            setNodes((currentNodes) =>
                currentNodes.map((node) => {
                    if (node.id !== interaction.nodeId) return node;

                    const deltaX = (event.clientX - interaction.startPointerX) / viewport.scale;
                    const deltaY = (event.clientY - interaction.startPointerY) / viewport.scale;

                    if (interaction.type === 'dragging') {
                        return {
                            ...node,
                            x: interaction.startNodeX + deltaX,
                            y: interaction.startNodeY + deltaY,
                        };
                    }

                    return {
                        ...node,
                        width: clampSize(interaction.startWidth + deltaX),
                        height: clampSize(interaction.startHeight + deltaY),
                    };
                }),
            );
        },
        [interaction, viewport.scale],
    );

    const stopInteraction = useCallback(() => {
        setInteraction({ type: 'idle' });
    }, []);

    const handleWheel = useCallback(
        (event: WheelEvent) => {
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
                event.deltaMode === WheelEvent.DOM_DELTA_LINE ? event.deltaY * 16 : event.deltaY;
            const zoomSpeed = 0.01;

            setViewport((currentViewport) => {
                const nextScale = clampScale(currentViewport.scale * Math.exp(-normalizedDeltaY * zoomSpeed));
                const scaleRatio = nextScale / currentViewport.scale;

                return {
                    scale: nextScale,
                    x: localX - (localX - currentViewport.x) * scaleRatio,
                    y: localY - (localY - currentViewport.y) * scaleRatio,
                };
            });
        },
        [],
    );

    useEffect(() => {
        const canvasElement = canvasRef.current;
        if (!canvasElement) return;

        canvasElement.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
            canvasElement.removeEventListener('wheel', handleWheel);
        };
    }, [handleWheel]);

    return (
        <div
            ref={canvasRef}
            onContextMenu={createTextNode}
            onPointerMove={handlePointerMove}
            onPointerUp={stopInteraction}
            onPointerCancel={stopInteraction}
            onPointerDown={(event) => {
                if (event.currentTarget === event.target) {
                    setSelectedNodeId(null);
                }

                startPan(event);
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
                cursor: interaction.type === 'panning' ? 'grabbing' : 'grab',
                touchAction: 'none',
            }}
        >
            <div
                aria-hidden="true"
                style={{
                    position: 'absolute',
                    inset: 0,
                    transform: `translate3d(${viewport.x}px, ${viewport.y}px, 0) scale(${viewport.scale})`,
                    transformOrigin: '0 0',
                    background:
                        'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                    pointerEvents: 'none',
                }}
            />
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
                    const isSelected = selectedNodeId === node.id;
                    const nodeZIndex = isSelected ? 1 : 0;

                    return (
                        <div
                            key={node.id}
                            onPointerDown={(event) => startDrag(event, node)}
                            style={{
                                position: 'absolute',
                                zIndex: nodeZIndex,
                                pointerEvents: 'auto',
                                width: node.width,
                                height: node.height,
                                transform: `translate3d(${node.x}px, ${node.y}px, 0)`,
                                border: isSelected ? '1px solid #7c9cff' : '1px solid rgba(255,255,255,0.2)',
                                borderRadius: 12,
                                background: '#1b1d24',
                                padding: 12,
                                boxSizing: 'border-box',
                                cursor: interaction.type === 'dragging' ? 'grabbing' : 'move',
                            }}
                        >
                            <div
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    overflow: 'hidden',
                                    fontSize: 16,
                                    lineHeight: 1.4,
                                }}
                            >
                                {node.text}
                            </div>

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