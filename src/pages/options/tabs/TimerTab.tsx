import React from 'react';
import { useTranslation } from '../../../core/i18n';
import { TabProps } from '../types';
import { SoundEffect } from '../../../core/utils/SoundManager';

const TimerTab: React.FC<TabProps> = ({ settings, onSettingsChange, previewSound }) => {
	const { t } = useTranslation();

	// Helper function to update settings
	const updateSetting = (key: string, value: any) => {
		onSettingsChange({ [key]: value });
	};

	// Sound preview handler
	const handlePreviewSound = (sound: SoundEffect) => {
		if (previewSound && sound !== 'none') {
			previewSound(sound);
		}
	};

	return (
		<>
			<section className="settings-section">
				<h2>{t('settings.timer.title')}</h2>
				<div className="settings-group">
					<div className="setting-item">
						<label htmlFor="workDuration">{t('settings.timer.work_duration')}</label>
						<input
							type="number"
							id="workDuration"
							min="1"
							max="120"
							value={settings.workDuration}
							onChange={(e) => updateSetting('workDuration', parseInt(e.target.value))}
						/>
					</div>
					<div className="setting-item">
						<label htmlFor="shortBreakDuration">{t('settings.timer.short_break')}</label>
						<input
							type="number"
							id="shortBreakDuration"
							min="1"
							max="30"
							value={settings.shortBreakDuration}
							onChange={(e) => updateSetting('shortBreakDuration', parseInt(e.target.value))}
						/>
					</div>
					<div className="setting-item">
						<label htmlFor="longBreakDuration">{t('settings.timer.long_break')}</label>
						<input
							type="number"
							id="longBreakDuration"
							min="1"
							max="60"
							value={settings.longBreakDuration}
							onChange={(e) => updateSetting('longBreakDuration', parseInt(e.target.value))}
						/>
					</div>
					<div className="setting-item">
						<label htmlFor="longBreakInterval">{t('settings.timer.long_break_interval')}</label>
						<input
							type="number"
							id="longBreakInterval"
							min="1"
							max="10"
							value={settings.longBreakInterval}
							onChange={(e) => updateSetting('longBreakInterval', parseInt(e.target.value))}
						/>
					</div>
					<div className="setting-item">
						<label>
							<input
								type="checkbox"
								checked={settings.autoStartBreaks}
								onChange={(e) => updateSetting('autoStartBreaks', e.target.checked)}
							/>
							{t('settings.timer.auto_start_breaks')}
						</label>
					</div>
					<div className="setting-item">
						<label>
							<input
								type="checkbox"
								checked={settings.autoStartPomodoros}
								onChange={(e) => updateSetting('autoStartPomodoros', e.target.checked)}
							/>
							{t('settings.timer.auto_start_pomodoros')}
						</label>
					</div>
				</div>
			</section>

			<section className="settings-section">
				<h2>{t('settings.sounds.title')}</h2>
				<div className="settings-group">
					<div className="setting-item sound-setting">
						<label htmlFor="workCompleteSound">{t('settings.sounds.work_complete')}</label>
						<div className="sound-control">
							<select
								id="workCompleteSound"
								value={settings.workCompleteSound}
								onChange={(e) => updateSetting('workCompleteSound', e.target.value)}
							>
								<option value="none">{t('settings.sounds.none')}</option>
								<option value="bell">{t('settings.sounds.bell')}</option>
								<option value="bell_ding">{t('settings.sounds.bell_ding')}</option>
								<option value="timer">{t('settings.sounds.timer')}</option>
								<option value="door_close">{t('settings.sounds.door_close')}</option>
								<option value="ticktock">{t('settings.sounds.ticktock')}</option>
							</select>
							{settings.workCompleteSound !== 'none' && (
								<button
									className="preview-sound-btn"
									onClick={() => handlePreviewSound(settings.workCompleteSound)}
								>
									{t('settings.sounds.preview')}
								</button>
							)}
						</div>
					</div>

					<div className="setting-item sound-setting">
						<label htmlFor="breakCompleteSound">{t('settings.sounds.break_complete')}</label>
						<div className="sound-control">
							<select
								id="breakCompleteSound"
								value={settings.breakCompleteSound}
								onChange={(e) => updateSetting('breakCompleteSound', e.target.value)}
							>
								<option value="none">{t('settings.sounds.none')}</option>
								<option value="bell">{t('settings.sounds.bell')}</option>
								<option value="bell_ding">{t('settings.sounds.bell_ding')}</option>
								<option value="door_close">{t('settings.sounds.door_close')}</option>
								<option value="timer">{t('settings.sounds.timer')}</option>
								<option value="ticktock">{t('settings.sounds.ticktock')}</option>
							</select>
							{settings.breakCompleteSound !== 'none' && (
								<button
									className="preview-sound-btn"
									onClick={() => handlePreviewSound(settings.breakCompleteSound)}
								>
									{t('settings.sounds.preview')}
								</button>
							)}
						</div>
					</div>


					<div className="setting-item">
						<label htmlFor="volume">{t('settings.sounds.volume')}</label>
						<div className="volume-control">
							<input
								type="range"
								id="volume"
								min="0"
								max="1"
								step="0.1"
								value={settings.soundVolume}
								onChange={(e) => updateSetting('soundVolume', parseFloat(e.target.value))}
							/>
							<span>{Math.round(settings.soundVolume * 100)}%</span>
						</div>
					</div>
				</div>
			</section>
		</>
	);
};

export default TimerTab; 