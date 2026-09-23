import { type ChangeEvent, useLayoutEffect, useRef } from 'react';

import type { TextCanvasNode } from '@/types/canvas-node.types.ts';

type TextNodeProps = {
	node: TextCanvasNode;
	isSelected: boolean;
	isEditing: boolean;
	onChange: (nodeId: string, text: string) => void;
	onStopEditing: (restoreNodeFocus?: boolean) => void;
};

export function TextNode({
	node,
	isSelected,
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
				aria-label="Text content"
				autoComplete="off"
				className="h-full w-full resize-none overflow-y-auto overscroll-contain border-0 bg-transparent p-3 font-[inherit] text-canvas-ink/[0.9] caret-accent outline-none selection:bg-accent/25 focus-visible:bg-accent/[0.04]"
				data-node-scroll-container={isSelected || undefined}
				name="text-content"
				ref={textareaRef}
				spellCheck="true"
				value={node.text}
				onChange={handleChange}
				onPointerDown={(event) => {
					event.stopPropagation();
				}}
				onBlur={() => onStopEditing()}
				onKeyDown={(event) => {
					if (event.key === 'Escape') {
						event.preventDefault();
						onStopEditing(true);
					}
				}}
			/>
		);
	}

	return (
		<div
			className={`h-full w-full p-3 text-canvas-ink/[0.9] whitespace-pre-wrap [overflow-wrap:anywhere] ${isSelected ? 'overflow-y-auto overscroll-contain' : 'overflow-hidden'}`}
			data-node-scroll-container={isSelected || undefined}
		>
			{node.text}
		</div>
	);
}
