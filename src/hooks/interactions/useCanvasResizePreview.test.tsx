import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useCanvasResizePreview } from '@/hooks/interactions/useCanvasResizePreview';

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('useCanvasResizePreview', () => {
	it('coalesces resize previews into one animation frame', () => {
		const requestAnimationFrame = vi.fn(() => 1);
		const cancelAnimationFrame = vi.fn();
		vi.stubGlobal('requestAnimationFrame', requestAnimationFrame);
		vi.stubGlobal('cancelAnimationFrame', cancelAnimationFrame);

		const { result, unmount } = renderHook(() =>
			useCanvasResizePreview({
				groups: [],
				nodeById: new Map(),
				groupRectById: new Map(),
				nodeElementsRef: { current: new Map() },
				groupElementsRef: { current: new Map() },
			}),
		);

		act(() => {
			result.current.schedulePreview({
				nodeId: 'node',
				width: 100,
				height: 100,
			});
			result.current.schedulePreview({
				nodeId: 'node',
				width: 110,
				height: 110,
			});
			result.current.schedulePreview({
				nodeId: 'node',
				width: 120,
				height: 120,
			});
		});

		expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
		expect(result.current.latestSizeRef.current).toEqual({
			nodeId: 'node',
			width: 120,
			height: 120,
		});

		unmount();
		expect(cancelAnimationFrame).toHaveBeenCalledWith(1);
	});
});
