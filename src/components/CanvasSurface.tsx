import type { Rect } from '@/types/geometry.types';

type CanvasSurfaceProps = {
	bounds: Rect;
	gridSize: number;
};

export function CanvasSurface({ bounds, gridSize }: CanvasSurfaceProps) {
	return (
		<div
			className="pointer-events-none absolute overflow-hidden bg-surface shadow-[0_12px_40px_rgb(31_36_48_/_16%)] outline outline-canvas-ink/10"
			data-testid="canvas-surface"
			style={{
				left: bounds.x,
				top: bounds.y,
				width: bounds.width,
				height: bounds.height,
			}}
		>
			<div
				aria-hidden="true"
				className="absolute inset-0 bg-[radial-gradient(circle_at_0_0,var(--canvas-grid-dot)_1.5px,transparent_1.5px)]"
				style={{ backgroundSize: `${gridSize}px ${gridSize}px` }}
			/>
		</div>
	);
}
