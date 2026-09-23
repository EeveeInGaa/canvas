import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useCanvasDocument } from '@/hooks/useCanvasDocument';
import { createTextNode } from '@/utils/node';

function CanvasDocumentHarness() {
	const controller = useCanvasDocument();

	return (
		<>
			<output aria-label="Node count">{controller.nodes.length}</output>
			<output aria-label="Can undo">{String(controller.canUndo)}</output>
			<button
				type="button"
				onClick={() => {
					controller.commitNodes([
						{ ...createTextNode({ x: 0, y: 0 }), id: 'node' },
					]);
				}}
			>
				Add node
			</button>
			<button
				type="button"
				onClick={() => {
					controller.commitNodes((nodes) => nodes.map((node) => ({ ...node })));
				}}
			>
				No-op update
			</button>
			<button type="button" onClick={controller.undo}>
				Undo
			</button>
		</>
	);
}

describe('useCanvasDocument', () => {
	it('does not add history for a semantic no-op', () => {
		render(<CanvasDocumentHarness />);

		fireEvent.click(screen.getByRole('button', { name: 'Add node' }));
		expect(screen.getByLabelText('Node count')).toHaveTextContent('1');
		expect(screen.getByLabelText('Can undo')).toHaveTextContent('true');

		fireEvent.click(screen.getByRole('button', { name: 'No-op update' }));
		fireEvent.click(screen.getByRole('button', { name: 'Undo' }));

		expect(screen.getByLabelText('Node count')).toHaveTextContent('0');
		expect(screen.getByLabelText('Can undo')).toHaveTextContent('false');
	});
});
