import { Lock } from 'lucide-react';
import type { FocusEvent, KeyboardEvent, PointerEvent } from 'react';

import type { CanvasGroup } from '@/types/canvas-node.types.ts';
import type { Rect } from '@/types/geometry.types';
import { GROUP_FRAME_PADDING } from '@/utils/group.ts';

type CanvasGroupFrameProps = {
	group: CanvasGroup;
	isDragging: boolean;
	isSelected: boolean;
	rect: Rect;
	isDropTarget: boolean;
	onElementChange: (groupId: string, element: HTMLDivElement | null) => void;
	onFocus: (event: FocusEvent<HTMLDivElement>, group: CanvasGroup) => void;
	onBlur: (event: FocusEvent<HTMLDivElement>) => void;
	onKeyDown: (event: KeyboardEvent<HTMLDivElement>, group: CanvasGroup) => void;
	onPointerDown: (
		event: PointerEvent<HTMLDivElement>,
		group: CanvasGroup,
	) => void;
};

const GROUP_HANDLE_CLASS_NAMES = {
	top: '-top-1.5 -right-1.5 -left-1.5 h-3',
	right: '-top-1.5 -right-1.5 -bottom-1.5 w-3',
	bottom: '-right-1.5 -bottom-1.5 -left-1.5 h-3',
	left: '-top-1.5 -bottom-1.5 -left-1.5 w-3',
} as const;

export function CanvasGroupFrame({
	group,
	isDragging,
	isSelected,
	rect,
	isDropTarget,
	onElementChange,
	onFocus,
	onBlur,
	onKeyDown,
	onPointerDown,
}: CanvasGroupFrameProps) {
	const frameStateClassName = isDropTarget
		? 'border-2 border-control-border-selected bg-accent/[0.05] shadow-[var(--canvas-selection-shadow)]'
		: isSelected
			? 'border border-control-border-selected bg-transparent shadow-none'
			: 'border border-control-border bg-transparent shadow-none';

	return (
		// biome-ignore lint/a11y/useSemanticElements: in this case fieldset would not make sense
		<div
			ref={(element) => {
				onElementChange(group.id, element);
			}}
			data-group-id={group.id}
			data-locked={group.isLocked || undefined}
			data-selected={isSelected || undefined}
			aria-describedby="canvas-keyboard-instructions"
			aria-label={`${isSelected ? 'Selected ' : ''}${group.isLocked ? 'position-locked ' : ''}node group with ${group.nodeIds.length} items`}
			className={`pointer-events-none absolute z-[1] box-border rounded-2xl transition-[border-color,background-color,box-shadow] duration-[120ms] ease-[ease] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${frameStateClassName}`}
			data-canvas-focus-target="true"
			role="group"
			tabIndex={-1}
			onFocus={(event) => onFocus(event, group)}
			onBlur={onBlur}
			onKeyDown={(event) => onKeyDown(event, group)}
			style={{
				left: rect.x - GROUP_FRAME_PADDING,
				top: rect.y - GROUP_FRAME_PADDING,
				width: rect.width + GROUP_FRAME_PADDING * 2,
				height: rect.height + GROUP_FRAME_PADDING * 2,
			}}
		>
			{group.isLocked ? (
				<span
					className="pointer-events-none absolute -top-2.5 right-2 z-[2] grid size-5 place-items-center rounded-full border border-control-border bg-panel text-canvas-ink/65 shadow-sm"
					data-lock-indicator="group"
				>
					<Lock aria-hidden="true" className="size-3" strokeWidth={1.6} />
				</span>
			) : null}

			{(['top', 'right', 'bottom', 'left'] as const).map((side) => (
				<div
					key={side}
					aria-hidden="true"
					className={`absolute touch-none pointer-events-auto ${group.isLocked ? 'cursor-not-allowed' : isDragging ? 'cursor-grabbing' : 'cursor-grab'} ${GROUP_HANDLE_CLASS_NAMES[side]}`}
					onPointerDown={(event) => {
						onPointerDown(event, group);
					}}
				/>
			))}
		</div>
	);
}
