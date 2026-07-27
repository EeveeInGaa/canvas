import { createBrowserRouter } from 'react-router-dom';

import { RootLayout } from '@/core/RootLayout';
import { Home } from '@/pages/general/Home';

export const router = createBrowserRouter([
	{
		path: '/',
		element: <RootLayout />,
		children: [{ index: true, element: <Home />, handle: { title: 'Home' } }],
	},
]);
