import { useEffect, useRef, useState } from 'react';

import type { CanvasFrameMetrics } from '@/types/canvas-debug.types';

export const GOOD_FRAME_TIME_MS = 20;
export const MEDIUM_FRAME_TIME_MS = 40;

const SAMPLE_WINDOW_MS = 2_000;
const UPDATE_INTERVAL_MS = 500;
const MAX_VALID_FRAME_TIME_MS = 1_000;

type FrameSample = {
	timestamp: number;
	duration: number;
};

const INITIAL_METRICS: CanvasFrameMetrics = {
	frameTimeP95Ms: null,
	slowFramePercentage: null,
};

export function useCanvasPerformance(): CanvasFrameMetrics {
	const [metrics, setMetrics] = useState<CanvasFrameMetrics>(INITIAL_METRICS);
	const animationFrameRef = useRef<number | null>(null);

	useEffect(() => {
		let previousTimestamp: number | null = null;
		let lastUpdateTimestamp = performance.now();
		let samples: FrameSample[] = [];

		const resetSamples = () => {
			previousTimestamp = null;
			lastUpdateTimestamp = performance.now();
			samples = [];
		};

		const measureFrame = (timestamp: number) => {
			if (previousTimestamp !== null) {
				const duration = timestamp - previousTimestamp;

				if (duration <= MAX_VALID_FRAME_TIME_MS) {
					samples.push({ timestamp, duration });
				}
			}

			previousTimestamp = timestamp;

			if (
				samples.length > 0 &&
				timestamp - lastUpdateTimestamp >= UPDATE_INTERVAL_MS
			) {
				const windowStart = timestamp - SAMPLE_WINDOW_MS;
				samples = samples.filter((sample) => sample.timestamp >= windowStart);

				if (samples.length > 0) {
					const durations = samples
						.map((sample) => sample.duration)
						.toSorted(
							(leftDuration, rightDuration) => leftDuration - rightDuration,
						);
					const percentileIndex = Math.max(
						0,
						Math.ceil(durations.length * 0.95) - 1,
					);
					const slowFrameCount = durations.reduce(
						(count, duration) =>
							duration > GOOD_FRAME_TIME_MS ? count + 1 : count,
						0,
					);

					setMetrics({
						frameTimeP95Ms: durations[percentileIndex],
						slowFramePercentage: (slowFrameCount / durations.length) * 100,
					});
				}

				lastUpdateTimestamp = timestamp;
			}

			animationFrameRef.current = requestAnimationFrame(measureFrame);
		};

		const handleVisibilityChange = () => {
			if (document.visibilityState === 'visible') {
				resetSamples();
			}
		};

		document.addEventListener('visibilitychange', handleVisibilityChange);
		animationFrameRef.current = requestAnimationFrame(measureFrame);

		return () => {
			document.removeEventListener('visibilitychange', handleVisibilityChange);

			if (animationFrameRef.current !== null) {
				cancelAnimationFrame(animationFrameRef.current);
			}
		};
	}, []);

	return metrics;
}
