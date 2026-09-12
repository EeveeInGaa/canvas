import type { Point } from '@/types/geometry.types.ts';

type CanvasDebugOverlayProps = {
	position: Point | null;
};

export function CanvasDebugOverlay({ position }: CanvasDebugOverlayProps) {
	return (
		<div
			style={{
				position: 'absolute',
				right: 12,
				bottom: 12,
				zIndex: 10,
				border: '1px solid rgba(255,255,255,0.12)',
				borderRadius: 10,
				background: 'rgba(27,29,36,0.92)',
				color: 'rgba(255,255,255,0.82)',
				padding: '8px 10px',
				fontFamily: 'monospace',
				fontSize: 12,
				lineHeight: 1.4,
				pointerEvents: 'none',
			}}
		>
			<div>x: {position ? Math.round(position.x) : '—'}</div>
			<div>y: {position ? Math.round(position.y) : '—'}</div>
		</div>
	);
}
