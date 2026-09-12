import { Popover } from '@base-ui/react/popover';

import styles from './CanvasToolbar.module.css';

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
	onCreateTextNode: () => void;
	onCreateLinkNode: () => void;
};

type Shortcut = {
	action: string;
	keys: string[];
};

const NAVIGATION_SHORTCUTS: Shortcut[] = [
	{ action: 'Pan canvas', keys: ['Space', 'Drag'] },
	{ action: 'Pan canvas', keys: ['Scroll'] },
	{ action: 'Zoom', keys: ['Ctrl / ⌘', 'Scroll'] },
	{ action: 'Zoom', keys: ['Pinch'] },
	{ action: 'Actions', keys: ['Right click'] },
];

const SELECTION_SHORTCUTS: Shortcut[] = [
	{ action: 'Move selection', keys: ['Arrow keys'] },
	{ action: 'Move farther', keys: ['Shift', 'Arrow keys'] },
	{ action: 'Duplicate', keys: ['Ctrl / ⌘', 'D'] },
	{ action: 'Delete', keys: ['Backspace / Del'] },
	{ action: 'Group', keys: ['Ctrl / ⌘', 'G'] },
	{ action: 'Ungroup', keys: ['Ctrl / ⌘', 'Shift', 'G'] },
	{ action: 'Undo', keys: ['Ctrl / ⌘', 'Z'] },
	{ action: 'Redo', keys: ['Ctrl / ⌘', 'Shift', 'Z'] },
];

function ShortcutList({ shortcuts }: { shortcuts: Shortcut[] }) {
	return (
		<dl className={styles.shortcutList}>
			{shortcuts.map((shortcut) => (
				<div
					className={styles.shortcutRow}
					key={`${shortcut.action}-${shortcut.keys.join('-')}`}
				>
					<dt>{shortcut.action}</dt>
					<dd className={styles.keys}>
						{shortcut.keys.map((key, index) => (
							<span key={key} className={styles.keyGroup}>
								{index > 0 && (
									<span aria-hidden="true" className={styles.keySeparator}>
										+
									</span>
								)}
								<kbd className={styles.key}>{key}</kbd>
							</span>
						))}
					</dd>
				</div>
			))}
		</dl>
	);
}

function CanvasControlsPopover() {
	return (
		<Popover.Root>
			<Popover.Trigger
				aria-label="Show canvas controls"
				className={styles.infoButton}
				onPointerDown={(event) => event.stopPropagation()}
			>
				<span aria-hidden="true">i</span>
			</Popover.Trigger>
			<Popover.Portal>
				<Popover.Positioner
					align="end"
					className={styles.positioner}
					collisionPadding={12}
					side="bottom"
					sideOffset={8}
				>
					<Popover.Popup
						className={styles.popup}
						data-canvas-shortcuts-dialog=""
					>
						<Popover.Title className={styles.title}>
							Canvas controls
						</Popover.Title>
						<Popover.Description className={styles.description}>
							Keyboard and pointer shortcuts
						</Popover.Description>

						<section className={styles.section}>
							<h3 className={styles.sectionTitle}>Navigate</h3>
							<ShortcutList shortcuts={NAVIGATION_SHORTCUTS} />
						</section>

						<div className={styles.divider} />

						<section className={styles.section}>
							<h3 className={styles.sectionTitle}>Edit selection</h3>
							<ShortcutList shortcuts={SELECTION_SHORTCUTS} />
						</section>
					</Popover.Popup>
				</Popover.Positioner>
			</Popover.Portal>
		</Popover.Root>
	);
}

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
	onCreateTextNode,
	onCreateLinkNode,
}: CanvasToolbarProps) {
	return (
		<>
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
						color: canUndo
							? 'rgba(255,255,255,0.82)'
							: 'rgba(255,255,255,0.32)',
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
						color: canRedo
							? 'rgba(255,255,255,0.82)'
							: 'rgba(255,255,255,0.32)',
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
				<CanvasControlsPopover />
			</div>
			<div
				style={{
					position: 'absolute',
					top: 12,
					left: 12,
					zIndex: 10,
					display: 'flex',
					flexDirection: 'column',
					gap: 8,
				}}
			>
				<button
					type="button"
					onPointerDown={(event) => event.stopPropagation()}
					onClick={onCreateTextNode}
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
					Text
				</button>
				<button
					type="button"
					onPointerDown={(event) => event.stopPropagation()}
					onClick={onCreateLinkNode}
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
					Link
				</button>
			</div>
		</>
	);
}
