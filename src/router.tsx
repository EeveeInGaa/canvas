import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from '@/core/RootLayout';
import { Home } from '@/pages/general/Home';
import { NotFound } from '@/pages/general/NotFound';

export const router = createBrowserRouter([
	{
		path: '/',
		element: <RootLayout />,
		errorElement: <NotFound />,
		children: [
			{ index: true, element: <Home />, handle: { title: 'Home' } },
			{
				path: 'terms',
				lazy: async () => {
					const m = await import('@/pages/general/Terms');
					return { Component: m.Terms };
				},
				handle: { title: 'Terms & Conditions' },
			},
			{
				path: 'imprint',
				lazy: async () => {
					const m = await import('@/pages/general/Imprint');
					return { Component: m.Imprint };
				},
				handle: { title: 'Imprint' },
			},
			{
				path: 'privacy',
				lazy: async () => {
					const m = await import('@/pages/general/Privacy');
					return { Component: m.Privacy };
				},
				handle: { title: 'Privacy Policy' },
			},
		],
	},
]);
