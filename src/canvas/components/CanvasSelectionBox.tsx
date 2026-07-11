import type { Rect } from '@/canvas/types/geometry.types';

type CanvasSelectionBoxProps = {
	rect: Rect | null;
};

export function CanvasSelectionBox({ rect }: CanvasSelectionBoxProps) {
	if (!rect) {
		return null;
	}

	return (
		<div
			aria-hidden="true"
			style={{
				position: 'absolute',
				left: rect.x,
				top: rect.y,
				width: rect.width,
				height: rect.height,
				border: '1px solid rgba(124,156,255,0.9)',
				background: 'rgba(124,156,255,0.12)',
				pointerEvents: 'none',
			}}
		/>
	);
}
