import { ContextMenu } from '@base-ui/react/context-menu';

import {
	AddIcon,
	CaretRightIcon,
	CenterIcon,
	LinkIcon,
	SnapIcon,
	TextIcon,
} from '@/components/context-menu/CanvasMenuIcons';
import styles from './CanvasContextMenu.module.css';

type CanvasWorkspaceMenuProps = {
	isSnapEnabled: boolean;
	onCenterViewport: () => void;
	onCreateLinkNode: () => void;
	onCreateTextNode: () => void;
	onToggleSnap: () => void;
};

export function CanvasWorkspaceMenu({
	isSnapEnabled,
	onCenterViewport,
	onCreateLinkNode,
	onCreateTextNode,
	onToggleSnap,
}: CanvasWorkspaceMenuProps) {
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
