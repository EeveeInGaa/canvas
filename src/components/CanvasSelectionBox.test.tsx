import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CanvasSelectionBox } from '@/components/CanvasSelectionBox';

describe('CanvasSelectionBox', () => {
	it('renders nothing without a selection rectangle', () => {
		const { container } = render(<CanvasSelectionBox rect={null} />);

		expect(container).toBeEmptyDOMElement();
	});

	it('renders a decorative, non-interactive box at the supplied rectangle', () => {
		const { container } = render(
			<CanvasSelectionBox rect={{ x: 18, y: -4, width: 140, height: 72 }} />,
		);

		const selectionBox = container.firstElementChild;

		expect(selectionBox).toHaveAttribute('aria-hidden', 'true');
		expect(selectionBox).toHaveClass('pointer-events-none');
		expect(selectionBox).toHaveStyle({
			left: '18px',
			top: '-4px',
			width: '140px',
			height: '72px',
		});
	});
});
