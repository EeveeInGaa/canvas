import { expect, type Page, test } from '@playwright/test';

type Rgb = [number, number, number];

function parseColor(color: string): Rgb {
	if (color.startsWith('#')) {
		return [1, 3, 5].map((index) =>
			Number.parseInt(color.slice(index, index + 2), 16),
		) as Rgb;
	}

	const channels = color
		.match(/[\d.]+/g)
		?.slice(0, 3)
		.map(Number);

	if (channels?.length !== 3) {
		throw new Error(`Unsupported color: ${color}`);
	}

	return channels as Rgb;
}

function relativeLuminance(color: string): number {
	const [red, green, blue] = parseColor(color).map((channel) => {
		const normalized = channel / 255;

		return normalized <= 0.04045
			? normalized / 12.92
			: ((normalized + 0.055) / 1.055) ** 2.4;
	});

	return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function getContrastRatio(first: string, second: string): number {
	const lighter = Math.max(relativeLuminance(first), relativeLuminance(second));
	const darker = Math.min(relativeLuminance(first), relativeLuminance(second));

	return (lighter + 0.05) / (darker + 0.05);
}

async function getThemeTokens(page: Page) {
	return page.evaluate(() => {
		const styles = getComputedStyle(document.documentElement);
		const getToken = (name: string) => styles.getPropertyValue(name).trim();

		return {
			accent: getToken('--canvas-accent'),
			accentContrast: getToken('--canvas-accent-contrast'),
			canvas: getToken('--canvas-background'),
			panel: getToken('--canvas-panel'),
			surface: getToken('--canvas-surface'),
			control: getToken('--canvas-control-border'),
			controlHover: getToken('--canvas-control-border-hover'),
			controlSelected: getToken('--canvas-control-border-selected'),
			controlDisabled: getToken('--canvas-control-border-disabled'),
		};
	});
}

test('meets text and control-boundary contrast in both themes', async ({
	page,
}) => {
	for (const colorScheme of ['light', 'dark'] as const) {
		await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
		await page.goto('/');
		const tokens = await getThemeTokens(page);

		expect(
			getContrastRatio(tokens.accent, tokens.accentContrast),
			`${colorScheme} accent text`,
		).toBeGreaterThanOrEqual(4.5);

		for (const [name, boundary] of [
			['normal', tokens.control],
			['hover', tokens.controlHover],
			['selected', tokens.controlSelected],
			['disabled', tokens.controlDisabled],
		] as const) {
			for (const [surfaceName, surface] of [
				['canvas', tokens.canvas],
				['panel', tokens.panel],
				['surface', tokens.surface],
			] as const) {
				expect(
					getContrastRatio(boundary, surface),
					`${colorScheme} ${name} boundary on ${surfaceName}`,
				).toBeGreaterThanOrEqual(3);
			}
		}

		const debugButton = page.getByRole('button', { name: 'Debug: Off' });
		await debugButton.click();
		const pressedDebugButton = page.getByRole('button', { name: 'Debug: On' });
		const pressedColors = await pressedDebugButton.evaluate((element) => {
			const styles = getComputedStyle(element);

			return {
				background: styles.backgroundColor,
				className: element.className,
				text: styles.color,
			};
		});

		expect(
			getContrastRatio(pressedColors.background, pressedColors.text),
			`${colorScheme} pressed toolbar button (${pressedColors.text} on ${pressedColors.background}; ${pressedColors.className})`,
		).toBeGreaterThanOrEqual(4.5);
	}
});
