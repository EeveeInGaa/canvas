import { Accordion } from '@base-ui/react/accordion';
import { Popover } from '@base-ui/react/popover';

import styles from './CanvasToolbar.module.css';

type CanvasToolbarProps = {
	canRedo: boolean;
	canUndo: boolean;
	isDebugEnabled: boolean;
	isInfoOpen: boolean;
	isSnapEnabled: boolean;
	onCenterViewport: () => void;
	onRedo: () => void;
	onToggleDebug: () => void;
	onInfoOpenChange: (isOpen: boolean) => void;
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

const CANVAS_SHORTCUTS: Shortcut[] = [
	{ action: 'Add text node', keys: ['T'] },
	{ action: 'Add link node', keys: ['L'] },
	{ action: 'Toggle snap', keys: ['S'] },
	{ action: 'Center canvas', keys: ['C'] },
	{ action: 'Toggle debug', keys: ['D'] },
	{ action: 'Toggle this menu', keys: ['I'] },
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

type ShortcutSectionProps = {
	shortcuts: Shortcut[];
	title: string;
	value: string;
};

function ShortcutSection({ shortcuts, title, value }: ShortcutSectionProps) {
	return (
		<Accordion.Item className={styles.accordionItem} value={value}>
			<Accordion.Header className={styles.accordionHeader}>
				<Accordion.Trigger className={styles.accordionTrigger}>
					<span>{title}</span>
					<svg
						aria-hidden="true"
						className={styles.accordionIcon}
						viewBox="0 0 16 16"
					>
						<path d="m4 6 4 4 4-4" />
					</svg>
				</Accordion.Trigger>
			</Accordion.Header>
			<Accordion.Panel className={styles.accordionPanel}>
				<div className={styles.accordionContent}>
					<ShortcutList shortcuts={shortcuts} />
				</div>
			</Accordion.Panel>
		</Accordion.Item>
	);
}

type CanvasControlsPopoverProps = {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
};

function CanvasControlsPopover({
	isOpen,
	onOpenChange,
}: CanvasControlsPopoverProps) {
	return (
		<Popover.Root open={isOpen} onOpenChange={onOpenChange}>
			<Popover.Trigger
				aria-label="Show canvas controls"
				className={styles.infoButton}
				data-canvas-shortcuts-trigger=""
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
						onPointerDown={(event) => event.stopPropagation()}
					>
						<Popover.Title className={styles.title}>
							Canvas controls
						</Popover.Title>
						<Popover.Description className={styles.description}>
							Keyboard and pointer shortcuts
						</Popover.Description>

						<Accordion.Root className={styles.accordion} defaultValue={[]}>
							<ShortcutSection
								shortcuts={CANVAS_SHORTCUTS}
								title="Canvas"
								value="canvas"
							/>
							<ShortcutSection
								shortcuts={NAVIGATION_SHORTCUTS}
								title="Navigate"
								value="navigate"
							/>
							<ShortcutSection
								shortcuts={SELECTION_SHORTCUTS}
								title="Edit selection"
								value="selection"
							/>
						</Accordion.Root>
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
	isInfoOpen,
	isSnapEnabled,
	onCenterViewport,
	onRedo,
	onToggleDebug,
	onInfoOpenChange,
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
					aria-pressed={isDebugEnabled}
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
					aria-pressed={isSnapEnabled}
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
				<CanvasControlsPopover
					isOpen={isInfoOpen}
					onOpenChange={onInfoOpenChange}
				/>
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
