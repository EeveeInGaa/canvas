import { type ChangeEvent, useLayoutEffect, useRef } from 'react';

import type { LinkCanvasNode } from '@/canvas/types/canvas-node.types';

export type LinkNodeChanges = Partial<Pick<LinkCanvasNode, 'label' | 'url'>>;

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
				style={{
					display: 'flex',
					height: '100%',
					boxSizing: 'border-box',
					flexDirection: 'column',
					gap: 8,
					padding: 12,
				}}
			>
				<input
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
					style={{
						width: '100%',
						boxSizing: 'border-box',
						border: 0,
						borderBottom: '1px solid rgba(255,255,255,0.16)',
						outline: 0,
						background: 'transparent',
						color: 'rgba(255,255,255,0.92)',
						padding: '4px 0 8px',
						font: 'inherit',
						fontWeight: 600,
					}}
				/>

				<input
					type="url"
					value={node.url}
					placeholder="https://example.com"
					onChange={handleUrlChange}
					onKeyDown={(event) => {
						if (event.key === 'Escape') {
							event.currentTarget.blur();
						}
					}}
					style={{
						width: '100%',
						boxSizing: 'border-box',
						border: 0,
						outline: 0,
						background: 'transparent',
						color: 'rgba(255,255,255,0.65)',
						padding: 0,
						font: 'inherit',
						fontSize: 13,
					}}
				/>
			</div>
		);
	}

	const displayLabel = node.label || node.url || 'Neuer Link';

	return (
		<a
			href={node.url || undefined}
			target="_blank"
			rel="noreferrer"
			onClick={(event) => {
				if (!node.url) {
					event.preventDefault();
				}
			}}
			style={{
				display: 'flex',
				width: '100%',
				height: '100%',
				boxSizing: 'border-box',
				flexDirection: 'column',
				justifyContent: 'center',
				gap: 6,
				padding: 12,
				color: 'rgba(255,255,255,0.92)',
				textDecoration: 'none',
				overflow: 'hidden',
				cursor: 'inherit',
			}}
		>
			<strong
				style={{
					overflow: 'hidden',
					textOverflow: 'ellipsis',
					whiteSpace: 'nowrap',
				}}
			>
				{displayLabel}
			</strong>

			{node.url && (
				<span
					style={{
						overflow: 'hidden',
						color: 'rgba(255,255,255,0.55)',
						fontSize: 12,
						textOverflow: 'ellipsis',
						whiteSpace: 'nowrap',
					}}
				>
					{node.url}
				</span>
			)}
		</a>
	);
}
