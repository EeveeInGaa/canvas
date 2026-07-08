import { useCallback, useState } from 'react';
import type {CanvasNode, InteractionState} from "@/canvas/Canvas.ts";
import {clampSize, createId} from "@/canvas/canvas-fn.ts";


export function CanvasPrototype() {
    const [nodes, setNodes] = useState<CanvasNode[]>([]);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [interaction, setInteraction] = useState<InteractionState>({ type: 'idle' });

    const createTextNode = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
        event.preventDefault();

        const canvasRect = event.currentTarget.getBoundingClientRect();

        const newNode: CanvasNode = {
            id: createId(),
            type: 'text',
            x: event.clientX - canvasRect.left,
            y: event.clientY - canvasRect.top,
            width: 180,
            height: 90,
            text: 'Text',
        };

        setNodes((currentNodes) => [...currentNodes, newNode]);
        setSelectedNodeId(newNode.id);
    }, []);

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

    const handlePointerMove = useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            if (interaction.type === 'idle') return;

            setNodes((currentNodes) =>
                currentNodes.map((node) => {
                    if (node.id !== interaction.nodeId) return node;

                    const deltaX = event.clientX - interaction.startPointerX;
                    const deltaY = event.clientY - interaction.startPointerY;

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
        [interaction],
    );

    const stopInteraction = useCallback(() => {
        setInteraction({ type: 'idle' });
    }, []);

    return (
        <div
            onContextMenu={createTextNode}
            onPointerMove={handlePointerMove}
            onPointerUp={stopInteraction}
            onPointerCancel={stopInteraction}
            onPointerDown={() => setSelectedNodeId(null)}
            style={{
                position: 'relative',
                width: '100%',
                height: '100vh',
                overflow: 'hidden',
                background:
                    'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)',
                backgroundSize: '24px 24px',
                userSelect: 'none',
            }}
        >
            {nodes.map((node) => {
                const isSelected = selectedNodeId === node.id;

                return (
                    <div
                        key={node.id}
                        onPointerDown={(event) => startDrag(event, node)}
                        style={{
                            position: 'absolute',
                            width: node.width,
                            height: node.height,
                            transform: `translate3d(${node.x}px, ${node.y}px, 0)`,
                            border: isSelected ? '1px solid #7c9cff' : '1px solid rgba(255,255,255,0.2)',
                            borderRadius: 12,
                            background: 'rgba(255,255,255,0.08)',
                            backdropFilter: 'blur(12px)',
                            padding: 12,
                            boxSizing: 'border-box',
                            cursor: interaction.type === 'dragging' ? 'grabbing' : 'grab',
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
    );
}