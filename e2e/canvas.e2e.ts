import { expect, type Locator, type Page, test } from '@playwright/test';

const nodeSelector = '[data-node-id]';
const selectedNodeSelector = `${nodeSelector}[data-selected="true"]`;

async function createTextNode(page: Page, text: string): Promise<Locator> {
	const nodes = page.locator(nodeSelector);
	const previousCount = await nodes.count();

	await page.getByRole('button', { name: 'Text', exact: true }).click();

	const node = nodes.nth(previousCount);
	const editor = node.locator('textarea');

	await expect(editor).toBeFocused();
	await editor.fill(text);
	await editor.press('Escape');
	await expect(node).toContainText(text);

	return node;
}

async function pressKey(page: Page, key: string, count: number) {
	for (let index = 0; index < count; index += 1) {
		await page.keyboard.press(key);
	}
}

async function getNodeCenter(node: Locator) {
	return node.evaluate((element) => ({
		x:
			Number.parseFloat((element as HTMLElement).style.left) +
			Number.parseFloat((element as HTMLElement).style.width) / 2,
		y:
			Number.parseFloat((element as HTMLElement).style.top) +
			Number.parseFloat((element as HTMLElement).style.height) / 2,
	}));
}

async function createSeparatedNodes(page: Page) {
	await createTextNode(page, 'Left node');
	await pressKey(page, 'Shift+ArrowLeft', 6);

	await createTextNode(page, 'Right node');
	await pressKey(page, 'Shift+ArrowRight', 6);
}

async function dragWithinCanvas(
	page: Page,
	start: { x: number; y: number },
	end: { x: number; y: number },
) {
	const canvas = page.getByRole('application', { name: 'Canvas workspace' });
	const canvasBox = await canvas.boundingBox();

	if (!canvasBox) {
		throw new Error('Canvas is not visible');
	}

	await page.mouse.move(canvasBox.x + start.x, canvasBox.y + start.y);
	await page.mouse.down();
	await page.mouse.move(canvasBox.x + end.x, canvasBox.y + end.y, {
		steps: 5,
	});
}

async function selectBothNodes(page: Page) {
	const { start, end } = await getSelectionPoints(page);

	await dragWithinCanvas(page, start, end);
	await page.mouse.up();
	await expect(page.locator(selectedNodeSelector)).toHaveCount(2);
}

async function getSelectionPoints(page: Page) {
	const canvas = page.getByRole('application', { name: 'Canvas workspace' });
	const canvasBox = await canvas.boundingBox();
	const nodeBoxes = await page.locator(nodeSelector).evaluateAll((elements) =>
		elements.map((element) => {
			const rect = element.getBoundingClientRect();

			return {
				left: rect.left,
				top: rect.top,
				right: rect.right,
				bottom: rect.bottom,
			};
		}),
	);

	if (!canvasBox || nodeBoxes.length === 0) {
		throw new Error('Canvas and nodes must have layout boxes');
	}

	const margin = 20;

	return {
		start: {
			x: Math.min(...nodeBoxes.map((box) => box.left)) - canvasBox.x - margin,
			y: Math.min(...nodeBoxes.map((box) => box.top)) - canvasBox.y - margin,
		},
		end: {
			x: Math.max(...nodeBoxes.map((box) => box.right)) - canvasBox.x + margin,
			y: Math.max(...nodeBoxes.map((box) => box.bottom)) - canvasBox.y + margin,
		},
	};
}

test.beforeEach(async ({ page }) => {
	await page.goto('/');
	await expect(
		page.getByRole('application', { name: 'Canvas workspace' }),
	).toBeVisible();
});

test('creates and edits a text node', async ({ page }) => {
	const node = await createTextNode(page, 'Release checklist');

	await expect(node).toHaveAttribute('data-selected', 'true');
	await expect(node.locator('textarea')).toHaveCount(0);
});

test('fills the viewport without moving the camera or existing nodes on resize', async ({
	page,
}) => {
	const canvas = page.getByRole('application', { name: 'Canvas workspace' });
	const node = await createTextNode(page, 'Stable position');
	const viewportLayer = page.locator('[data-canvas-viewport]');
	const initialCanvasBox = await canvas.boundingBox();
	const initialNodeBox = await node.boundingBox();
	const initialTransform = await viewportLayer.evaluate(
		(element) => (element as HTMLElement).style.transform,
	);

	if (!initialCanvasBox || !initialNodeBox) {
		throw new Error('Canvas and node must have layout boxes');
	}

	expect(initialCanvasBox).toMatchObject({
		x: 0,
		y: 0,
		width: 1280,
		height: 720,
	});

	await page.setViewportSize({ width: 1000, height: 650 });

	await expect
		.poll(() => canvas.boundingBox())
		.toMatchObject({ x: 0, y: 0, width: 1000, height: 650 });
	expect(await node.boundingBox()).toMatchObject({
		x: initialNodeBox.x,
		y: initialNodeBox.y,
	});
	expect(
		await viewportLayer.evaluate(
			(element) => (element as HTMLElement).style.transform,
		),
	).toBe(initialTransform);
});

test('offsets nodes created at the same canvas position', async ({ page }) => {
	const nodes = page.locator(nodeSelector);

	await page.getByRole('button', { name: 'Text', exact: true }).click();
	await expect(nodes).toHaveCount(1);
	await page.keyboard.press('Escape');

	await page.keyboard.press('l');
	await expect(nodes).toHaveCount(2);

	const firstCenter = await getNodeCenter(nodes.nth(0));
	const secondCenter = await getNodeCenter(nodes.nth(1));

	expect(secondCenter).toEqual({
		x: firstCenter.x + 24,
		y: firstCenter.y + 24,
	});
});

test('replaces all node content with a skeleton below 60% zoom', async ({
	page,
}) => {
	await page.getByRole('button', { name: 'Link', exact: true }).click();
	const linkNode = page.locator(nodeSelector).first();
	await linkNode.locator('input').first().fill('Project brief');
	await linkNode.locator('input').last().fill('https://example.com/brief');
	await linkNode.locator('input').last().press('Escape');

	await page.getByRole('button', { name: 'Text', exact: true }).click();
	const textNode = page.locator(nodeSelector).last();
	const textEditor = textNode.locator('textarea');
	await textEditor.fill('Release checklist');
	await expect(textEditor).toBeFocused();

	const canvas = page.getByRole('application', { name: 'Canvas workspace' });

	await canvas.dispatchEvent('wheel', { ctrlKey: true, deltaY: 60 });

	await expect(textNode).toHaveAttribute('data-node-detail', 'skeleton');
	await expect(linkNode).toHaveAttribute('data-node-detail', 'skeleton');
	await expect(page.locator('[data-node-skeleton]')).toHaveCount(2);
	await expect(textNode.locator(':scope > *')).toHaveCount(1);
	await expect(textEditor).toHaveCount(0);
	await expect(textNode).not.toContainText('Release checklist');
	await expect(linkNode).not.toContainText('Project brief');

	await canvas.dispatchEvent('wheel', { ctrlKey: true, deltaY: -60 });

	await expect(textNode).toHaveAttribute('data-node-detail', 'full');
	await expect(linkNode).toHaveAttribute('data-node-detail', 'full');
	await expect(page.locator('[data-node-skeleton]')).toHaveCount(0);
	await expect(textNode.locator('textarea')).toHaveCount(0);
	await expect(textNode).toContainText('Release checklist');
	await expect(linkNode).toContainText('Project brief');
});

test('changes zoom in ten-percent steps and resets it with Center', async ({
	page,
}) => {
	const zoomButton = page.getByRole('button', { name: 'Zoom: 100%' });

	await zoomButton.click();
	const slider = page.getByRole('slider', { name: 'Zoom level' });
	await expect(slider).toBeVisible();

	await expect(slider).toHaveValue('100');
	await slider.press('ArrowLeft');
	await expect(page.getByRole('button', { name: 'Zoom: 90%' })).toBeVisible();

	const canvas = page.getByRole('application', { name: 'Canvas workspace' });

	await canvas.dispatchEvent('wheel', { ctrlKey: true, deltaY: -5 });
	await expect(page.getByRole('button', { name: 'Zoom: 95%' })).toBeVisible();

	await page.getByRole('button', { name: 'Center', exact: true }).click();
	await expect(page.getByRole('button', { name: 'Zoom: 100%' })).toBeVisible();
});

test('undoes and redoes a bounded canvas size', async ({ page }) => {
	await page.getByLabel('Canvas size').selectOption('a4');
	await expect(page.getByTestId('canvas-surface')).toBeVisible();

	await page.getByRole('button', { name: 'Undo', exact: true }).click();
	await expect(page.getByTestId('canvas-surface')).toHaveCount(0);

	await page.getByRole('button', { name: 'Redo', exact: true }).click();
	await expect(page.getByTestId('canvas-surface')).toBeVisible();
});

test('culls nodes outside the viewport and restores them before they enter', async ({
	page,
}) => {
	const node = await createTextNode(page, 'Far away node');
	const canvas = page.getByRole('application', { name: 'Canvas workspace' });

	await pressKey(page, 'Shift+ArrowRight', 50);
	await expect(node).toHaveCount(0);

	await canvas.dispatchEvent('wheel', { deltaX: 200 });
	await expect(node).toHaveCount(1);

	const canvasBox = await canvas.boundingBox();
	const nodeBox = await node.boundingBox();

	if (!canvasBox || !nodeBox) {
		throw new Error('Canvas and overscanned node must have layout boxes');
	}

	expect(nodeBox.x).toBeGreaterThan(canvasBox.x + canvasBox.width);

	await canvas.dispatchEvent('wheel', { deltaX: 150 });
	await expect(node).toContainText('Far away node');
	await expect(node).toHaveAttribute('data-selected', 'true');
});

test('selects multiple nodes with a selection box in both directions', async ({
	page,
}) => {
	await createSeparatedNodes(page);
	const { start, end } = await getSelectionPoints(page);

	await dragWithinCanvas(page, start, end);
	await expect(page.getByTestId('canvas-selection-box')).toBeVisible();
	await page.mouse.up();
	await expect(page.locator(selectedNodeSelector)).toHaveCount(2);

	await dragWithinCanvas(page, end, start);
	await expect(page.getByTestId('canvas-selection-box')).toBeVisible();
	await page.mouse.up();
	await expect(page.locator(selectedNodeSelector)).toHaveCount(2);
});

test('moves a selected node by dragging it', async ({ page }) => {
	const node = await createTextNode(page, 'Move me');
	const startLeft = await node.evaluate((element) =>
		Number.parseFloat(element.style.left),
	);
	const startTop = await node.evaluate((element) =>
		Number.parseFloat(element.style.top),
	);
	const nodeBox = await node.boundingBox();

	if (!nodeBox) {
		throw new Error('Node is not visible');
	}

	await page.mouse.move(
		nodeBox.x + nodeBox.width / 2,
		nodeBox.y + nodeBox.height / 2,
	);
	await page.mouse.down();
	await page.mouse.move(
		nodeBox.x + nodeBox.width / 2 + 80,
		nodeBox.y + nodeBox.height / 2 + 60,
		{ steps: 5 },
	);
	await page.mouse.up();

	await expect
		.poll(() =>
			node.evaluate((element) => Number.parseFloat(element.style.left)),
		)
		.toBe(startLeft + 80);
	await expect
		.poll(() =>
			node.evaluate((element) => Number.parseFloat(element.style.top)),
		)
		.toBe(startTop + 60);
});

test('keeps moved and resized nodes inside a bounded canvas', async ({
	page,
}) => {
	await page.getByLabel('Canvas size').selectOption('letter');
	await page.getByLabel('Canvas orientation').selectOption('landscape');
	await page.getByRole('button', { name: 'Fit', exact: true }).click();

	const surface = page.getByTestId('canvas-surface');
	const movedNode = await createTextNode(page, 'Keep inside');
	const surfaceBox = await surface.boundingBox();
	const movedNodeBox = await movedNode.boundingBox();

	if (!surfaceBox || !movedNodeBox) {
		throw new Error('Bounded canvas and node must have layout boxes');
	}

	await page.mouse.move(
		movedNodeBox.x + movedNodeBox.width / 2,
		movedNodeBox.y + movedNodeBox.height / 2,
	);
	await page.mouse.down();
	await page.mouse.move(surfaceBox.x + surfaceBox.width + 500, movedNodeBox.y, {
		steps: 5,
	});
	await page.mouse.up();

	const constrainedNodeBox = await movedNode.boundingBox();
	expect(
		(constrainedNodeBox?.x ?? 0) + (constrainedNodeBox?.width ?? 0),
	).toBeCloseTo(surfaceBox.x + surfaceBox.width, 0);

	await page.keyboard.press('ArrowRight');
	const keyboardMovedNodeBox = await movedNode.boundingBox();
	expect(
		(keyboardMovedNodeBox?.x ?? 0) + (keyboardMovedNodeBox?.width ?? 0),
	).toBeCloseTo(surfaceBox.x + surfaceBox.width, 0);

	const resizedNode = await createTextNode(page, 'Resize inside');
	const resizeHandle = resizedNode.locator('[data-resize-handle]');
	const handleBox = await resizeHandle.boundingBox();

	if (!handleBox) {
		throw new Error('Resize handle must have a layout box');
	}

	await page.mouse.move(
		handleBox.x + handleBox.width / 2,
		handleBox.y + handleBox.height / 2,
	);
	await page.mouse.down();
	await page.mouse.move(
		surfaceBox.x + surfaceBox.width + 500,
		surfaceBox.y + surfaceBox.height + 500,
		{ steps: 5 },
	);
	await page.mouse.up();

	const resizedNodeBox = await resizedNode.boundingBox();
	expect(
		(resizedNodeBox?.x ?? 0) + (resizedNodeBox?.width ?? 0),
	).toBeLessThanOrEqual(surfaceBox.x + surfaceBox.width + 1);
	expect(
		(resizedNodeBox?.y ?? 0) + (resizedNodeBox?.height ?? 0),
	).toBeLessThanOrEqual(surfaceBox.y + surfaceBox.height + 1);
});

test('locks and unlocks a node from the context menu', async ({ page }) => {
	const node = await createTextNode(page, 'Keep me here');
	const startPosition = await getNodeCenter(node);

	await node.click({ button: 'right' });
	await page.getByRole('menuitem', { name: /Lock selection/ }).click();

	await expect(node).toHaveAttribute('data-locked', 'true');
	await expect(node).toHaveAccessibleName('Locked canvas node');
	await expect(node.locator('[data-lock-indicator="node"]')).toHaveCount(1);

	await page.keyboard.press('ArrowRight');
	expect(await getNodeCenter(node)).toEqual(startPosition);

	const nodeBox = await node.boundingBox();

	if (!nodeBox) {
		throw new Error('Locked node is not visible');
	}

	await page.mouse.move(
		nodeBox.x + nodeBox.width / 2,
		nodeBox.y + nodeBox.height / 2,
	);
	await page.mouse.down();
	await page.mouse.move(
		nodeBox.x + nodeBox.width / 2 + 80,
		nodeBox.y + nodeBox.height / 2 + 60,
		{ steps: 5 },
	);
	await page.mouse.up();
	expect(await getNodeCenter(node)).toEqual(startPosition);

	await node.click({ button: 'right' });
	await page.getByRole('menuitem', { name: /Unlock selection/ }).click();
	await expect(node).not.toHaveAttribute('data-locked');

	await page.keyboard.press('ArrowRight');
	expect(await getNodeCenter(node)).toEqual({
		x: startPosition.x + 5,
		y: startPosition.y,
	});
});

test('keeps a node lock indicator inside its node layer', async ({ page }) => {
	const lockedNode = await createTextNode(page, 'Locked below');

	await lockedNode.click({ button: 'right' });
	await page.getByRole('menuitem', { name: /Lock selection/ }).click();

	const coveringNode = await createTextNode(page, 'Covering node');
	await page.keyboard.press('Shift+ArrowLeft');
	await page.keyboard.press('Shift+ArrowUp');

	const coveringNodeId = await coveringNode.getAttribute('data-node-id');
	const topNodeId = await lockedNode
		.locator('[data-lock-indicator="node"]')
		.evaluate((indicator) => {
			const rect = indicator.getBoundingClientRect();

			return document
				.elementsFromPoint(
					rect.left + rect.width / 2,
					rect.top + rect.height / 2,
				)
				.map((element) => element.closest<HTMLElement>('[data-node-id]'))
				.find((element) => element !== null)?.dataset.nodeId;
		});

	expect(topNodeId).toBe(coveringNodeId);
});

test('groups and ungroups the selected nodes', async ({ page }) => {
	await createSeparatedNodes(page);
	await selectBothNodes(page);

	await page.keyboard.press('Control+g');

	const group = page.getByRole('group', { name: 'Node group' });
	await expect(group).toHaveCount(1);
	await expect(group).toHaveAttribute('data-selected', 'true');

	await page.keyboard.press('Control+Shift+g');

	await expect(group).toHaveCount(0);
	await expect(page.locator(selectedNodeSelector)).toHaveCount(2);
});

test('locks and unlocks a group with the keyboard shortcut', async ({
	page,
}) => {
	await createSeparatedNodes(page);
	await selectBothNodes(page);
	await page.keyboard.press('Control+g');

	const group = page.locator('[data-group-id]');
	const nodes = page.locator(nodeSelector);
	const startPositions = await Promise.all([
		getNodeCenter(nodes.nth(0)),
		getNodeCenter(nodes.nth(1)),
	]);

	await page.keyboard.press('Control+Shift+l');
	await expect(group).toHaveAttribute('data-locked', 'true');
	await expect(group).toHaveAccessibleName('Locked node group');
	await expect(group.locator('[data-lock-indicator="group"]')).toHaveCount(1);
	await expect(nodes.locator('[data-lock-indicator]')).toHaveCount(0);

	await page.keyboard.press('ArrowRight');
	expect(
		await Promise.all([
			getNodeCenter(nodes.nth(0)),
			getNodeCenter(nodes.nth(1)),
		]),
	).toEqual(startPositions);

	const groupBox = await group.boundingBox();

	if (!groupBox) {
		throw new Error('Locked group is not visible');
	}

	await page.mouse.move(groupBox.x + groupBox.width / 2, groupBox.y + 1);
	await page.mouse.down();
	await page.mouse.move(groupBox.x + groupBox.width / 2 + 80, groupBox.y + 61, {
		steps: 5,
	});
	await page.mouse.up();
	expect(
		await Promise.all([
			getNodeCenter(nodes.nth(0)),
			getNodeCenter(nodes.nth(1)),
		]),
	).toEqual(startPositions);

	await page.keyboard.press('Control+Shift+l');
	await expect(group).not.toHaveAttribute('data-locked');
	await page.keyboard.press('ArrowRight');

	expect(
		await Promise.all([
			getNodeCenter(nodes.nth(0)),
			getNodeCenter(nodes.nth(1)),
		]),
	).toEqual(
		startPositions.map((position) => ({
			x: position.x + 5,
			y: position.y,
		})),
	);
});

test('undoes and redoes node creation', async ({ page }) => {
	const nodes = page.locator(nodeSelector);

	await page.getByRole('button', { name: 'Text', exact: true }).click();
	await expect(nodes).toHaveCount(1);

	await page.getByRole('button', { name: 'Undo', exact: true }).click();
	await expect(nodes).toHaveCount(0);

	await page.getByRole('button', { name: 'Redo', exact: true }).click();
	await expect(nodes).toHaveCount(1);
});
