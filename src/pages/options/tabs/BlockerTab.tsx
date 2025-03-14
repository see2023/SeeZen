import React, { useState, useEffect } from 'react';
import { TabProps } from '../types';
import useBlockerStore from '../../../core/stores/blockerStore';
import { useTranslation } from '../../../core/i18n';

const BlockerTab: React.FC<TabProps> = ({ settings, onSettingsChange }) => {
	const { t } = useTranslation();

	// 从 blockerStore 获取状态
	const blockerStore = useBlockerStore();

	// 本地状态，用于管理组件内部的状态
	const [blockerSettings, setBlockerSettings] = useState({
		mode: blockerStore.mode,
		enabledDuringWork: blockerStore.enabledDuringWork,
		scheduleEnabled: blockerStore.scheduleEnabled,
		workSchedule: blockerStore.workSchedule,
		blockedSites: blockerStore.blockedSites
	});

	// 当 blockerStore 变化时更新本地状态
	useEffect(() => {
		setBlockerSettings({
			mode: blockerStore.mode,
			enabledDuringWork: blockerStore.enabledDuringWork,
			scheduleEnabled: blockerStore.scheduleEnabled,
			workSchedule: blockerStore.workSchedule,
			blockedSites: blockerStore.blockedSites
		});
	}, [blockerStore]);

	// 专门监听工作日和时间范围的变化
	useEffect(() => {
		// 同步更新工作日和时间范围，确保重置设置时立即刷新
		setSelectedDays(blockerStore.workSchedule?.days || [1, 2, 3, 4, 5]);
		setTimeRanges(blockerStore.workSchedule?.timeRanges || [
			{ start: "0800", end: "1200" },
			{ start: "1330", end: "1730" }
		]);
	}, [blockerStore.workSchedule]);

	// 当父组件设置变化时，更新 blockerStore
	useEffect(() => {
		// 同步启用标志
		if (settings.enabledDuringWork !== blockerSettings.enabledDuringWork) {
			blockerStore.updateSettings({
				enabledDuringWork: settings.enabledDuringWork
			});
		}

		// 更新被屏蔽网站列表（将字符串转换为数组）
		if (settings.blockedSites) {
			const sitesArray = settings.blockedSites
				.split('\n')
				.map(site => site.trim())
				.filter(site => site.length > 0);

			// 只有当不同时才更新
			if (JSON.stringify(sitesArray) !== JSON.stringify(blockerSettings.blockedSites)) {
				blockerStore.updateSettings({
					blockedSites: sitesArray
				});
			}
		}
	}, [settings, blockerSettings, blockerStore]);

	// 表单元素的状态
	const [newSite, setNewSite] = useState('');
	const [selectedDays, setSelectedDays] = useState<number[]>(
		blockerSettings.workSchedule?.days || [1, 2, 3, 4, 5]
	);
	const [timeRanges, setTimeRanges] = useState<Array<{ start: string, end: string }>>(
		blockerSettings.workSchedule?.timeRanges || [
			{ start: "0800", end: "1200" },
			{ start: "1330", end: "1730" }
		]
	);

	// 更新 blockerStore 和父组件设置的辅助函数
	const updateBothSettings = (blockSettings: any, parentSettingsUpdate: any) => {
		// 更新 blockerStore
		blockerStore.updateSettings(blockSettings);

		// 同时更新父组件设置
		onSettingsChange(parentSettingsUpdate);
	};

	// 添加新网站到屏蔽列表
	const addBlockedSite = () => {
		if (newSite.trim()) {
			// 添加到 store
			blockerStore.addBlockedSite(newSite.trim());
			setNewSite('');

			// 同时更新父组件设置
			const updatedSites = [...blockerSettings.blockedSites, newSite.trim()];
			onSettingsChange({
				blockedSites: updatedSites.join('\n')
			});
		}
	};

	// 从屏蔽列表中移除网站
	const removeBlockedSite = (site: string) => {
		// 从 store 中移除
		blockerStore.removeBlockedSite(site);

		// 更新父组件设置
		const updatedSites = blockerSettings.blockedSites.filter(s => s !== site);
		onSettingsChange({
			blockedSites: updatedSites.join('\n')
		});
	};

	// 切换屏蔽模式
	const toggleMode = () => {
		const newMode = blockerSettings.mode === 'pomodoro' ? 'schedule' : 'pomodoro';
		blockerStore.updateSettings({ mode: newMode });
		// 不需要更新父组件设置
	};

	// 切换工作时段屏蔽
	const toggleWorkBlocking = () => {
		const newValue = !blockerSettings.enabledDuringWork;
		updateBothSettings(
			{ enabledDuringWork: newValue },
			{ enabledDuringWork: newValue }
		);
	};

	// 切换时间表屏蔽
	const toggleScheduleBlocking = () => {
		blockerStore.toggleScheduleBlocking();
		// 不需要更新父组件设置
	};

	// 更新时间范围
	const updateTimeRange = (index: number, field: 'start' | 'end', value: string) => {
		const newRanges = [...timeRanges];
		newRanges[index][field] = value;
		setTimeRanges(newRanges);
		blockerStore.updateSchedule(selectedDays, newRanges);
		// 不需要更新父组件设置
	};

	// 添加新的时间范围
	const addTimeRange = () => {
		const newRanges = [...timeRanges, { start: "0900", end: "1700" }];
		setTimeRanges(newRanges);
		blockerStore.updateSchedule(selectedDays, newRanges);
		// 不需要更新父组件设置
	};

	// 移除时间范围
	const removeTimeRange = (index: number) => {
		if (timeRanges.length > 1) {
			const newRanges = timeRanges.filter((_, i) => i !== index);
			setTimeRanges(newRanges);
			blockerStore.updateSchedule(selectedDays, newRanges);
			// 不需要更新父组件设置
		}
	};

	// 切换日程表中的日期
	const toggleDay = (day: number) => {
		const newDays = selectedDays.includes(day)
			? selectedDays.filter(d => d !== day)
			: [...selectedDays, day];

		setSelectedDays(newDays);
		blockerStore.updateSchedule(newDays, timeRanges);
		// 不需要更新父组件设置
	};

	// 格式化时间显示
	const formatTime = (timeString: string): string => {
		return `${timeString.slice(0, 2)}:${timeString.slice(2, 4)}`;
	};

	// 日期名称显示
	const dayNames = [
		t('settings.blocker.days.sun'),
		t('settings.blocker.days.mon'),
		t('settings.blocker.days.tue'),
		t('settings.blocker.days.wed'),
		t('settings.blocker.days.thu'),
		t('settings.blocker.days.fri'),
		t('settings.blocker.days.sat')
	];

	return (
		<section className="settings-section">
			<h2>{t('settings.blocker.title')}</h2>

			<div className="settings-group">
				<h3>{t('settings.blocker.mode_title')}</h3>
				<div className="setting-item">
					<div className="toggle-switch">
						<button
							className={`toggle-btn ${blockerSettings.mode === 'pomodoro' ? 'active' : ''}`}
							onClick={toggleMode}
						>
							{t('settings.blocker.pomodoro_mode')}
						</button>
						<button
							className={`toggle-btn ${blockerSettings.mode === 'schedule' ? 'active' : ''}`}
							onClick={toggleMode}
						>
							{t('settings.blocker.schedule_mode')}
						</button>
					</div>
				</div>
			</div>

			{blockerSettings.mode === 'pomodoro' && (
				<div className="settings-group">
					<h3>{t('settings.blocker.pomodoro_blocking')}</h3>
					<div className="setting-item">
						<label>
							<input
								type="checkbox"
								checked={blockerSettings.enabledDuringWork}
								onChange={toggleWorkBlocking}
							/>
							{t('settings.blocker.enable_work')}
						</label>
					</div>
				</div>
			)}

			{blockerSettings.mode === 'schedule' && (
				<div className="settings-group">
					<h3>{t('settings.blocker.schedule_blocking')}</h3>
					<div className="setting-item">
						<label>
							<input
								type="checkbox"
								checked={blockerSettings.scheduleEnabled}
								onChange={toggleScheduleBlocking}
							/>
							{t('settings.blocker.enable_schedule')}
						</label>
					</div>

					{blockerSettings.scheduleEnabled && (
						<>
							<div className="setting-item">
								<label>{t('settings.blocker.work_days')}</label>
								<div className="day-selector">
									{dayNames.map((day, index) => (
										<button
											key={day}
											className={`day-btn ${selectedDays.includes(index) ? 'selected' : ''}`}
											onClick={() => toggleDay(index)}
										>
											{day}
										</button>
									))}
								</div>
							</div>

							<div className="setting-item">
								<label>{t('settings.blocker.work_hours')}</label>
								{timeRanges.map((range, index) => (
									<div key={index} className="time-range-item">
										<input
											type="time"
											value={formatTime(range.start)}
											onChange={(e) => {
												const [hours, minutes] = e.target.value.split(':');
												updateTimeRange(index, 'start', `${hours}${minutes}`);
											}}
										/>
										<span>{t('settings.blocker.to')}</span>
										<input
											type="time"
											value={formatTime(range.end)}
											onChange={(e) => {
												const [hours, minutes] = e.target.value.split(':');
												updateTimeRange(index, 'end', `${hours}${minutes}`);
											}}
										/>
										<button
											className="remove-btn"
											onClick={() => removeTimeRange(index)}
											disabled={timeRanges.length <= 1}
										>
											✕
										</button>
									</div>
								))}
								<button className="add-btn" onClick={addTimeRange}>
									+ {t('settings.blocker.add_time_range')}
								</button>
							</div>
						</>
					)}
				</div>
			)}

			<div className="settings-group">
				<h3>{t('settings.blocker.blocked_sites')}</h3>
				<div className="setting-item">
					<div className="add-site-form">
						<input
							type="text"
							placeholder={t('settings.blocker.blocked_sites_placeholder')}
							value={newSite}
							onChange={(e) => setNewSite(e.target.value)}
							onKeyDown={(e) => e.key === 'Enter' && addBlockedSite()}
						/>
						<button onClick={addBlockedSite}>{t('settings.blocker.add')}</button>
					</div>
				</div>

				<div className="setting-item">
					<div className="blocked-sites-list">
						{blockerSettings.blockedSites.length === 0 ? (
							<p className="no-sites">{t('settings.blocker.no_sites')}</p>
						) : (
							<ul>
								{blockerSettings.blockedSites.map((site, index) => (
									<li key={index} className="blocked-site-item">
										<span>{site}</span>
										<button
											className="remove-btn"
											onClick={() => removeBlockedSite(site)}
										>
											✕
										</button>
									</li>
								))}
							</ul>
						)}
					</div>
				</div>
			</div>
		</section>
	);
};

export default BlockerTab; 