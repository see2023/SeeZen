import React from 'react';
import { useTranslation } from '../../../core/i18n';
import { TabProps } from '../types';

const AppearanceTab: React.FC<TabProps> = ({ settings, onSettingsChange }) => {
	const { t } = useTranslation();

	// Helper function to update settings
	const updateSetting = (key: string, value: any) => {
		onSettingsChange({ [key]: value });
	};

	return (
		<section className="settings-section">
			<h2>{t('settings.appearance.title')}</h2>
			<div className="settings-group">
				<div className="setting-item">
					<label htmlFor="theme">{t('settings.appearance.theme')}</label>
					<select
						id="theme"
						value={settings.theme}
						onChange={(e) => updateSetting('theme', e.target.value)}
					>
						<option value="light">{t('settings.appearance.theme_light')}</option>
						<option value="dark">{t('settings.appearance.theme_dark')}</option>
						<option value="system">{t('settings.appearance.theme_system')}</option>
					</select>
				</div>
				<div className="setting-item">
					<label htmlFor="language">{t('settings.appearance.language')}</label>
					<select
						id="language"
						value={settings.language}
						onChange={(e) => updateSetting('language', e.target.value)}
					>
						<option value="en">{t('settings.appearance.language_en')}</option>
						<option value="zh">{t('settings.appearance.language_zh')}</option>
					</select>
				</div>
			</div>
		</section>
	);
};

export default AppearanceTab; 