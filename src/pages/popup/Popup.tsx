import React, { useEffect } from 'react';
import './index.css';
import { useTranslation } from '../../core/i18n';
import useTimerStore from '../../core/stores/timerStore';

const Popup: React.FC = () => {
	const { t } = useTranslation();
	const {
		status,
		currentMode,
		displayTime,
		completedPomodoros,
		initialize,
		start,
		pause,
		reset,
		skip
	} = useTimerStore();

	// 初始化计时器状态
	useEffect(() => {
		initialize();
	}, [initialize]);

	// 处理导航到选项页面
	const navigateToOptions = () => {
		chrome.runtime.openOptionsPage();
	};

	// 获取当前状态的文本显示
	const getStatusText = () => {
		if (status === 'idle') {
			return t(`timer.${currentMode}`);
		} else if (status === 'paused') {
			return t('timer.paused');
		} else {
			return t(`timer.${currentMode}_in_progress`);
		}
	};

	// 主要按钮文本和处理函数
	const getPrimaryButtonText = () => {
		if (status === 'idle') {
			return t('timer.start');
		} else if (status === 'running') {
			return t('timer.pause');
		} else {
			return t('timer.resume');
		}
	};

	const handlePrimaryButtonClick = () => {
		if (status === 'idle' || status === 'paused') {
			start();
		} else if (status === 'running') {
			pause();
		}
	};

	// 第二个按钮文本和处理函数
	const getSecondaryButtonText = () => {
		if (status === 'idle') {
			return t('timer.skip');
		} else {
			return t('timer.reset');
		}
	};

	const handleSecondaryButtonClick = () => {
		if (status === 'idle') {
			skip();
		} else {
			reset();
		}
	};

	// 计算进度条百分比
	const calculateProgress = () => {
		if (status === 'idle') return 0;

		let totalTime;
		switch (currentMode) {
			case 'work':
				totalTime = useTimerStore.getState().settings.workDuration * 60;
				break;
			case 'shortBreak':
				totalTime = useTimerStore.getState().settings.shortBreakDuration * 60;
				break;
			case 'longBreak':
				totalTime = useTimerStore.getState().settings.longBreakDuration * 60;
				break;
			default:
				totalTime = 25 * 60;
		}

		const elapsed = totalTime - useTimerStore.getState().timeRemaining;
		return (elapsed / totalTime) * 100;
	};

	return (
		<div className="popup-container">
			<header>
				<h1>SeeZen</h1>
				<div className="pomodoro-counter">
					{completedPomodoros > 0 && (
						<span>{t('timer.completed')}: {completedPomodoros}</span>
					)}
				</div>
			</header>
			<main>
				<div className={`timer-display ${currentMode}`}>
					<div className="timer">{displayTime}</div>
					<div className="status">{getStatusText()}</div>
					<div className="progress-bar">
						<div
							className="progress"
							style={{
								width: `${calculateProgress()}%`
							}}
						></div>
					</div>
				</div>
				<div className="controls">
					<button
						className="btn-primary action-btn"
						onClick={handlePrimaryButtonClick}
					>
						{getPrimaryButtonText()}
					</button>
					<button
						className="btn-secondary action-btn"
						onClick={handleSecondaryButtonClick}
					>
						{getSecondaryButtonText()}
					</button>
					<button
						className="btn-tertiary settings-btn"
						onClick={navigateToOptions}
					>
						{t('popup.settings')}
					</button>
				</div>
			</main>
		</div>
	);
};

export default Popup; 