import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import Options from './Options';
import './index.css';
import useUIStore from '../../core/stores/uiStore';
import useLanguageStore from '../../core/stores/languageStore';

// 确保在初始加载时应用主题和语言
const OptionsWithTheme: React.FC = () => {
	const { theme } = useUIStore();
	const { language } = useLanguageStore();

	useEffect(() => {
		// 手动确保主题被应用
		const { setTheme } = useUIStore.getState();
		setTheme(theme);
	}, [theme]);

	useEffect(() => {
		// 确保语言初始化
		const { setLanguage } = useLanguageStore.getState();
		setLanguage(language);
	}, [language]);

	return <Options />;
};

const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(
	<React.StrictMode>
		<OptionsWithTheme />
	</React.StrictMode>
); 