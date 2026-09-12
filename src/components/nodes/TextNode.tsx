import { type ChangeEvent, useLayoutEffect, useRef } from 'react';

import type { TextCanvasNode } from '@/types/canvas-node.types.ts';

type TextNodeProps = {
	node: TextCanvasNode;
	isEditing: boolean;
	onChange: (nodeId: string, text: string) => void;
	onStopEditing: () => void;
};

export function TextNode({
	node,
	isEditing,
	onChange,
	onStopEditing,
}: TextNodeProps) {
	const textareaRef = useRef<HTMLTextAreaElement | null>(null);

	useLayoutEffect(() => {
		if (!isEditing) {
			return;
		}

		textareaRef.current?.focus();
		textareaRef.current?.select();
	}, [isEditing]);

	const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
		onChange(node.id, event.target.value);
	};

	if (isEditing) {
		return (
			<textarea
				ref={textareaRef}
				value={node.text}
				onChange={handleChange}
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
		);
	}

	return (
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
	);
}
