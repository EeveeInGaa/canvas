type CanvasGridProps = {
	visibleGridSize: number;
	offsetX: number;
	offsetY: number;
};

export function CanvasGrid({
	visibleGridSize,
	offsetX,
	offsetY,
}: CanvasGridProps) {
	return (
		<div
			aria-hidden="true"
			style={{
				position: 'absolute',
				inset: 0,
				background:
					'radial-gradient(circle at 0 0, rgba(255,255,255,0.18) 1.5px, transparent 1.5px)',
				backgroundSize: `${visibleGridSize}px ${visibleGridSize}px`,
				backgroundPosition: `${offsetX}px ${offsetY}px`,
				pointerEvents: 'none',
			}}
		/>
	);
}
