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
	const nodeStateClassName = `${
		isSelected
			? 'border-2 border-accent/[0.95]'
			: 'border border-canvas-ink/[0.14]'
	} ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} ${
		isEditing ? 'select-text' : 'select-none'
	}`;

	return (
		<div
			className={`absolute box-border touch-none overflow-hidden rounded-xl bg-surface ${nodeStateClassName}`}
			data-selected={isSelected || undefined}
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
				left: node.x,
				top: node.y,
				width: node.width,
				height: node.height,
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
					className="absolute -right-[13px] -bottom-[13px] flex size-6 touch-none cursor-nwse-resize items-start justify-start"
					onPointerDown={(event) => {
						onResizePointerDown(event, node);
					}}
				>
					<div className="relative size-1.5 rounded-full bg-accent/50" />
				</div>
			)}
		</div>
	);
}
