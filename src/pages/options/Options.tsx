import React, { useState, useEffect } from 'react';
import './index.css';
import './tabs.css';
import './sound-preview.css';
import useUIStore from '../../core/stores/uiStore';
import useLanguageStore from '../../core/stores/languageStore';
import useTimerStore from '../../core/stores/timerStore';
import useBlockerStore from '../../core/stores/blockerStore';
import { useTranslation } from '../../core/i18n';
import SoundManager, { SoundEffect } from '../../core/utils/SoundManager';
import { TabType, Settings } from './types';

// Import tab components
import TimerTab from './tabs/TimerTab';
import BlockerTab from './tabs/BlockerTab';
import AppearanceTab from './tabs/AppearanceTab';
import Toast from './components/Toast';
import ConfirmDialog from './components/ConfirmDialog';

const Options: React.FC = () => {
	const { theme, soundVolume, setTheme, setVolume, updateSettings } = useUIStore();
	const { language, setLanguage } = useLanguageStore();
	const { settings, soundSettings, updateSettings: updateTimerSettings, updateSoundSettings } = useTimerStore();
	const { t } = useTranslation();

	// 初始化计时器状态
	useEffect(() => {
		useTimerStore.getState().initialize();
		// 初始化 blockerStore
		if (!useBlockerStore.getState().isInitialized) {
			useBlockerStore.getState().init();
		}
	}, []);

	// 预览/试听声音功能
	const previewSound = (sound: SoundEffect) => {
		if (sound !== 'none') {
			SoundManager.getInstance().playSound(sound, soundVolume || 0.7);
		}
	};

	// 当前活动标签页
	const [activeTab, setActiveTab] = useState<TabType>('timer');
	const [showToast, setShowToast] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);

	// 本地状态用于表单控制
	const [localSettings, setLocalSettings] = useState<Settings>({
		// 计时器设置
		workDuration: 25,
		shortBreakDuration: 5,
		longBreakDuration: 15,
		longBreakInterval: 4,
		autoStartBreaks: true,
		autoStartPomodoros: false,

		// 音效设置
		workCompleteSound: 'bell_ding' as SoundEffect,
		breakCompleteSound: 'timer' as SoundEffect,
		soundVolume: 0.7,

		// 网站拦截设置
		enabledDuringWork: true,
		enabledDuringBreaks: false,
		blockedSites: '',
		whitelist: '',

		// 外观设置
		theme: 'light' as 'light' | 'dark' | 'system',
		language: 'en' as 'en' | 'zh'
	});

	// 刷新数据
	const refreshSettings = () => {
		// 刷新 UI 设置
		setLocalSettings(prevState => ({
			...prevState,
			theme,
			soundVolume,
			language,
			// 从 blockerStore 获取并转换设置
			blockedSites: useBlockerStore.getState().blockedSites.join('\n'),
			enabledDuringWork: useBlockerStore.getState().enabledDuringWork
		}));

		// 刷新计时器设置
		if (settings) {
			setLocalSettings(prevState => ({
				...prevState,
				workDuration: settings.workDuration,
				shortBreakDuration: settings.shortBreakDuration,
				longBreakDuration: settings.longBreakDuration,
				longBreakInterval: settings.longBreakInterval,
				autoStartBreaks: settings.autoStartBreaks,
				autoStartPomodoros: settings.autoStartPomodoros
			}));
		}

		// 刷新音效设置
		if (soundSettings) {
			setLocalSettings(prevState => ({
				...prevState,
				workCompleteSound: soundSettings.workCompleteSound,
				breakCompleteSound: soundSettings.breakCompleteSound,
			}));
		}
	};

	// 当全局状态改变时更新本地状态
	useEffect(() => {
		refreshSettings();
	}, [theme, soundVolume, language, settings, soundSettings]);

	const goBackToPopup = () => {
		window.close(); // 关闭选项页，如果通过扩展图标打开的popup仍然存在
	};

	// 切换标签页
	const handleTabChange = (tab: TabType) => {
		setActiveTab(tab);
	};

	// 处理设置变更
	const handleSettingsChange = (newSettings: Partial<Settings>) => {
		setLocalSettings({
			...localSettings,
			...newSettings
		});

		// 立即应用声音相关的设置
		if (newSettings.workCompleteSound !== undefined ||
			newSettings.breakCompleteSound !== undefined) {
			updateSoundSettings({
				...(newSettings.workCompleteSound !== undefined && { workCompleteSound: newSettings.workCompleteSound }),
				...(newSettings.breakCompleteSound !== undefined && { breakCompleteSound: newSettings.breakCompleteSound })
			});
		}

		// Apply theme, language immediately
		if (newSettings.theme !== undefined && newSettings.theme !== localSettings.theme) {
			setTheme(newSettings.theme);
		}

		if (newSettings.language !== undefined && newSettings.language !== localSettings.language) {
			setLanguage(newSettings.language);
		}


		if (newSettings.soundVolume !== undefined && newSettings.soundVolume !== localSettings.soundVolume) {
			setVolume(newSettings.soundVolume);
		}
	};

	const saveSettings = () => {
		// 更新 UI 设置
		updateSettings({
			theme: localSettings.theme,
			soundVolume: localSettings.soundVolume
		});

		// 更新计时器设置
		updateTimerSettings({
			workDuration: localSettings.workDuration,
			shortBreakDuration: localSettings.shortBreakDuration,
			longBreakDuration: localSettings.longBreakDuration,
			longBreakInterval: localSettings.longBreakInterval,
			autoStartBreaks: localSettings.autoStartBreaks,
			autoStartPomodoros: localSettings.autoStartPomodoros
		});

		// 更新音效设置
		updateSoundSettings({
			workCompleteSound: localSettings.workCompleteSound,
			breakCompleteSound: localSettings.breakCompleteSound,
		});

		// 将音量设置也发送到后台
		chrome.runtime.sendMessage({
			type: 'UPDATE_UI_SETTINGS',
			settings: {
				soundVolume: localSettings.soundVolume
			}
		});

		// 保存网站拦截设置
		if (localSettings.blockedSites) {
			const sitesArray = localSettings.blockedSites
				.split('\n')
				.map(site => site.trim())
				.filter(site => site.length > 0);

			useBlockerStore.getState().updateSettings({
				blockedSites: sitesArray,
				enabledDuringWork: localSettings.enabledDuringWork
			});
		}

		// Show toast notification instead of alert
		setShowToast(true);
	};

	const handleResetSettings = () => {
		setShowConfirm(true);
	};

	const confirmResetSettings = () => {
		const defaultSettings: Settings = {
			// 计时器设置
			workDuration: 25,
			shortBreakDuration: 5,
			longBreakDuration: 15,
			longBreakInterval: 4,
			autoStartBreaks: true,
			autoStartPomodoros: false,

			// 音效设置
			workCompleteSound: 'bell_ding' as SoundEffect,
			breakCompleteSound: 'timer' as SoundEffect,
			soundVolume: 0.7,

			// 网站拦截设置
			enabledDuringWork: true,
			enabledDuringBreaks: false,
			blockedSites: useBlockerStore.getState().blockedSites.join('\n'), // 保留现有站点
			whitelist: '',

			// 外观设置
			theme: 'light' as 'light' | 'dark' | 'system',
			language: localSettings.language
		};

		setLocalSettings(defaultSettings);

		// 更新 UI 设置
		updateSettings({
			theme: defaultSettings.theme,
			soundVolume: defaultSettings.soundVolume
		});

		// 更新计时器设置
		updateTimerSettings({
			workDuration: defaultSettings.workDuration,
			shortBreakDuration: defaultSettings.shortBreakDuration,
			longBreakDuration: defaultSettings.longBreakDuration,
			longBreakInterval: defaultSettings.longBreakInterval,
			autoStartBreaks: defaultSettings.autoStartBreaks,
			autoStartPomodoros: defaultSettings.autoStartPomodoros
		});

		// 更新音效设置
		updateSoundSettings({
			workCompleteSound: defaultSettings.workCompleteSound,
			breakCompleteSound: defaultSettings.breakCompleteSound,
		});

		// 重置网站拦截设置为默认值
		const defaultWorkSchedule = {
			days: [1, 2, 3, 4, 5], // 周一至周五
			timeRanges: [
				{ start: "0800", end: "1200" },
				{ start: "1330", end: "1730" }
			]
		};

		useBlockerStore.getState().updateSettings({
			mode: 'pomodoro',
			enabledDuringWork: true,
			scheduleEnabled: true,
			workSchedule: defaultWorkSchedule
			// 不重置被屏蔽网站列表
		});

		// 强制刷新工作时间表
		useBlockerStore.getState().updateSchedule(
			defaultWorkSchedule.days,
			defaultWorkSchedule.timeRanges
		);

		// 关闭确认对话框
		setShowConfirm(false);

		// 使用 Toast 提示用户设置已重置
		setShowToast(true);

		// 等待所有状态更新完成后刷新页面
		setTimeout(() => {
			window.location.reload();
		}, 500);
	};

	return (
		<div className="options-container">
			<header>
				<div className="header-content">
					<button className="back-btn" onClick={goBackToPopup}>
						&larr; {t('common.back')}
					</button>
					<h1>{t('settings.title')}</h1>
				</div>
			</header>

			<div className="tabs">
				<button
					className={`tab-btn ${activeTab === 'timer' ? 'active' : ''}`}
					onClick={() => handleTabChange('timer')}
				>
					{t('settings.tabs.timer')}
				</button>
				<button
					className={`tab-btn ${activeTab === 'blocker' ? 'active' : ''}`}
					onClick={() => handleTabChange('blocker')}
				>
					{t('settings.tabs.blocker')}
				</button>
				<button
					className={`tab-btn ${activeTab === 'appearance' ? 'active' : ''}`}
					onClick={() => handleTabChange('appearance')}
				>
					{t('settings.tabs.appearance')}
				</button>
			</div>

			<main>
				{/* Render the active tab component */}
				{activeTab === 'timer' && (
					<TimerTab
						settings={localSettings}
						onSettingsChange={handleSettingsChange}
						previewSound={previewSound}
					/>
				)}

				{activeTab === 'blocker' && (
					<BlockerTab
						settings={localSettings}
						onSettingsChange={handleSettingsChange}
					/>
				)}

				{activeTab === 'appearance' && (
					<AppearanceTab
						settings={localSettings}
						onSettingsChange={handleSettingsChange}
					/>
				)}

				<div className="action-buttons">
					<button className="save-btn" onClick={saveSettings}>
						{t('common.save')}
					</button>
					<button className="reset-btn" onClick={handleResetSettings}>
						{t('common.reset')}
					</button>
				</div>
			</main>

			<Toast
				message={t('common.saved')}
				show={showToast}
				onHide={() => setShowToast(false)}
			/>

			<ConfirmDialog
				message={t('common.reset_confirm')}
				show={showConfirm}
				onConfirm={confirmResetSettings}
				onCancel={() => setShowConfirm(false)}
			/>
		</div>
	);
};

export default Options; 