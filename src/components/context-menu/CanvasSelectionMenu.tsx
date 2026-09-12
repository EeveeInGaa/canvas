import { ContextMenu } from '@base-ui/react/context-menu';
import type { ReactNode } from 'react';

import {
	DeleteIcon,
	DuplicateIcon,
	GroupIcon,
	UngroupIcon,
} from '@/components/context-menu/CanvasMenuIcons';
import styles from './CanvasContextMenu.module.css';

type CanvasSelectionMenuProps = {
	canGroup: boolean;
	canUngroup: boolean;
	selectionCount: number;
	onDelete: () => void;
	onDuplicate: () => void;
	onGroup: () => void;
	onUngroup: () => void;
};

function Shortcut({ children }: { children: ReactNode }) {
	return <span className={styles.shortcut}>{children}</span>;
}

export function CanvasSelectionMenu({
	canGroup,
	canUngroup,
	selectionCount,
	onDelete,
	onDuplicate,
	onGroup,
	onUngroup,
}: CanvasSelectionMenuProps) {
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
