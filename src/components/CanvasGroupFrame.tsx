import type { PointerEvent } from 'react';

import type { CanvasGroup, CanvasNode } from '@/types/canvas-node.types.ts';
import { GROUP_FRAME_PADDING, getGroupRect } from '@/utils/group.ts';

type CanvasGroupFrameProps = {
	group: CanvasGroup;
	isDragging: boolean;
	isSelected: boolean;
	nodes: CanvasNode[];
	isDropTarget: boolean;
	onElementChange: (groupId: string, element: HTMLDivElement | null) => void;
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
	nodes,
	isDropTarget,
	onElementChange,
	onPointerDown,
}: CanvasGroupFrameProps) {
	const groupRect = getGroupRect(group, nodes);

	if (!groupRect) {
		return null;
	}

	const frameStateClassName = isDropTarget
		? `border-2 ${isSelected ? 'border-accent/[0.95]' : 'border-white/[0.32]'} bg-accent/[0.05] shadow-[0_0_0_4px_rgba(124,156,255,0.12)]`
		: isSelected
			? 'border border-accent/[0.9] bg-transparent shadow-none'
			: 'border border-accent/[0.45] bg-transparent shadow-none';

	return (
		// biome-ignore lint/a11y/useSemanticElements: in this case fieldset would not make sense
		<div
			ref={(element) => {
				onElementChange(group.id, element);
			}}
			data-group-id={group.id}
			aria-label="Node group"
			className={`pointer-events-none absolute z-[1] box-border rounded-2xl transition-[border-color,background-color,box-shadow] duration-[120ms] ease-[ease] ${frameStateClassName}`}
			role="group"
			style={{
				left: groupRect.x - GROUP_FRAME_PADDING,
				top: groupRect.y - GROUP_FRAME_PADDING,
				width: groupRect.width + GROUP_FRAME_PADDING * 2,
				height: groupRect.height + GROUP_FRAME_PADDING * 2,
			}}
		>
			{(['top', 'right', 'bottom', 'left'] as const).map((side) => (
				<div
					key={side}
					aria-hidden="true"
					className={`absolute touch-none pointer-events-auto ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} ${GROUP_HANDLE_CLASS_NAMES[side]}`}
					onPointerDown={(event) => {
						onPointerDown(event, group);
					}}
				/>
			))}
		</div>
	);
}
