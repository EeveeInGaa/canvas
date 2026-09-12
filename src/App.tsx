import { Canvas } from '@/components/Canvas';

export function App() {
	return (
		<div className="flex min-h-screen min-w-fit flex-col">
			<main className="mx-auto mt-5 w-full grow px-4 lg:max-w-5xl xl:max-w-7xl">
				<Canvas />
			</main>
		</div>
	);
}
