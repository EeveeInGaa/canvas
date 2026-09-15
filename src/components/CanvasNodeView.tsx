import { Lock } from 'lucide-react';
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
	isPositionLocked: boolean;
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
	isPositionLocked,
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
	} ${isPositionLocked ? 'cursor-not-allowed' : isDragging ? 'cursor-grabbing' : 'cursor-grab'} ${
		isContentEditing ? 'select-text' : 'select-none'
	}`;

	return (
		<div
			className={`absolute isolate box-border touch-none overflow-hidden rounded-xl bg-surface ${nodeStateClassName} ${nodeDetailClassName}`}
			aria-label={isPositionLocked ? 'Locked canvas node' : undefined}
			data-locked={isPositionLocked || undefined}
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
			{node.isLocked ? (
				<span
					className="pointer-events-none absolute top-1.5 right-1.5 z-[2] grid size-5 place-items-center rounded-full border border-canvas-ink/15 bg-panel/95 text-canvas-ink/65 shadow-sm"
					data-lock-indicator="node"
				>
					<Lock aria-hidden="true" className="size-3" strokeWidth={1.6} />
				</span>
			) : null}

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

			{isSelected && !isContentEditing && !isPositionLocked && (
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
