import type { Point } from '@/types/geometry.types.ts';

type CanvasDebugOverlayProps = {
	position: Point | null;
};

export function CanvasDebugOverlay({ position }: CanvasDebugOverlayProps) {
	return (
		<div className="pointer-events-none absolute right-3 bottom-3 z-10 rounded-[10px] border border-white/[0.12] bg-panel/[0.92] px-2.5 py-2 font-[monospace] text-xs leading-[1.4] text-white/[0.82]">
			<div>x: {position ? Math.round(position.x) : '—'}</div>
			<div>y: {position ? Math.round(position.y) : '—'}</div>
		</div>
	);
}
