type CanvasToolbarProps = {
	canRedo: boolean;
	canUndo: boolean;
	isDebugEnabled: boolean;
	isSnapEnabled: boolean;
	onCenterViewport: () => void;
	onRedo: () => void;
	onToggleDebug: () => void;
	onToggleSnap: () => void;
	onUndo: () => void;
};

export function CanvasToolbar({
	canRedo,
	canUndo,
	isDebugEnabled,
	isSnapEnabled,
	onCenterViewport,
	onRedo,
	onToggleDebug,
	onToggleSnap,
	onUndo,
}: CanvasToolbarProps) {
	return (
		<div
			style={{
				position: 'absolute',
				top: 12,
				right: 12,
				zIndex: 10,
				display: 'flex',
				gap: 8,
			}}
		>
			<button
				type="button"
				onPointerDown={(event) => event.stopPropagation()}
				onClick={onCenterViewport}
				style={{
					border: '1px solid rgba(255,255,255,0.14)',
					borderRadius: 999,
					background: '#1b1d24',
					color: 'rgba(255,255,255,0.82)',
					padding: '6px 10px',
					fontSize: 12,
					fontWeight: 600,
					cursor: 'pointer',
				}}
			>
				Center
			</button>
			<button
				type="button"
				disabled={!canUndo}
				onPointerDown={(event) => event.stopPropagation()}
				onClick={onUndo}
				style={{
					border: '1px solid rgba(255,255,255,0.14)',
					borderRadius: 999,
					background: '#1b1d24',
					color: canUndo ? 'rgba(255,255,255,0.82)' : 'rgba(255,255,255,0.32)',
					padding: '6px 10px',
					fontSize: 12,
					fontWeight: 600,
					cursor: canUndo ? 'pointer' : 'not-allowed',
				}}
			>
				Undo
			</button>
			<button
				type="button"
				disabled={!canRedo}
				onPointerDown={(event) => event.stopPropagation()}
				onClick={onRedo}
				style={{
					border: '1px solid rgba(255,255,255,0.14)',
					borderRadius: 999,
					background: '#1b1d24',
					color: canRedo ? 'rgba(255,255,255,0.82)' : 'rgba(255,255,255,0.32)',
					padding: '6px 10px',
					fontSize: 12,
					fontWeight: 600,
					cursor: canRedo ? 'pointer' : 'not-allowed',
				}}
			>
				Redo
			</button>
			<button
				type="button"
				onPointerDown={(event) => event.stopPropagation()}
				onClick={onToggleDebug}
				style={{
					border: '1px solid rgba(255,255,255,0.14)',
					borderRadius: 999,
					background: isDebugEnabled ? '#7c9cff' : '#1b1d24',
					color: isDebugEnabled ? '#101217' : 'rgba(255,255,255,0.82)',
					padding: '6px 10px',
					fontSize: 12,
					fontWeight: 600,
					cursor: 'pointer',
				}}
			>
				Debug: {isDebugEnabled ? 'On' : 'Off'}
			</button>

			<button
				type="button"
				onPointerDown={(event) => event.stopPropagation()}
				onClick={onToggleSnap}
				style={{
					border: '1px solid rgba(255,255,255,0.14)',
					borderRadius: 999,
					background: isSnapEnabled ? '#7c9cff' : '#1b1d24',
					color: isSnapEnabled ? '#101217' : 'rgba(255,255,255,0.82)',
					padding: '6px 10px',
					fontSize: 12,
					fontWeight: 600,
					cursor: 'pointer',
				}}
			>
				Snap: {isSnapEnabled ? 'On' : 'Off'}
			</button>
		</div>
	);
}
