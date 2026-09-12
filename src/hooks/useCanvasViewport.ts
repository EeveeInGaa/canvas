import {
	type Dispatch,
	type RefObject,
	type SetStateAction,
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from 'react';

import type { Viewport } from '@/types/viewport.types.ts';
import { clampScale } from '@/utils/viewport.ts';

type UseCanvasViewportParams = {
	canvasRef: RefObject<HTMLDivElement | null>;
};

type UseCanvasViewportResult = {
	viewport: Viewport;
	setViewport: Dispatch<SetStateAction<Viewport>>;
	centerViewportOnOrigin: () => void;
};

const INITIAL_SCALE = 1;
const ZOOM_SENSITIVITY = 0.01;

export function useCanvasViewport({
	canvasRef,
}: UseCanvasViewportParams): UseCanvasViewportResult {
	const [viewport, setViewport] = useState<Viewport>({
		x: 0,
		y: 0,
		scale: INITIAL_SCALE,
	});

	const hasCenteredInitialViewportRef = useRef(false);

	const centerViewportOnOrigin = useCallback(() => {
		const canvasElement = canvasRef.current;

		if (!canvasElement) {
			return;
		}

		const canvasRect = canvasElement.getBoundingClientRect();

		setViewport((currentViewport) => ({
			...currentViewport,
			x: canvasRect.width / 2,
			y: canvasRect.height / 2,
		}));
	}, [canvasRef]);

	useLayoutEffect(() => {
		if (hasCenteredInitialViewportRef.current) {
			return;
		}

		const canvasElement = canvasRef.current;

		if (!canvasElement) {
			return;
		}

		hasCenteredInitialViewportRef.current = true;
		centerViewportOnOrigin();
	}, [canvasRef, centerViewportOnOrigin]);

	useEffect(() => {
		const canvasElement = canvasRef.current;

		if (!canvasElement) {
			return;
		}

		const handleWheel = (event: WheelEvent) => {
			event.preventDefault();

			const canvasRect = canvasElement.getBoundingClientRect();

			const isZoomGesture = event.ctrlKey || event.metaKey;

			if (!isZoomGesture) {
				setViewport((currentViewport) => ({
					...currentViewport,
					x: currentViewport.x - event.deltaX,
					y: currentViewport.y - event.deltaY,
				}));

				return;
			}

			const pointerX = event.clientX - canvasRect.left;
			const pointerY = event.clientY - canvasRect.top;

			setViewport((currentViewport) => {
				const nextScale = clampScale(
					currentViewport.scale * Math.exp(-event.deltaY * ZOOM_SENSITIVITY),
				);

				const canvasX = (pointerX - currentViewport.x) / currentViewport.scale;

				const canvasY = (pointerY - currentViewport.y) / currentViewport.scale;

				return {
					x: pointerX - canvasX * nextScale,
					y: pointerY - canvasY * nextScale,
					scale: nextScale,
				};
			});
		};

		canvasElement.addEventListener('wheel', handleWheel, {
			passive: false,
		});

		return () => {
			canvasElement.removeEventListener('wheel', handleWheel);
		};
	}, [canvasRef]);

	return {
		viewport,
		setViewport,
		centerViewportOnOrigin,
	};
}
