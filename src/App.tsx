import { Canvas } from '@/components/Canvas.tsx';

export function App() {
	return (
		<div className="flex min-h-screen flex-col">
			<main className="custom-container mt-lg grow">
				<Canvas />
			</main>
		</div>
	);
}
