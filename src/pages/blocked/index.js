import React from 'react';
import { createRoot } from 'react-dom/client';
import BlockedPage from './BlockedPage';
import './index.css';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
	const rootElement = document.getElementById('root');
	if (rootElement) {
		const root = createRoot(rootElement);
		root.render(
			React.createElement(
				React.StrictMode,
				null,
				React.createElement(BlockedPage)
			)
		);
	} else {
		console.error('Root element not found');
	}
}); 