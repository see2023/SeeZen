import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../core/i18n';

const BlockedPage: React.FC = () => {
	const { t } = useTranslation();
	const [pageData, setPageData] = useState({
		currentTime: new Date().toLocaleTimeString(),
		originalDomain: 'site',
		completedPomodoros: 0,
		currentMode: 'work',
		blockMode: 'pomodoro' as 'pomodoro' | 'schedule',
		displayTime: ''
	});
	const [isLoaded, setIsLoaded] = useState(false);

	// Load everything once on mount
	useEffect(() => {
		// Only load data once
		if (isLoaded) return;

		// Get URL parameters
		const url = new URL(window.location.href);
		const time = url.searchParams.get('time') || new Date().toLocaleTimeString();

		// Get domain from URL parameter
		let domain = 'site';
		const blockedSite = url.searchParams.get('url');
		if (blockedSite) {
			try {
				const blockedUrl = decodeURIComponent(blockedSite);
				try {
					const urlObj = new URL(blockedUrl);
					domain = urlObj.hostname;
				} catch (err) {
					domain = blockedUrl;
				}
			} catch (e) {
				domain = 'site';
			}
		} else if (document.referrer) {
			try {
				const urlObj = new URL(document.referrer);
				domain = urlObj.hostname;
			} catch (err) {
				domain = 'site';
			}
		}

		// Get all the data we need in one go
		Promise.all([
			// Get timer state from local storage
			new Promise<{ completedPomodoros: number, currentMode: string, displayTime: string }>(resolve => {
				chrome.storage.local.get(['timerState'], (result) => {
					if (result.timerState) {
						resolve({
							completedPomodoros: result.timerState.completedPomodoros || 0,
							currentMode: result.timerState.currentMode || 'work',
							displayTime: result.timerState.displayTime || ''
						});
					} else {
						resolve({ completedPomodoros: 0, currentMode: 'work', displayTime: '' });
					}
				});
			}),

			// Get blocker settings
			new Promise<{ blockMode: 'pomodoro' | 'schedule' }>(resolve => {
				chrome.storage.sync.get(['blockerSettings'], (result) => {
					if (result.blockerSettings && result.blockerSettings.mode) {
						resolve({ blockMode: result.blockerSettings.mode });
					} else {
						resolve({ blockMode: 'pomodoro' });
					}
				});
			})
		]).then(([timerData, blockerData]) => {
			// Set all data at once to avoid multiple renders
			setPageData({
				currentTime: time,
				originalDomain: domain,
				completedPomodoros: timerData.completedPomodoros,
				currentMode: timerData.currentMode,
				blockMode: blockerData.blockMode,
				displayTime: timerData.displayTime
			});
			setIsLoaded(true);
		}).catch(err => {
			console.error('Error loading blocked page data:', err);
			// Set at least the domain even if other data failed
			setPageData(prev => ({
				...prev,
				currentTime: time,
				originalDomain: domain
			}));
			setIsLoaded(true);
		});
	}, [isLoaded]);

	// Generate motivation message based on completed sessions
	const getMotivationMessage = (): string => {
		const sessions = pageData.completedPomodoros;
		if (sessions === 0) {
			return "Let's focus and get started! 💪";
		} else if (sessions < 3) {
			return "Good start! Keep going! 🌟";
		} else if (sessions < 8) {
			return "Great progress! Stay focused! 🔥";
		} else {
			return "Amazing work today! 🎉";
		}
	};

	return (
		<div className="blocked-container">
			<div className="blocked-card">
				<div className="blocked-icon">🚫</div>
				<h1>Site Blocked</h1>

				<p className="blocked-message">
					<strong>{pageData.originalDomain}</strong> is currently blocked.
				</p>

				<div className="time-info">
					<p>Current time: <strong>{pageData.currentTime}</strong></p>
				</div>

				<div className="stats-info">
					<h3>Today's Progress</h3>
					<p>Completed focus sessions: <strong>{pageData.completedPomodoros}</strong></p>
				</div>

				{pageData.blockMode === 'pomodoro' && (
					<div className="timer-info">
						<p>Current session: <strong>{pageData.currentMode}</strong></p>
						{pageData.displayTime && (
							<p>Time remaining: <strong>{pageData.displayTime}</strong></p>
						)}
					</div>
				)}

				{pageData.blockMode === 'schedule' && (
					<div className="schedule-info">
						<p>This site is blocked during work hours.</p>
					</div>
				)}

				<div className="blocked-actions">
					<button className="primary-btn" onClick={() => window.close()}>
						Close Tab
					</button>
				</div>

				<div className="motivation">
					<p>{getMotivationMessage()}</p>
				</div>
			</div>
		</div>
	);
};

export default BlockedPage; 