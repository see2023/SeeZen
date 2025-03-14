let oneTimeAudios = new Map(); // 跟踪一次性音效，使用Map保存音效类型和对应的音频元素
let isDocumentActive = true; // 跟踪文档是否活跃

// 在页面加载完成时记录
console.log('Offscreen文档已加载，准备好播放声音');

// 处理消息
chrome.runtime.onMessage.addListener((message) => {
	if (message.target !== 'offscreen') return;

	console.log('Offscreen接收消息:', message, '当前状态:', {
		oneTimeAudiosCount: oneTimeAudios.size,
		isDocumentActive: isDocumentActive
	});

	switch (message.action) {
		case 'playSound':
			playSound(message.sound, message.volume);
			break;
		case 'stopAllSounds':
			stopAllSounds();
			break;
	}
});

// 播放一次性音效
function playSound(sound, volume) {
	if (!sound || sound === 'none' || sound === 'ticktock') {
		console.log(`跳过播放音效 ${sound} - 无效的一次性音效`);
		return;
	}

	// 先停止同类型的声音，确保不会重复播放
	if (oneTimeAudios.has(sound)) {
		const oldAudio = oneTimeAudios.get(sound);
		console.log(`停止已存在的音效 ${sound} 以防止重复播放`);
		oldAudio.pause();
		try {
			oldAudio.src = '';
		} catch (e) {
			console.error(`清理旧音效 ${sound} 时出错:`, e);
		}
		oneTimeAudios.delete(sound);
	}

	console.log(`播放一次性音效: ${sound}, 音量: ${volume}`);

	try {
		const audio = new Audio(chrome.runtime.getURL(`src/public/sounds/${sound}.mp3`));
		audio.volume = volume || 0.7;

		// 确保一次性音效不循环!
		audio.loop = false;

		// 添加一个ID方便调试
		audio.id = `one-time-${sound}-${Date.now()}`;

		// 跟踪这个音频元素
		oneTimeAudios.set(sound, audio);

		// 当声音播放完毕，清理资源
		audio.onended = () => {
			console.log(`一次性音效 ${sound} (${audio.id}) 播放完成`);
			oneTimeAudios.delete(sound);
			try {
				audio.src = '';
			} catch (e) {
				console.error(`清理音效 ${sound} 资源时出错:`, e);
			}
		};

		// 播放声音
		console.log(`开始播放音效: ${sound} (${audio.id})`);
		audio.play().catch(err => {
			console.error(`播放音效 ${sound} 失败:`, err);
			oneTimeAudios.delete(sound);
		});
	} catch (error) {
		console.error(`创建音效 ${sound} 时出错:`, error);
	}
}


// 停止所有声音
function stopAllSounds() {
	console.log('停止所有声音，当前状态:', {
		oneTimeAudiosCount: oneTimeAudios.size
	});

	// 停止所有一次性音效
	let stopCount = 0;
	oneTimeAudios.forEach((audio, sound) => {
		console.log(`停止一次性音效: ${sound} (${audio.id})`);
		audio.pause();
		try {
			audio.src = '';
		} catch (e) {
			console.error(`清理音效 ${sound} 资源时出错:`, e);
		}
		stopCount++;
	});

	// 清空跟踪Map
	oneTimeAudios.clear();
	console.log(`已停止 ${stopCount} 个一次性音效`);

	// 检查是否可以关闭文档
	checkClosingDoc();
}

// 检查是否可以关闭offscreen文档
function checkClosingDoc() {
	// 检查是否有任何正在播放的音频
	const hasPlayingAudio = oneTimeAudios.size > 0;

	console.log('检查是否可以关闭文档:', {
		oneTimeAudiosCount: oneTimeAudios.size,
		canClose: !hasPlayingAudio,
		isDocumentActive: isDocumentActive
	});

	if (!hasPlayingAudio && isDocumentActive) {
		// 标记文档即将关闭
		isDocumentActive = false;

		// 延迟通知，确保不会中断其他操作
		setTimeout(() => {
			// 发送消息给后台脚本，请求关闭offscreen文档
			console.log('尝试关闭offscreen文档');
			chrome.runtime.sendMessage({
				action: 'closeOffscreen',
				target: 'background'
			}).catch(error => {
				console.error('关闭offscreen文档出错:', error);
				// 如果关闭失败，重置状态以便下次重试
				isDocumentActive = true;
			});
		}, 500);
	}
} 