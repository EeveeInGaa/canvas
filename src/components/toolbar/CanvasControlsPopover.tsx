import { Accordion } from '@base-ui/react/accordion';
import { Popover } from '@base-ui/react/popover';

import {
	CANVAS_SHORTCUT_SECTIONS,
	type CanvasShortcut,
} from '@/components/toolbar/canvasShortcuts';
import styles from './CanvasToolbar.module.css';

type ShortcutListProps = {
	shortcuts: readonly CanvasShortcut[];
};

function ShortcutList({ shortcuts }: ShortcutListProps) {
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

type CanvasControlsPopoverProps = {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
};

export function CanvasControlsPopover({
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
							{CANVAS_SHORTCUT_SECTIONS.map((section) => (
								<Accordion.Item
									className={styles.accordionItem}
									key={section.value}
									value={section.value}
								>
									<Accordion.Header className={styles.accordionHeader}>
										<Accordion.Trigger className={styles.accordionTrigger}>
											<span>{section.title}</span>
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
											<ShortcutList shortcuts={section.shortcuts} />
										</div>
									</Accordion.Panel>
								</Accordion.Item>
							))}
						</Accordion.Root>
					</Popover.Popup>
				</Popover.Positioner>
			</Popover.Portal>
		</Popover.Root>
	);
}
