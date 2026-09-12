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
				className="h-full w-full resize-none border-0 bg-transparent p-3 font-[inherit] text-canvas-ink/[0.9] outline-0"
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
			/>
		);
	}

	return (
		<div className="h-full w-full overflow-hidden p-3 text-canvas-ink/[0.9] whitespace-pre-wrap [overflow-wrap:anywhere]">
			{node.text}
		</div>
	);
}
