// 可查询的功能列表
const toolsInfo = [
	{
		name: '代币信息查询',
		examples: [
			'查询比特币现在的价格',
			'以太坊的市值是多少',
			'查看USDT的24小时交易量',
			'通过合约地址查询代币信息 (例如：0x...)',
		],
	},
	{
		name: '价格历史查询',
		examples: ['比特币最近7天的价格走势', '显示以太坊30天价格历史', 'BNB的价格变化趋势'],
	},
	{
		name: '代币搜索',
		examples: ['搜索包含"uni"的代币', '查找Arbitrum相关的代币', '寻找最近热门的代币'],
	},
	{
		name: '市场趋势',
		examples: ['显示当前市场趋势', '最热门的代币有哪些', '查看市场上涨幅最大的币种'],
	},
];
const formatDate = (timestamp) => {
	const date = new Date(timestamp);
	const month = (date.getMonth() + 1).toString().padStart(2, '0');
	const day = date.getDate().toString().padStart(2, '0');
	return `${month}-${day}`;
};
// 初始化帮助内容
function initializeHelpContent() {
	const helpContent = document.getElementById('helpContent');
	toolsInfo.forEach((tool) => {
		const section = document.createElement('div');
		section.className = 'tool-section';
		section.innerHTML = `
            <h3>${tool.name}</h3>
            <div class="quick-questions">
                ${tool.examples
					.map((example) => `<button onclick="sendQuestion('${example}')">${example}</button>`)
					.join('')}
            </div>
        `;
		helpContent.appendChild(section);
	});
}

// 在页面加载时初始化
window.onload = initializeHelpContent;

// 创建带有loading效果的AI消息框
function createLoadingMessage() {
	const loadingDiv = document.createElement('div');
	loadingDiv.className = 'message ai';
	loadingDiv.innerHTML = `
        <div class="avatar">AI</div>
        <div class="message-content">
            <div class="loading-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;
	return loadingDiv;
}

// 创建表格
function createTable(data) {
	const table = document.createElement('table');
	table.className = 'data-table';

	// 创建表头
	const thead = document.createElement('thead');
	const headerRow = document.createElement('tr');
	Object.keys(data[0]).forEach((key) => {
		const th = document.createElement('th');
		th.textContent = key;
		headerRow.appendChild(th);
	});
	thead.appendChild(headerRow);
	table.appendChild(thead);

	// 创建表体
	const tbody = document.createElement('tbody');
	data.forEach((row) => {
		const tr = document.createElement('tr');
		Object.values(row).forEach((value) => {
			const td = document.createElement('td');
			td.textContent = value;
			tr.appendChild(td);
		});
		tbody.appendChild(tr);
	});
	table.appendChild(tbody);

	return table;
}

// 创建图表容器
function createChartContainer() {
	const chartDiv = document.createElement('div');
	chartDiv.className = 'chart-container';
	chartDiv.style.width = '100%';
	chartDiv.style.minWidth = '600px'; // 设置最小宽度
	chartDiv.style.height = '300px';
	return chartDiv;
}

function renderPriceChart(chartDiv, prices) {
	const chart = echarts.init(chartDiv);

	const formatDate = (timestamp) => {
		const date = new Date(timestamp);
		const month = (date.getMonth() + 1).toString().padStart(2, '0');
		const day = date.getDate().toString().padStart(2, '0');
		return `${month}-${day}`;
	};

	const dates = prices.map((item) => formatDate(item.timestamp));
	const values = prices.map((item) => item.price);

	// 根据数据点数量调整grid的边距
	const gridPadding =
		prices.length > 10
			? {
					left: '3%',
					right: '4%',
					bottom: '10%', // 增加底部空间以防止标签拥挤
					top: '3%',
					containLabel: true,
				}
			: {
					left: '3%',
					right: '4%',
					bottom: '3%',
					top: '3%',
					containLabel: true,
				};

	const option = {
		backgroundColor: 'transparent',
		tooltip: {
			trigger: 'axis',
			backgroundColor: 'rgba(255, 255, 255, 0.9)',
			borderColor: '#eee',
			borderWidth: 1,
			textStyle: { color: '#333' },
		},
		grid: gridPadding,
		xAxis: {
			type: 'category',
			data: dates,
			axisLine: { lineStyle: { color: '#666' } },
			axisLabel: {
				color: '#666',
				interval: prices.length > 20 ? 2 : 0, // 当数据点过多时隔点显示
				rotate: prices.length > 20 ? 45 : 0, // 当数据点过多时旋转标签
			},
		},
		yAxis: {
			type: 'value',
			scale: true,
			axisLine: { lineStyle: { color: '#666' } },
			axisLabel: {
				color: '#666',
				formatter: function (value) {
					if (value >= 1000) {
						return (value / 1000).toFixed(1) + 'k';
					}
					return value.toFixed(2);
				},
			},
			splitLine: { lineStyle: { color: 'rgba(0,0,0,0.05)' } },
		},
		series: [
			{
				data: values,
				type: 'line',
				smooth: true,
				symbol: 'circle',
				symbolSize: 6,
				lineStyle: {
					color: '#07c160',
					width: 2,
				},
				itemStyle: {
					color: '#07c160',
					borderWidth: 2,
					borderColor: '#fff',
				},
				areaStyle: {
					color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
						{ offset: 0, color: 'rgba(7, 193, 96, 0.2)' },
						{ offset: 1, color: 'rgba(7, 193, 96, 0.05)' },
					]),
				},
			},
		],
	};

	chart.setOption(option);

	// 添加响应式调整
	const resizeHandler = () => {
		chart.resize({
			width: Math.max(600, chartDiv.parentElement.clientWidth * 0.9), // 确保最小宽度
		});
	};

	window.addEventListener('resize', resizeHandler);

	// 初始调整
	resizeHandler();
}

// 添加消息到聊天框
function addMessage(content, type) {
	const chatMessages = document.getElementById('chatMessages');
	const messageDiv = document.createElement('div');
	messageDiv.className = `message ${type}`;

	const avatar = document.createElement('div');
	avatar.className = 'avatar';
	avatar.textContent = type === 'ai' ? 'AI' : '👨🏻';

	const messageContent = document.createElement('div');
	messageContent.className = 'message-content';

	// 处理 AI 消息中的换行
	if (type === 'ai') {
		// 先将字面的 "\n" 转换为实际的换行符，然后再转换为 <br>
		const processedContent = content
			.replace(/\\n/g, '\n') // 将 "\n" 转换为实际的换行符
			.replace(/\n/g, '<br>'); // 将换行符转换为 <br>
		messageContent.innerHTML = processedContent;
	} else {
		messageContent.textContent = content;
	}

	messageDiv.appendChild(avatar);
	messageDiv.appendChild(messageContent);
	chatMessages.appendChild(messageDiv);
	scrollToBottom();
}

async function sendMessage() {
	const input = document.getElementById('messageInput');
	const message = input.value.trim();
	if (message) {
		input.disabled = true;
		const sendButton = input.nextElementSibling;
		sendButton.disabled = true;

		// 添加用户消息
		addMessage(message, 'user');

		// 创建新的AI消息框，带有loading效果
		const loadingMessage = createLoadingMessage();
		document.getElementById('chatMessages').appendChild(loadingMessage);
		scrollToBottom();

		try {
			const response = await fetch('http://localhost:3000/query', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ input: message }),
			});

			const responseData = await response.json();
			const messageContent = document.createElement('div');
			messageContent.className = 'message-content';

			// 添加文本响应
			if (responseData.output) {
				const textDiv = document.createElement('div');
				// 处理换行
				const processedOutput = responseData.output
					.replace(/\\n/g, '\n') // 将 "\n" 转换为实际的换行符
					.replace(/\n/g, '<br>'); // 将换行符转换为 <br>
				textDiv.innerHTML = processedOutput;
				messageContent.appendChild(textDiv);
			}

			// 处理数据部分
			if (responseData.data) {
				// 判断是否存在 prices 数组
				if (Array.isArray(responseData.data.prices)) {
					const chartDiv = createChartContainer();
					messageContent.appendChild(chartDiv);
					// 替换loading消息
					loadingMessage.querySelector('.message-content').replaceWith(messageContent);
					// 等待DOM更新后初始化图表
					setTimeout(() => renderPriceChart(chartDiv, responseData.data.prices), 0);
				} else if (Array.isArray(responseData.data)) {
					// 如果是普通数组数据，创建表格
					const table = createTable(responseData.data);
					messageContent.appendChild(table);
				}
			}

			// 如果还没有替换消息内容（没有图表的情况），现在替换
			if (loadingMessage.querySelector('.loading-dots')) {
				loadingMessage.querySelector('.message-content').replaceWith(messageContent);
			}
		} catch (error) {
			console.error('Error:', error);
			loadingMessage.querySelector('.message-content').textContent = '抱歉，服务器连接失败，请稍后重试。';
		} finally {
			input.disabled = false;
			sendButton.disabled = false;
			input.value = '';
			input.focus();
			saveToHistory(message);
			scrollToBottom();
		}
	}
}

// 滚动到底部
function scrollToBottom() {
	const chatMessages = document.getElementById('chatMessages');
	chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 发送问题
function sendQuestion(question) {
	document.getElementById('messageInput').value = question;
	sendMessage();
}

// 发送消息
// 历史记录相关函数
let chatHistory = [];

function saveToHistory(message) {
	chatHistory.push({
		time: new Date().toLocaleString(),
		message: message,
	});
	updateHistoryPanel();
}

function updateHistoryPanel() {
	const historyList = document.getElementById('historyList');
	historyList.innerHTML = '';
	chatHistory.forEach((item) => {
		const historyItem = document.createElement('div');
		historyItem.className = 'history-item';
		historyItem.innerHTML = `
            <div class="history-time">${item.time}</div>
            <div class="history-message">${item.message}</div>
        `;
		historyList.appendChild(historyItem);
	});
}

// 钱包连接相关
document.getElementById('connectWallet').addEventListener('click', async () => {
	if (typeof window.ethereum !== 'undefined') {
		try {
			const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
			const address = accounts[0];
			document.getElementById('walletAddress').textContent = `${address.slice(0, 6)}...${address.slice(-4)}`;
			document.getElementById('walletInfo').classList.remove('hidden');
			document.getElementById('connectWallet').classList.add('hidden');
		} catch (error) {
			console.error('Error connecting to MetaMask:', error);
		}
	} else {
		alert('请安装MetaMask钱包');
	}
});

// 回车发送消息
document.getElementById('messageInput').addEventListener('keypress', function (e) {
	if (e.key === 'Enter') {
		sendMessage();
	}
});
