import { ContextMenu } from '@base-ui/react/context-menu';

import styles from './CanvasContextMenu.module.css';

type CanvasContextMenuProps = {
	canGroup: boolean;
	canUngroup: boolean;
	isSelectionMenu: boolean;
	isSnapEnabled: boolean;
	selectionCount: number;
	onCenterViewport: () => void;
	onCreateLinkNode: () => void;
	onCreateTextNode: () => void;
	onDelete: () => void;
	onDuplicate: () => void;
	onGroup: () => void;
	onToggleSnap: () => void;
	onUngroup: () => void;
};

function MenuIcon({ children }: { children: React.ReactNode }) {
	return (
		<span aria-hidden="true" className={styles.icon}>
			{children}
		</span>
	);
}

function Shortcut({ children }: { children: React.ReactNode }) {
	return <span className={styles.shortcut}>{children}</span>;
}

function DuplicateIcon() {
	return (
		<MenuIcon>
			<svg aria-hidden="true" viewBox="0 0 20 20">
				<rect x="7" y="3.5" width="9.5" height="9.5" rx="2" />
				<path d="M13 13v1.5a2 2 0 0 1-2 2H5.5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2H7" />
			</svg>
		</MenuIcon>
	);
}

function GroupIcon() {
	return (
		<MenuIcon>
			<svg aria-hidden="true" viewBox="0 0 20 20">
				<rect x="3" y="3" width="5.5" height="5.5" rx="1.25" />
				<rect x="11.5" y="3" width="5.5" height="5.5" rx="1.25" />
				<rect x="3" y="11.5" width="5.5" height="5.5" rx="1.25" />
				<rect x="11.5" y="11.5" width="5.5" height="5.5" rx="1.25" />
			</svg>
		</MenuIcon>
	);
}

function UngroupIcon() {
	return (
		<MenuIcon>
			<svg aria-hidden="true" viewBox="0 0 20 20">
				<path d="M8.25 3H5a2 2 0 0 0-2 2v3.25M11.75 3H15a2 2 0 0 1 2 2v3.25M17 11.75V15a2 2 0 0 1-2 2h-3.25M8.25 17H5a2 2 0 0 1-2-2v-3.25" />
				<path d="m7.5 7.5 5 5m0-5-5 5" />
			</svg>
		</MenuIcon>
	);
}

function DeleteIcon() {
	return (
		<MenuIcon>
			<svg aria-hidden="true" viewBox="0 0 20 20">
				<path d="M3.5 5.5h13M8 3.5h4M5.5 5.5l.7 10a1.5 1.5 0 0 0 1.5 1.4h4.6a1.5 1.5 0 0 0 1.5-1.4l.7-10M8 8.5v5.5m4-5.5v5.5" />
			</svg>
		</MenuIcon>
	);
}

function CenterIcon() {
	return (
		<MenuIcon>
			<svg aria-hidden="true" viewBox="0 0 20 20">
				<circle cx="10" cy="10" r="3" />
				<path d="M10 2.5v3M10 14.5v3M2.5 10h3M14.5 10h3" />
			</svg>
		</MenuIcon>
	);
}

function SnapIcon() {
	return (
		<MenuIcon>
			<svg aria-hidden="true" viewBox="0 0 20 20">
				<path d="M5 3.5v8a5 5 0 0 0 10 0v-8M5 7h3M12 7h3" />
			</svg>
		</MenuIcon>
	);
}

function AddIcon() {
	return (
		<MenuIcon>
			<svg aria-hidden="true" viewBox="0 0 20 20">
				<path d="M10 3.5v13M3.5 10h13" />
			</svg>
		</MenuIcon>
	);
}

function TextIcon() {
	return (
		<MenuIcon>
			<svg aria-hidden="true" viewBox="0 0 20 20">
				<path d="M4 5V3.5h12V5M10 3.5v13M7.5 16.5h5" />
			</svg>
		</MenuIcon>
	);
}

function LinkIcon() {
	return (
		<MenuIcon>
			<svg aria-hidden="true" viewBox="0 0 20 20">
				<path d="m8 12 4-4M7 14.5l-1 1a3 3 0 0 1-4.25-4.25l2.5-2.5A3 3 0 0 1 8.5 8M13 5.5l1-1a3 3 0 1 1 4.25 4.25l-2.5 2.5A3 3 0 0 1 11.5 12" />
			</svg>
		</MenuIcon>
	);
}

function CaretRightIcon() {
	return (
		<svg aria-hidden="true" className={styles.caret} viewBox="0 0 16 16">
			<path d="m6 3.5 4.5 4.5L6 12.5" />
		</svg>
	);
}

function SelectionMenu({
	canGroup,
	canUngroup,
	selectionCount,
	onDelete,
	onDuplicate,
	onGroup,
	onUngroup,
}: Pick<
	CanvasContextMenuProps,
	| 'canGroup'
	| 'canUngroup'
	| 'selectionCount'
	| 'onDelete'
	| 'onDuplicate'
	| 'onGroup'
	| 'onUngroup'
>) {
	return (
		<>
			<ContextMenu.Item className={styles.item} onClick={onDuplicate}>
				<DuplicateIcon />
				<span className={styles.label}>Duplicate</span>
				<Shortcut>Ctrl/⌘ D</Shortcut>
			</ContextMenu.Item>

			{canGroup && (
				<ContextMenu.Item className={styles.item} onClick={onGroup}>
					<GroupIcon />
					<span className={styles.label}>Group selection</span>
					<Shortcut>Ctrl/⌘ G</Shortcut>
				</ContextMenu.Item>
			)}

			{canUngroup && (
				<ContextMenu.Item className={styles.item} onClick={onUngroup}>
					<UngroupIcon />
					<span className={styles.label}>Ungroup</span>
					<Shortcut>⇧ Ctrl/⌘ G</Shortcut>
				</ContextMenu.Item>
			)}

			<ContextMenu.Separator className={styles.separator} />

			<ContextMenu.Item
				className={`${styles.item} ${styles.destructiveItem}`}
				onClick={onDelete}
			>
				<DeleteIcon />
				<span className={styles.label}>
					{selectionCount > 1 ? `Delete ${selectionCount} items` : 'Delete'}
				</span>
				<Shortcut>⌫</Shortcut>
			</ContextMenu.Item>
		</>
	);
}

function CanvasMenu({
	isSnapEnabled,
	onCenterViewport,
	onCreateLinkNode,
	onCreateTextNode,
	onToggleSnap,
}: Pick<
	CanvasContextMenuProps,
	| 'isSnapEnabled'
	| 'onCenterViewport'
	| 'onCreateLinkNode'
	| 'onCreateTextNode'
	| 'onToggleSnap'
>) {
	return (
		<>
			<ContextMenu.Item className={styles.item} onClick={onCenterViewport}>
				<CenterIcon />
				<span className={styles.label}>Center canvas</span>
			</ContextMenu.Item>

			<ContextMenu.CheckboxItem
				checked={isSnapEnabled}
				className={styles.item}
				closeOnClick
				onCheckedChange={onToggleSnap}
			>
				<SnapIcon />
				<span className={styles.label}>Snap to grid</span>
				<ContextMenu.CheckboxItemIndicator className={styles.checkmark}>
					<svg aria-hidden="true" viewBox="0 0 16 16">
						<path d="m3.5 8.25 2.75 2.75 6.25-6.25" />
					</svg>
				</ContextMenu.CheckboxItemIndicator>
			</ContextMenu.CheckboxItem>

			<ContextMenu.Separator className={styles.separator} />

			<ContextMenu.SubmenuRoot>
				<ContextMenu.SubmenuTrigger className={styles.submenuTrigger}>
					<AddIcon />
					<span className={styles.label}>Add node</span>
					<CaretRightIcon />
				</ContextMenu.SubmenuTrigger>
				<ContextMenu.Portal>
					<ContextMenu.Positioner
						alignOffset={-5}
						className={styles.positioner}
						collisionPadding={8}
						sideOffset={-3}
					>
						<ContextMenu.Popup className={styles.popup}>
							<ContextMenu.Item
								className={styles.item}
								onClick={onCreateTextNode}
							>
								<TextIcon />
								<span className={styles.label}>Text</span>
							</ContextMenu.Item>
							<ContextMenu.Item
								className={styles.item}
								onClick={onCreateLinkNode}
							>
								<LinkIcon />
								<span className={styles.label}>Link</span>
							</ContextMenu.Item>
						</ContextMenu.Popup>
					</ContextMenu.Positioner>
				</ContextMenu.Portal>
			</ContextMenu.SubmenuRoot>
		</>
	);
}

export function CanvasContextMenu({
	canGroup,
	canUngroup,
	isSelectionMenu,
	isSnapEnabled,
	selectionCount,
	onCenterViewport,
	onCreateLinkNode,
	onCreateTextNode,
	onDelete,
	onDuplicate,
	onGroup,
	onToggleSnap,
	onUngroup,
}: CanvasContextMenuProps) {
	return (
		<ContextMenu.Portal>
			<ContextMenu.Positioner
				className={styles.positioner}
				collisionPadding={8}
			>
				<ContextMenu.Popup className={styles.popup}>
					{isSelectionMenu ? (
						<SelectionMenu
							canGroup={canGroup}
							canUngroup={canUngroup}
							onDelete={onDelete}
							onDuplicate={onDuplicate}
							onGroup={onGroup}
							onUngroup={onUngroup}
							selectionCount={selectionCount}
						/>
					) : (
						<CanvasMenu
							isSnapEnabled={isSnapEnabled}
							onCenterViewport={onCenterViewport}
							onCreateLinkNode={onCreateLinkNode}
							onCreateTextNode={onCreateTextNode}
							onToggleSnap={onToggleSnap}
						/>
					)}
				</ContextMenu.Popup>
			</ContextMenu.Positioner>
		</ContextMenu.Portal>
	);
}
