import { type ChangeEvent, useLayoutEffect, useRef } from 'react';

import type {
	LinkCanvasNode,
	LinkNodeChanges,
} from '@/types/canvas-node.types.ts';

type LinkNodeProps = {
	node: LinkCanvasNode;
	isEditing: boolean;
	onChange: (nodeId: string, changes: LinkNodeChanges) => void;
	onStopEditing: () => void;
};

export function LinkNode({
	node,
	isEditing,
	onChange,
	onStopEditing,
}: LinkNodeProps) {
	const labelInputRef = useRef<HTMLInputElement | null>(null);

	useLayoutEffect(() => {
		if (!isEditing) {
			return;
		}

		labelInputRef.current?.focus();
		labelInputRef.current?.select();
	}, [isEditing]);

	const handleLabelChange = (event: ChangeEvent<HTMLInputElement>) => {
		onChange(node.id, {
			label: event.target.value,
		});
	};

	const handleUrlChange = (event: ChangeEvent<HTMLInputElement>) => {
		onChange(node.id, {
			url: event.target.value,
		});
	};

	if (isEditing) {
		return (
			<div
				className="flex h-full flex-col gap-2 p-3"
				role="application"
				onPointerDown={(event) => {
					event.stopPropagation();
				}}
				onBlur={(event) => {
					const nextTarget = event.relatedTarget;

					if (
						nextTarget instanceof Node &&
						event.currentTarget.contains(nextTarget)
					) {
						return;
					}

					onStopEditing();
				}}
			>
				<input
					className="w-full border-0 border-canvas-ink/[0.16] border-b bg-transparent px-0 pt-1 pb-2 font-[inherit] font-semibold text-canvas-ink/[0.92] outline-0"
					ref={labelInputRef}
					type="text"
					value={node.label}
					placeholder="Titel"
					onChange={handleLabelChange}
					onKeyDown={(event) => {
						if (event.key === 'Escape') {
							event.currentTarget.blur();
						}
					}}
				/>

				<input
					className="w-full border-0 bg-transparent p-0 font-[inherit] text-[13px] text-canvas-ink/[0.65] outline-0"
					type="url"
					value={node.url}
					placeholder="https://example.com"
					onChange={handleUrlChange}
					onKeyDown={(event) => {
						if (event.key === 'Escape') {
							event.currentTarget.blur();
						}
					}}
				/>
			</div>
		);
	}

	const displayLabel = node.label || node.url || 'Neuer Link';

	return (
		<a
			className="flex h-full w-full cursor-[inherit] flex-col justify-center gap-1.5 overflow-hidden p-3 text-canvas-ink/[0.92] no-underline"
			href={node.url || undefined}
			target="_blank"
			rel="noreferrer"
			onClick={(event) => {
				if (!node.url) {
					event.preventDefault();
				}
			}}
		>
			<strong className="overflow-hidden text-ellipsis whitespace-nowrap">
				{displayLabel}
			</strong>

			{node.url && (
				<span className="overflow-hidden text-ellipsis whitespace-nowrap text-xs text-canvas-secondary">
					{node.url}
				</span>
			)}
		</a>
	);
}
