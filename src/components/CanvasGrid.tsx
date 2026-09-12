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
			className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0_0,rgba(255,255,255,0.18)_1.5px,transparent_1.5px)]"
			style={{
				backgroundSize: `${visibleGridSize}px ${visibleGridSize}px`,
				backgroundPosition: `${offsetX}px ${offsetY}px`,
			}}
		/>
	);
}
