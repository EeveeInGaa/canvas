import { CanvasControlsPopover } from '@/components/toolbar/CanvasControlsPopover';
import { CanvasToolbarButton } from '@/components/toolbar/CanvasToolbarButton';
import { CanvasZoomPopover } from '@/components/toolbar/CanvasZoomPopover';
import {
	CanvasOrientation,
	CanvasSizePreset,
	type CanvasSpace,
} from '@/types/canvas-space.types';
import { CANVAS_PRESETS } from '@/utils/canvas-space';

type CanvasToolbarProps = {
	canRedo: boolean;
	canUndo: boolean;
	isDebugEnabled: boolean;
	isInfoOpen: boolean;
	isSnapEnabled: boolean;
	zoom: number;
	canvasSpace: CanvasSpace;
	isCanvasSpaceAvailable: (space: CanvasSpace) => boolean;
	onCanvasSpaceChange: (space: CanvasSpace) => void;
	onFitCanvas: () => void;
	onCenterViewport: () => void;
	onZoomChange: (zoom: number) => void;
	onRedo: () => void;
	onToggleDebug: () => void;
	onInfoOpenChange: (isOpen: boolean) => void;
	onToggleSnap: () => void;
	onUndo: () => void;
	onCreateTextNode: () => void;
	onCreateLinkNode: () => void;
};

export function CanvasToolbar({
	canRedo,
	canUndo,
	isDebugEnabled,
	isInfoOpen,
	isSnapEnabled,
	zoom,
	canvasSpace,
	isCanvasSpaceAvailable,
	onCanvasSpaceChange,
	onFitCanvas,
	onCenterViewport,
	onZoomChange,
	onRedo,
	onToggleDebug,
	onInfoOpenChange,
	onToggleSnap,
	onUndo,
	onCreateTextNode,
	onCreateLinkNode,
}: CanvasToolbarProps) {
	const orientation =
		canvasSpace.kind === 'bounded'
			? canvasSpace.orientation
			: CanvasOrientation.Portrait;
	const selectClassName =
		'h-8 cursor-pointer rounded-full border border-canvas-ink/[0.14] bg-panel px-3 text-xs font-semibold text-canvas-ink/[0.82] outline-none transition-colors hover:border-accent/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-45';

	return (
		<>
			<div className="absolute top-3 right-3 z-10 flex max-w-[calc(100%-5rem)] flex-wrap justify-end gap-2">
				<div className="flex gap-1 rounded-full bg-panel/70 p-0.5 shadow-sm backdrop-blur-sm">
					<label className="sr-only" htmlFor="canvas-size">
						Canvas size
					</label>
					<select
						className={selectClassName}
						id="canvas-size"
						onChange={(event) => {
							const preset = event.currentTarget.value;

							onCanvasSpaceChange(
								preset === 'infinite'
									? { kind: 'infinite' }
									: {
											kind: 'bounded',
											preset: preset as CanvasSizePreset,
											orientation,
										},
							);
						}}
						value={
							canvasSpace.kind === 'infinite' ? 'infinite' : canvasSpace.preset
						}
					>
						<option value="infinite">Infinite</option>
						{Object.values(CanvasSizePreset).map((preset) => {
							const space: CanvasSpace = {
								kind: 'bounded',
								preset,
								orientation,
							};

							return (
								<option
									disabled={!isCanvasSpaceAvailable(space)}
									key={preset}
									value={preset}
								>
									{CANVAS_PRESETS[preset].label}
								</option>
							);
						})}
					</select>

					<label className="sr-only" htmlFor="canvas-orientation">
						Canvas orientation
					</label>
					<select
						className={selectClassName}
						disabled={canvasSpace.kind === 'infinite'}
						id="canvas-orientation"
						onChange={(event) => {
							if (canvasSpace.kind === 'infinite') {
								return;
							}

							onCanvasSpaceChange({
								...canvasSpace,
								orientation: event.currentTarget.value as CanvasOrientation,
							});
						}}
						value={orientation}
					>
						<option
							disabled={
								canvasSpace.kind === 'bounded' &&
								!isCanvasSpaceAvailable({
									...canvasSpace,
									orientation: CanvasOrientation.Portrait,
								})
							}
							value={CanvasOrientation.Portrait}
						>
							Portrait
						</option>
						<option
							disabled={
								canvasSpace.kind === 'bounded' &&
								!isCanvasSpaceAvailable({
									...canvasSpace,
									orientation: CanvasOrientation.Landscape,
								})
							}
							value={CanvasOrientation.Landscape}
						>
							Landscape
						</option>
					</select>
				</div>
				<CanvasZoomPopover zoom={zoom} onZoomChange={onZoomChange} />
				{canvasSpace.kind === 'bounded' ? (
					<CanvasToolbarButton onClick={onFitCanvas}>Fit</CanvasToolbarButton>
				) : null}
				<CanvasToolbarButton onClick={onCenterViewport}>
					Center
				</CanvasToolbarButton>
				<CanvasToolbarButton disabled={!canUndo} onClick={onUndo}>
					Undo
				</CanvasToolbarButton>
				<CanvasToolbarButton disabled={!canRedo} onClick={onRedo}>
					Redo
				</CanvasToolbarButton>
				<CanvasToolbarButton isPressed={isDebugEnabled} onClick={onToggleDebug}>
					Debug: {isDebugEnabled ? 'On' : 'Off'}
				</CanvasToolbarButton>
				<CanvasToolbarButton isPressed={isSnapEnabled} onClick={onToggleSnap}>
					Snap: {isSnapEnabled ? 'On' : 'Off'}
				</CanvasToolbarButton>
				<CanvasControlsPopover
					isOpen={isInfoOpen}
					onOpenChange={onInfoOpenChange}
				/>
			</div>

			<div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
				<CanvasToolbarButton onClick={onCreateTextNode}>
					Text
				</CanvasToolbarButton>
				<CanvasToolbarButton onClick={onCreateLinkNode}>
					Link
				</CanvasToolbarButton>
			</div>
		</>
	);
}
