import type { ReactNode } from 'react';

import {
	GOOD_FRAME_TIME_MS,
	MEDIUM_FRAME_TIME_MS,
	useCanvasPerformance,
} from '@/hooks/useCanvasPerformance';
import type { CanvasDebugStats } from '@/types/canvas-debug.types';
import { CanvasNodeType } from '@/types/canvas-node.types';
import type { Point } from '@/types/geometry.types';
import type { InteractionState } from '@/types/interaction.types';

type CanvasDebugOverlayProps = {
	position: Point | null;
	stats: CanvasDebugStats;
	zoom: number;
	interactionType: InteractionState['type'];
	showNodeContent: boolean;
};

type PerformanceState = 'good' | 'medium' | 'poor';

const PERFORMANCE_CLASS_NAMES: Record<PerformanceState, string> = {
	good: 'text-performance-good',
	medium: 'text-performance-medium',
	poor: 'text-performance-bad',
};

function getPerformanceState(frameTimeMs: number): PerformanceState {
	if (frameTimeMs <= GOOD_FRAME_TIME_MS) {
		return 'good';
	}

	if (frameTimeMs <= MEDIUM_FRAME_TIME_MS) {
		return 'medium';
	}

	return 'poor';
}

type DebugRowProps = {
	label: string;
	children: ReactNode;
};

function DebugRow({ label, children }: DebugRowProps) {
	return (
		<div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3">
			<dt className="text-canvas-muted">{label}</dt>
			<dd className="text-right text-canvas-ink/90 tabular-nums">{children}</dd>
		</div>
	);
}

type DebugSectionProps = {
	title: string;
	children: ReactNode;
};

function DebugSection({ title, children }: DebugSectionProps) {
	return (
		<section className="border-canvas-ink/[0.08] border-t px-3 py-2">
			<h3 className="mb-1.5 font-sans text-[9px] leading-none font-semibold tracking-[0.12em] text-canvas-muted uppercase">
				{title}
			</h3>
			<dl className="space-y-0.5">{children}</dl>
		</section>
	);
}

export function CanvasDebugOverlay({
	position,
	stats,
	zoom,
	interactionType,
	showNodeContent,
}: CanvasDebugOverlayProps) {
	const performance = useCanvasPerformance();
	const performanceState =
		performance.frameTimeP95Ms === null
			? null
			: getPerformanceState(performance.frameTimeP95Ms);
	const mountedOffscreenNodeCount =
		stats.overscanNodeCount + stats.retainedOffscreenNodeCount;

	return (
		<aside
			aria-label="Canvas debug information"
			className="pointer-events-none absolute right-3 bottom-3 z-10 w-[270px] overflow-hidden rounded-xl border border-canvas-ink/[0.14] bg-panel/[0.94] font-mono text-[11px] leading-[1.45] text-canvas-ink/[0.82] shadow-[var(--canvas-popover-shadow)] backdrop-blur-xl"
			data-testid="canvas-debug-overlay"
		>
			<div className="flex items-center justify-between px-3 py-2">
				<h2 className="font-sans text-[10px] font-semibold tracking-[0.1em] text-canvas-ink/70 uppercase">
					Canvas debug
				</h2>
				<span className="rounded-full bg-canvas-ink/[0.06] px-1.5 py-0.5 text-[9px] text-canvas-muted">
					live
				</span>
			</div>

			<DebugSection title="Pointer & view">
				<DebugRow label="Cursor">
					x {position ? Math.round(position.x) : '—'} · y{' '}
					{position ? Math.round(position.y) : '—'}
				</DebugRow>
				<DebugRow label="Zoom">{Math.round(zoom * 100)}%</DebugRow>
				<DebugRow label="Interaction">{interactionType}</DebugRow>
				<DebugRow label="Node detail">
					{showNodeContent ? 'full' : 'skeleton'}
				</DebugRow>
			</DebugSection>

			<DebugSection title="Document">
				<DebugRow label="Nodes">{stats.totalNodeCount}</DebugRow>
				<DebugRow label="Types">
					text {stats.nodeTypeCounts[CanvasNodeType.Text]} · link{' '}
					{stats.nodeTypeCounts[CanvasNodeType.Link]}
				</DebugRow>
				<DebugRow label="Groups">{stats.totalGroupCount}</DebugRow>
			</DebugSection>

			<DebugSection title="Selection">
				<DebugRow label="Targets">{stats.selectionTargetCount}</DebugRow>
				<DebugRow label="Direct nodes">{stats.selectedNodeCount}</DebugRow>
				<DebugRow label="Groups">{stats.selectedGroupCount}</DebugRow>
				<DebugRow label="Affected nodes">{stats.affectedNodeCount}</DebugRow>
			</DebugSection>

			<DebugSection title="Visibility & DOM">
				<DebugRow label="In viewport">{stats.visibleNodeCount}</DebugRow>
				<DebugRow label="Outside">{stats.hiddenNodeCount}</DebugRow>
				<DebugRow label="Mounted">{stats.mountedNodeCount}</DebugRow>
				<DebugRow label="Culled">{stats.culledNodeCount}</DebugRow>
				<DebugRow label="Mounted offscreen">
					{mountedOffscreenNodeCount}
				</DebugRow>
				<div className="text-right text-[9px] text-canvas-muted tabular-nums">
					{stats.overscanNodeCount} overscan ·{' '}
					{stats.retainedOffscreenNodeCount} active
				</div>
			</DebugSection>

			<DebugSection title="Performance">
				<DebugRow label="Frame p95">
					{performanceState === null || performance.frameTimeP95Ms === null ? (
						<span className="text-canvas-muted">sampling…</span>
					) : (
						<span className={PERFORMANCE_CLASS_NAMES[performanceState]}>
							{performance.frameTimeP95Ms.toFixed(1)} ms · {performanceState}
						</span>
					)}
				</DebugRow>
				<DebugRow label={`Slow frames (>${GOOD_FRAME_TIME_MS} ms)`}>
					{performance.slowFramePercentage === null
						? '—'
						: `${performance.slowFramePercentage.toFixed(1)}%`}
				</DebugRow>
			</DebugSection>
		</aside>
	);
}
