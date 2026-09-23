import { type ChangeEvent, useId, useLayoutEffect, useRef } from 'react';

import type {
	LinkCanvasNode,
	LinkNodeChanges,
} from '@/types/canvas-node.types.ts';

type LinkNodeProps = {
	node: LinkCanvasNode;
	isEditing: boolean;
	onChange: (nodeId: string, changes: LinkNodeChanges) => void;
	onStopEditing: (restoreNodeFocus?: boolean) => void;
};

export function LinkNode({
	node,
	isEditing,
	onChange,
	onStopEditing,
}: LinkNodeProps) {
	const labelInputRef = useRef<HTMLInputElement | null>(null);
	const titleInputId = useId();
	const urlInputId = useId();

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
			<fieldset
				className="flex h-full min-w-0 flex-col gap-2 border-0 p-3"
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
				<legend className="sr-only">Link details</legend>
				<label className="sr-only" htmlFor={titleInputId}>
					Link title
				</label>
				<input
					autoComplete="off"
					className="w-full border-0 border-canvas-ink/[0.16] border-b bg-transparent px-0 pt-1 pb-2 font-[inherit] font-semibold text-canvas-ink/[0.92] outline-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
					id={titleInputId}
					name="link-title"
					ref={labelInputRef}
					spellCheck="true"
					type="text"
					value={node.label}
					placeholder="Titel"
					onChange={handleLabelChange}
					onKeyDown={(event) => {
						if (event.key === 'Escape') {
							event.preventDefault();
							onStopEditing(true);
						}
					}}
				/>

				<label className="sr-only" htmlFor={urlInputId}>
					Link URL
				</label>
				<input
					autoComplete="url"
					className="w-full border-0 bg-transparent p-0 font-[inherit] text-[13px] text-canvas-ink/[0.65] outline-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
					id={urlInputId}
					name="link-url"
					spellCheck="false"
					type="url"
					value={node.url}
					placeholder="https://example.com"
					onChange={handleUrlChange}
					onKeyDown={(event) => {
						if (event.key === 'Escape') {
							event.preventDefault();
							onStopEditing(true);
						}
					}}
				/>
			</fieldset>
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
