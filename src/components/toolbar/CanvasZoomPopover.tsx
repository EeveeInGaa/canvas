import { Popover } from '@base-ui/react/popover';
import { Slider } from '@base-ui/react/slider';

import styles from './CanvasToolbar.module.css';

type CanvasZoomPopoverProps = {
	zoom: number;
	onZoomChange: (zoom: number) => void;
};

const MIN_ZOOM_PERCENTAGE = 30;
const MAX_ZOOM_PERCENTAGE = 300;
const ZOOM_STEP = 10;

function getZoomPercentage(zoom: number): number {
	return Math.round(zoom * 100);
}

function getSliderValue(zoomPercentage: number): number {
	return Math.min(
		Math.max(zoomPercentage, MIN_ZOOM_PERCENTAGE),
		MAX_ZOOM_PERCENTAGE,
	);
}

export function CanvasZoomPopover({
	zoom,
	onZoomChange,
}: CanvasZoomPopoverProps) {
	const zoomPercentage = getZoomPercentage(zoom);
	const sliderValue = getSliderValue(zoomPercentage);

	const changeZoom = (nextPercentage: number) => {
		onZoomChange(nextPercentage / 100);
	};

	const zoomOut = () => {
		const nextPercentage =
			Math.ceil(zoomPercentage / ZOOM_STEP) * ZOOM_STEP - ZOOM_STEP;

		changeZoom(Math.max(nextPercentage, MIN_ZOOM_PERCENTAGE));
	};

	const zoomIn = () => {
		const nextPercentage =
			Math.floor(zoomPercentage / ZOOM_STEP) * ZOOM_STEP + ZOOM_STEP;

		changeZoom(Math.min(nextPercentage, MAX_ZOOM_PERCENTAGE));
	};

	return (
		<Popover.Root>
			<Popover.Trigger
				aria-label={`Zoom: ${zoomPercentage}%`}
				className="flex min-w-[58px] cursor-pointer items-center justify-center gap-1 rounded-full border border-canvas-ink/[0.14] bg-panel px-2.5 py-1.5 text-xs font-semibold tabular-nums text-canvas-ink/[0.82] transition-[background-color,border-color,color,transform] duration-[120ms] ease-[ease] hover:border-accent/50 hover:bg-panel-hover hover:text-accent-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus active:scale-[0.97] data-[popup-open]:border-accent/[0.65] data-[popup-open]:bg-accent data-[popup-open]:text-accent-contrast motion-reduce:transition-none"
				onPointerDown={(event) => event.stopPropagation()}
			>
				<span>{zoomPercentage}%</span>
				<svg
					aria-hidden="true"
					className="size-2.5 fill-none stroke-current stroke-[1.7] [stroke-linecap:round] [stroke-linejoin:round]"
					viewBox="0 0 12 12"
				>
					<path d="m3 4.5 3 3 3-3" />
				</svg>
			</Popover.Trigger>

			<Popover.Portal>
				<Popover.Positioner
					align="center"
					className="z-20"
					collisionPadding={12}
					side="bottom"
					sideOffset={8}
				>
					<Popover.Popup
						className={`${styles.popupMotion} w-[230px] rounded-[14px] border border-canvas-ink/[0.14] bg-panel/[0.98] p-3.5 text-canvas-ink/[0.84] shadow-[var(--canvas-popover-shadow)] outline-none backdrop-blur-[16px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus`}
						onPointerDown={(event) => event.stopPropagation()}
					>
						<Slider.Root
							className="grid grid-cols-[auto_1fr_auto] items-center gap-3"
							max={MAX_ZOOM_PERCENTAGE}
							min={MIN_ZOOM_PERCENTAGE}
							onValueChange={changeZoom}
							step={ZOOM_STEP}
							value={sliderValue}
						>
							<div className="col-span-3 flex items-center justify-between">
								<Slider.Label className="text-[11px] font-semibold tracking-[0.04em] text-canvas-muted uppercase">
									Zoom
								</Slider.Label>
								<span
									aria-hidden="true"
									className="text-xs font-semibold tabular-nums text-canvas-ink/[0.92]"
								>
									{zoomPercentage}%
								</span>
							</div>

							<button
								aria-label="Zoom out"
								className="grid size-7 cursor-pointer place-items-center rounded-full border border-canvas-ink/[0.12] bg-canvas text-base leading-none text-canvas-ink/70 transition-colors hover:border-accent/50 hover:text-accent-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-35"
								disabled={zoomPercentage <= MIN_ZOOM_PERCENTAGE}
								onClick={zoomOut}
								type="button"
							>
								<span aria-hidden="true">−</span>
							</button>

							<Slider.Control className="flex h-7 touch-none select-none items-center">
								<Slider.Track className="relative h-1 w-full rounded-full bg-canvas-ink/[0.12]">
									<Slider.Indicator className="rounded-full bg-accent" />
									<Slider.Thumb
										className={`${styles.sliderThumb} size-4 rounded-full border-2 border-panel bg-accent shadow-[0_1px_4px_rgb(31_36_48_/_28%)]`}
										getAriaLabel={() => 'Zoom level'}
										getAriaValueText={(_formattedValue, value) => `${value}%`}
									/>
								</Slider.Track>
							</Slider.Control>

							<button
								aria-label="Zoom in"
								className="grid size-7 cursor-pointer place-items-center rounded-full border border-canvas-ink/[0.12] bg-canvas text-base leading-none text-canvas-ink/70 transition-colors hover:border-accent/50 hover:text-accent-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-35"
								disabled={zoomPercentage >= MAX_ZOOM_PERCENTAGE}
								onClick={zoomIn}
								type="button"
							>
								<span aria-hidden="true">+</span>
							</button>
						</Slider.Root>
					</Popover.Popup>
				</Popover.Positioner>
			</Popover.Portal>
		</Popover.Root>
	);
}
