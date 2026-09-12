import type { PointerEvent } from 'react';

import { LinkNode } from '@/components/nodes/LinkNode.tsx';
import { TextNode } from '@/components/nodes/TextNode.tsx';
import {
	type CanvasNode,
	CanvasNodeType,
	type LinkNodeChanges,
} from '@/types/canvas-node.types.ts';

type CanvasNodeViewProps = {
	node: CanvasNode;
	isSelected: boolean;
	isEditing: boolean;
	isDragging: boolean;
	onPointerDown: (
		event: PointerEvent<HTMLDivElement>,
		node: CanvasNode,
	) => void;
	onResizePointerDown: (
		event: PointerEvent<HTMLDivElement>,
		node: CanvasNode,
	) => void;
	onStartEditing: (nodeId: string) => void;
	onStopEditing: () => void;
	onTextChange: (nodeId: string, text: string) => void;
	onElementChange: (nodeId: string, element: HTMLDivElement | null) => void;
	onLinkChange: (nodeId: string, changes: LinkNodeChanges) => void;
};

export function CanvasNodeView({
	node,
	isSelected,
	isEditing,
	isDragging,
	onPointerDown,
	onResizePointerDown,
	onStartEditing,
	onStopEditing,
	onTextChange,
	onElementChange,
	onLinkChange,
}: CanvasNodeViewProps) {
	return (
		<div
			role="application"
			ref={(element) => {
				onElementChange(node.id, element);
			}}
			data-node-id={node.id}
			onPointerDown={(event) => {
				onPointerDown(event, node);
			}}
			onDoubleClick={(event) => {
				event.stopPropagation();
				onStartEditing(node.id);
			}}
			style={{
				position: 'absolute',
				left: node.x,
				top: node.y,
				width: node.width,
				height: node.height,
				boxSizing: 'border-box',
				border: isSelected
					? '2px solid rgba(124,156,255,0.95)'
					: '1px solid rgba(255,255,255,0.14)',
				borderRadius: 12,
				background: 'rgba(34,37,46)',
				overflow: 'hidden',
				cursor: isDragging ? 'grabbing' : 'grab',
				userSelect: isEditing ? 'text' : 'none',
				touchAction: 'none',
			}}
		>
			{node.type === CanvasNodeType.Text && (
				<TextNode
					node={node}
					isEditing={isEditing}
					onChange={onTextChange}
					onStopEditing={onStopEditing}
				/>
			)}

			{node.type === CanvasNodeType.Link && (
				<LinkNode
					node={node}
					isEditing={isEditing}
					onChange={onLinkChange}
					onStopEditing={onStopEditing}
				/>
			)}

			{isSelected && !isEditing && (
				<div
					aria-hidden="true"
					onPointerDown={(event) => {
						onResizePointerDown(event, node);
					}}
					style={{
						position: 'absolute',
						right: -13,
						bottom: -13,
						width: 24,
						height: 24,
						display: 'flex',
						alignItems: 'start',
						justifyContent: 'start',
						cursor: 'nwse-resize',
						touchAction: 'none',
					}}
				>
					<div
						style={{
							position: 'relative',
							width: 6,
							height: 6,
							borderRadius: '50%',
							background: 'rgba(124,156,255,0.5)',
						}}
					/>
				</div>
			)}
		</div>
	);
}
