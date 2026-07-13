import type { PointerEvent } from 'react';

import type { CanvasGroup, CanvasNode } from '@/canvas/types/canvas-node.types';
import { GROUP_FRAME_PADDING, getGroupRect } from '@/canvas/utils/group';

type CanvasGroupFrameProps = {
	group: CanvasGroup;
	isDragging: boolean;
	isSelected: boolean;
	nodes: CanvasNode[];
	onElementChange: (groupId: string, element: HTMLDivElement | null) => void;
	onPointerDown: (
		event: PointerEvent<HTMLDivElement>,
		group: CanvasGroup,
	) => void;
};

export function CanvasGroupFrame({
	group,
	isDragging,
	isSelected,
	nodes,
	onElementChange,
	onPointerDown,
}: CanvasGroupFrameProps) {
	const groupRect = getGroupRect(group, nodes);

	if (!groupRect) {
		return null;
	}

	const borderColor = isSelected
		? 'rgba(124,156,255,0.95)'
		: 'rgba(255,255,255,0.32)';

	return (
		// biome-ignore lint/a11y/useSemanticElements: in this case fieldset would not make sense
		<div
			ref={(element) => {
				onElementChange(group.id, element);
			}}
			aria-label="Node group"
			role="group"
			style={{
				position: 'absolute',
				left: groupRect.x - GROUP_FRAME_PADDING,
				top: groupRect.y - GROUP_FRAME_PADDING,
				width: groupRect.width + GROUP_FRAME_PADDING * 2,
				height: groupRect.height + GROUP_FRAME_PADDING * 2,
				boxSizing: 'border-box',
				border: `1px solid ${borderColor}`,
				borderRadius: 14,
				pointerEvents: 'none',
				zIndex: 1,
			}}
		>
			{(['top', 'right', 'bottom', 'left'] as const).map((side) => (
				<div
					key={side}
					aria-hidden="true"
					onPointerDown={(event) => {
						onPointerDown(event, group);
					}}
					style={{
						position: 'absolute',
						...(side === 'top'
							? {
									left: -6,
									right: -6,
									top: -6,
									height: 12,
								}
							: {}),
						...(side === 'right'
							? {
									top: -6,
									right: -6,
									bottom: -6,
									width: 12,
								}
							: {}),
						...(side === 'bottom'
							? {
									left: -6,
									right: -6,
									bottom: -6,
									height: 12,
								}
							: {}),
						...(side === 'left'
							? {
									top: -6,
									left: -6,
									bottom: -6,
									width: 12,
								}
							: {}),
						cursor: isDragging ? 'grabbing' : 'grab',
						pointerEvents: 'auto',
						touchAction: 'none',
					}}
				/>
			))}
		</div>
	);
}
