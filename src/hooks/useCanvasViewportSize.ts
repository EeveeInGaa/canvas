import { type RefObject, useLayoutEffect, useState } from 'react';

import type { Size } from '@/types/geometry.types';

const EMPTY_SIZE: Size = { width: 0, height: 0 };

export function useCanvasViewportSize(
	canvasRef: RefObject<HTMLElement | null>,
): Size {
	const [size, setSize] = useState<Size>(EMPTY_SIZE);

	useLayoutEffect(() => {
		const canvasElement = canvasRef.current;

		if (!canvasElement) {
			return;
		}

		const updateSize = () => {
			const nextSize = {
				width: canvasElement.clientWidth,
				height: canvasElement.clientHeight,
			};

			setSize((currentSize) =>
				currentSize.width === nextSize.width &&
				currentSize.height === nextSize.height
					? currentSize
					: nextSize,
			);
		};

		updateSize();

		const resizeObserver = new ResizeObserver(updateSize);
		resizeObserver.observe(canvasElement);

		return () => {
			resizeObserver.disconnect();
		};
	}, [canvasRef]);

	return size;
}
