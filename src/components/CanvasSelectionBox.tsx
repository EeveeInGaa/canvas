import type { Rect } from '@/types/geometry.types.ts';

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
			className="pointer-events-none absolute rounded-lg border border-accent/90 bg-accent/12"
			data-testid="canvas-selection-box"
			style={{
				left: rect.x,
				top: rect.y,
				width: rect.width,
				height: rect.height,
			}}
		/>
	);
}
