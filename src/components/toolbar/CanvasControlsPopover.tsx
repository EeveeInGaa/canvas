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
		<dl className="grid gap-[7px]">
			{shortcuts.map((shortcut) => (
				<div
					className="flex min-h-6 items-center justify-between gap-4 text-xs leading-[1.3]"
					key={`${shortcut.action}-${shortcut.keys.join('-')}`}
				>
					<dt className="text-canvas-ink/70">{shortcut.action}</dt>
					<dd className="flex items-center justify-end whitespace-nowrap">
						{shortcut.keys.map((key, index) => (
							<span key={key} className="inline-flex items-center">
								{index > 0 && (
									<span
										aria-hidden="true"
										className="mx-1 text-[10px] text-canvas-ink/30"
									>
										+
									</span>
								)}
								<kbd className="min-w-[23px] rounded-[5px] border border-canvas-ink/[0.13] border-b-canvas-ink/20 bg-key px-1.5 py-1 text-center font-[inherit] text-[10px] leading-none font-semibold text-canvas-ink/[0.82] shadow-[var(--canvas-key-shadow)]">
									{key}
								</kbd>
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
				className="grid size-[30px] cursor-pointer place-items-center rounded-full border border-canvas-ink/[0.14] bg-panel font-serif text-sm leading-none font-bold text-canvas-ink/[0.72] transition-[background-color,border-color,color,transform] duration-[120ms] ease-[ease] hover:border-accent/50 hover:bg-panel-hover hover:text-accent-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus active:scale-[0.94] data-[popup-open]:border-accent/[0.65] data-[popup-open]:bg-accent data-[popup-open]:text-accent-contrast motion-reduce:transition-none"
				data-canvas-shortcuts-trigger=""
				onPointerDown={(event) => event.stopPropagation()}
			>
				<span aria-hidden="true">i</span>
			</Popover.Trigger>

			<Popover.Portal>
				<Popover.Positioner
					align="end"
					className="z-20"
					collisionPadding={12}
					side="bottom"
					sideOffset={8}
				>
					<Popover.Popup
						className={`${styles.popupMotion} box-border max-h-[calc(100vh-24px)] w-[min(320px,calc(100vw-24px))] overflow-y-auto rounded-[14px] border border-canvas-ink/[0.14] bg-panel/[0.98] p-4 text-canvas-ink/[0.84] shadow-[var(--canvas-popover-shadow)] outline-none backdrop-blur-[16px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus`}
						data-canvas-shortcuts-dialog=""
						onPointerDown={(event) => event.stopPropagation()}
					>
						<Popover.Title className="text-sm leading-[1.3] font-semibold text-canvas-ink/[0.96]">
							Canvas controls
						</Popover.Title>
						<Popover.Description className="mt-[3px] text-[11px] leading-[1.4] text-canvas-muted">
							Keyboard and pointer shortcuts
						</Popover.Description>

						<Accordion.Root
							className="mt-3.5 border-canvas-ink/[0.08] border-t"
							defaultValue={[]}
						>
							{CANVAS_SHORTCUT_SECTIONS.map((section) => (
								<Accordion.Item
									className="border-canvas-ink/[0.08] border-b"
									key={section.value}
									value={section.value}
								>
									<Accordion.Header>
										<Accordion.Trigger className="group flex w-full cursor-pointer items-center justify-between border-0 bg-transparent px-0.5 py-[11px] text-start font-[inherit] text-[10px] leading-[1.2] font-semibold tracking-[0.08em] text-canvas-ink/[0.58] uppercase transition-colors duration-[120ms] ease-[ease] hover:text-canvas-ink/90 focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus motion-reduce:transition-none">
											<span>{section.title}</span>
											<svg
												aria-hidden="true"
												className="size-3.5 flex-none fill-none stroke-current stroke-[1.5] [stroke-linecap:round] [stroke-linejoin:round] transition-transform duration-[160ms] group-data-[panel-open]:rotate-180 motion-reduce:transition-none"
												viewBox="0 0 16 16"
											>
												<path d="m4 6 4 4 4-4" />
											</svg>
										</Accordion.Trigger>
									</Accordion.Header>
									<Accordion.Panel
										className={`${styles.accordionPanelMotion} overflow-hidden`}
									>
										<div className="px-0.5 pt-0.5 pb-3">
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
