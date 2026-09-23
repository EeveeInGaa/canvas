import { ExternalLink } from 'lucide-react';
import { type ChangeEvent, useId, useLayoutEffect, useRef } from 'react';

import type {
	LinkCanvasNode,
	LinkNodeChanges,
} from '@/types/canvas-node.types';
import { getSafeLinkUrl } from '@/utils/link';

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
	const urlHintId = useId();
	const safeUrl = getSafeLinkUrl(node.url);
	const isInvalidUrl = node.url.trim().length > 0 && safeUrl === null;

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
					aria-describedby={urlHintId}
					aria-invalid={isInvalidUrl || undefined}
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
				<p className="sr-only" id={urlHintId}>
					Enter a web address or domain. Only HTTP and HTTPS links can be
					opened.
				</p>
			</fieldset>
		);
	}

	const displayLabel = node.label || node.url || 'Neuer Link';
	const invalidUrlMessage = node.url
		? 'Edit to enter a valid web address.'
		: 'Edit to add a web address.';

	return (
		<div className="flex h-full w-full cursor-[inherit] flex-col justify-center gap-1.5 overflow-hidden p-3 text-canvas-ink/[0.92] no-underline">
			<strong className="overflow-hidden text-ellipsis whitespace-nowrap">
				{displayLabel}
			</strong>

			<div className="flex min-w-0 items-center gap-2 text-xs">
				<span
					className={`min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap ${safeUrl ? 'text-canvas-secondary' : 'text-danger'}`}
				>
					{safeUrl ? node.url : invalidUrlMessage}
				</span>

				{safeUrl ? (
					<a
						aria-label={`Open ${displayLabel}`}
						className="inline-flex shrink-0 items-center gap-1 rounded-sm font-semibold text-accent-text underline decoration-current/40 underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
						href={safeUrl}
						rel="noopener noreferrer"
						target="_blank"
						onDoubleClick={(event) => {
							event.stopPropagation();
						}}
						onPointerDown={(event) => {
							event.stopPropagation();
						}}
					>
						Open
						<ExternalLink aria-hidden="true" className="size-3" />
					</a>
				) : null}
			</div>
		</div>
	);
}
