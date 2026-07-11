import {
	type ChangeEvent,
	type PointerEvent,
	useLayoutEffect,
	useRef,
} from 'react';

import type { CanvasNode } from '@/canvas/types/canvas-node.types';

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
}: CanvasNodeViewProps) {
	const handleTextChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
		onTextChange(node.id, event.target.value);
	};

	const textareaRef = useRef<HTMLTextAreaElement>(null);

	useLayoutEffect(() => {
		if (!isEditing) {
			return;
		}

		textareaRef.current?.focus();
		textareaRef.current?.select();
	}, [isEditing]);

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
			{isEditing ? (
				<textarea
					ref={textareaRef}
					value={node.text}
					onChange={handleTextChange}
					onPointerDown={(event) => {
						event.stopPropagation();
					}}
					onBlur={onStopEditing}
					onKeyDown={(event) => {
						if (event.key === 'Escape') {
							event.currentTarget.blur();
						}
					}}
					style={{
						width: '100%',
						height: '100%',
						boxSizing: 'border-box',
						border: 0,
						outline: 0,
						resize: 'none',
						background: 'transparent',
						color: 'rgba(255,255,255,0.9)',
						padding: 12,
						font: 'inherit',
					}}
				/>
			) : (
				<div
					style={{
						width: '100%',
						height: '100%',
						boxSizing: 'border-box',
						padding: 12,
						color: 'rgba(255,255,255,0.9)',
						whiteSpace: 'pre-wrap',
						overflowWrap: 'anywhere',
						overflow: 'hidden',
					}}
				>
					{node.text}
				</div>
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
					></div>
				</div>
			)}
		</div>
	);
}
