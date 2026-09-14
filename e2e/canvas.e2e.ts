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
	await dragWithinCanvas(page, { x: 150, y: 220 }, { x: 650, y: 380 });
	await page.mouse.up();
	await expect(page.locator(selectedNodeSelector)).toHaveCount(2);
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

test('selects multiple nodes with a selection box in both directions', async ({
	page,
}) => {
	await createSeparatedNodes(page);

	await dragWithinCanvas(page, { x: 150, y: 220 }, { x: 650, y: 380 });
	await expect(page.getByTestId('canvas-selection-box')).toBeVisible();
	await page.mouse.up();
	await expect(page.locator(selectedNodeSelector)).toHaveCount(2);

	await dragWithinCanvas(page, { x: 650, y: 380 }, { x: 150, y: 220 });
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

test('undoes and redoes node creation', async ({ page }) => {
	const nodes = page.locator(nodeSelector);

	await page.getByRole('button', { name: 'Text', exact: true }).click();
	await expect(nodes).toHaveCount(1);

	await page.getByRole('button', { name: 'Undo', exact: true }).click();
	await expect(nodes).toHaveCount(0);

	await page.getByRole('button', { name: 'Redo', exact: true }).click();
	await expect(nodes).toHaveCount(1);
});
