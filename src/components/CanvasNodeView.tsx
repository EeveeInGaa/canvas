import { memo, type PointerEvent } from 'react';

import styles from '@/components/CanvasNodeView.module.css';
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
	showContent: boolean;
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

export const CanvasNodeView = memo(function CanvasNodeView({
	node,
	isSelected,
	isEditing,
	showContent,
	isDragging,
	onPointerDown,
	onResizePointerDown,
	onStartEditing,
	onStopEditing,
	onTextChange,
	onElementChange,
	onLinkChange,
}: CanvasNodeViewProps) {
	const isContentEditing = showContent && isEditing;
	const nodeDetailClassName = showContent
		? ''
		: `${styles.skeleton} ${styles[node.type]}`;
	const nodeStateClassName = `${
		isSelected
			? 'border-2 border-accent/[0.95]'
			: 'border border-canvas-ink/[0.14]'
	} ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} ${
		isContentEditing ? 'select-text' : 'select-none'
	}`;

	return (
		<div
			className={`absolute box-border touch-none overflow-hidden rounded-xl bg-surface ${nodeStateClassName} ${nodeDetailClassName}`}
			data-selected={isSelected || undefined}
			role="application"
			ref={(element) => {
				onElementChange(node.id, element);
			}}
			data-node-id={node.id}
			data-node-detail={showContent ? 'full' : 'skeleton'}
			data-node-skeleton={!showContent || undefined}
			onPointerDown={(event) => {
				onPointerDown(event, node);
			}}
			onDoubleClick={(event) => {
				event.stopPropagation();

				if (showContent) {
					onStartEditing(node.id);
				}
			}}
			style={{
				left: node.x,
				top: node.y,
				width: node.width,
				height: node.height,
			}}
		>
			{showContent && node.type === CanvasNodeType.Text ? (
				<TextNode
					node={node}
					isEditing={isContentEditing}
					onChange={onTextChange}
					onStopEditing={onStopEditing}
				/>
			) : null}

			{showContent && node.type === CanvasNodeType.Link ? (
				<LinkNode
					node={node}
					isEditing={isContentEditing}
					onChange={onLinkChange}
					onStopEditing={onStopEditing}
				/>
			) : null}

			{isSelected && !isContentEditing && (
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
});
