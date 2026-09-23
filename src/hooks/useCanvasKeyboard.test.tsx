import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useCanvasKeyboard } from '@/hooks/useCanvasKeyboard';

const noOp = () => {};
const params: Parameters<typeof useCanvasKeyboard>[0] = {
	moveDistance: 5,
	shiftMoveDistance: 20,
	onCenterViewport: noOp,
	onCreateLinkNode: noOp,
	onCreateTextNode: noOp,
	onDelete: noOp,
	onDuplicate: noOp,
	onToggleDebug: noOp,
	onToggleInfo: noOp,
	onToggleSnap: noOp,
	onZoomBy: noOp,
};

afterEach(() => {
	vi.restoreAllMocks();
});

describe('useCanvasKeyboard', () => {
	it('registers listeners once and resets Space on blur', () => {
		const addEventListener = vi.spyOn(window, 'addEventListener');
		const removeEventListener = vi.spyOn(window, 'removeEventListener');
		const { result, rerender, unmount } = renderHook(() =>
			useCanvasKeyboard(params),
		);

		rerender();
		expect(
			addEventListener.mock.calls.filter(([type]) =>
				['keydown', 'keyup', 'blur'].includes(type),
			),
		).toHaveLength(3);

		act(() => {
			window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
		});
		expect(result.current.isSpacePressed).toBe(true);

		act(() => {
			window.dispatchEvent(new Event('blur'));
		});
		expect(result.current.isSpacePressed).toBe(false);

		unmount();
		expect(
			removeEventListener.mock.calls.filter(([type]) =>
				['keydown', 'keyup', 'blur'].includes(type),
			),
		).toHaveLength(3);
	});
});
