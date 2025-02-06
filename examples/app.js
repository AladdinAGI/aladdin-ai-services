// 存储历史问题和对话
let chatHistory = [];
const MAX_HISTORY = 20; // 最多保存20条历史记录

// 功能列表配置
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
	{
		name: '稳定币质押',
		examples: ['推荐最高收益的USDC质押池', '推荐最高收益的USDT质押池', '推荐最高收益的DAI质押池'],
	},
];

// 页面加载时初始化
window.onload = function () {
	initializeHelpContent();
	loadChatHistory();
	setupEventListeners();
	initializeRightPanelCharts();
};

// 初始化帮助内容
// 初始化帮助内容
function initializeHelpContent() {
	const helpContent = document.getElementById('helpContent');
	toolsInfo.forEach((tool) => {
		const section = document.createElement('div');
		section.className = 'tool-section';
		section.innerHTML = `
            <h3>${tool.name}</h3>
            <div class="quick-questions">
                ${tool.examples.map((example) => `<button class="quick-question-btn">${example}</button>`).join('')}
            </div>
        `;
		helpContent.appendChild(section);
	});

	// 添加快速问题点击事件
	document.querySelectorAll('.quick-question-btn').forEach((btn) => {
		btn.addEventListener('click', () => {
			document.getElementById('messageInput').value = btn.textContent;
			sendMessage();
		});
	});
}

// 从localStorage加载历史记录
function loadChatHistory() {
	const saved = localStorage.getItem('chatHistory');
	if (saved) {
		chatHistory = JSON.parse(saved);
		updateHistoryDisplay();
	}
}

// 保存历史记录到localStorage
function saveChatHistory() {
	localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
}

// 添加新的对话到历史记录
function addToHistory(question, answer) {
	const time = new Date().toLocaleTimeString();
	let type = 'general';

	// 根据问题内容判断类型
	const lowerQuestion = question.toLowerCase();
	if (lowerQuestion.includes('质押') || lowerQuestion.includes('apy') || lowerQuestion.includes('收益')) {
		type = 'staking';
	} else if (lowerQuestion.includes('价格') || lowerQuestion.includes('币价') || lowerQuestion.includes('市值')) {
		type = 'price';
	}

	chatHistory.push({
		time,
		question,
		answer,
		type,
	});

	// 保持最新的20条记录
	if (chatHistory.length > MAX_HISTORY) {
		chatHistory.shift();
	}

	updateHistoryDisplay();
}

// 更新历史记录显示
// 更新历史记录显示
function updateHistoryDisplay() {
	const historyList = document.getElementById('historyList');
	historyList.innerHTML = '';

	// 从最新的开始显示
	chatHistory
		.slice()
		.reverse()
		.forEach((item) => {
			const historyItem = document.createElement('div');
			historyItem.className = 'history-item';

			// 根据类型添加不同的标签样式
			let tagHtml = '';
			if (item.type === 'staking') {
				tagHtml = '<span class="tag-staking">质押</span>';
			} else if (item.type === 'price') {
				tagHtml = '<span class="tag-price">行情</span>';
			}

			historyItem.innerHTML = `
            <div class="history-time">${item.time}</div>
            <div class="history-content">
                <div class="history-question">${item.question}</div>
                ${tagHtml}
            </div>
        `;

			// 点击重新发送问题
			historyItem.addEventListener('click', () => {
				document.getElementById('messageInput').value = item.question;
				sendMessage();
			});

			historyList.appendChild(historyItem);
		});
}

// 移动 handleResponse 函数调用到发送消息函数内
async function sendMessage() {
	const input = document.getElementById('messageInput');
	const message = input.value.trim();
	if (!message) return;

	input.disabled = true;
	const sendButton = document.getElementById('sendButton');
	sendButton.disabled = true;

	addMessage(message, 'user');
	const loadingMessage = createLoadingMessage();
	document.getElementById('chatMessages').appendChild(loadingMessage);
	scrollToBottom();

	try {
		const response = await fetch('http://localhost:3000/query', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ input: message }),
		});

		const responseData = await response.json();
		handleResponse(responseData, loadingMessage);

		// 在获取到响应后，将问题和答案添加到历史记录
		if (responseData.output) {
			addToHistory(message, responseData.output);
		}
	} catch (error) {
		console.error('Error:', error);
		loadingMessage.querySelector('.message-content').textContent = '抱歉，服务器连接失败，请稍后重试。';
	} finally {
		input.disabled = false;
		sendButton.disabled = false;
		input.value = '';
		input.focus();
		scrollToBottom();
	}
}

// 处理响应数据// 处理响应数据
// 处理响应数据
function handleResponse(responseData, loadingMessage) {
	const messageContent = document.createElement('div');
	messageContent.className = 'message-content';

	// 处理文本响应
	if (responseData.output) {
		const textDiv = document.createElement('div');
		const processedOutput = responseData.output.replace(/\\n/g, '\n').replace(/\n/g, '<br>');
		textDiv.innerHTML = processedOutput;
		messageContent.appendChild(textDiv);
	}

	// 处理数据响应
	if (responseData.data) {
		if (responseData.type === 'staking_pools') {
			const poolsTable = createStakingPoolsTable(responseData.data);
			messageContent.appendChild(poolsTable);
		} else if (responseData.data.prices) {
			// 创建图表容器
			const chartDiv = createChartContainer();
			messageContent.appendChild(chartDiv);
			// 等待DOM更新后初始化图表
			setTimeout(() => renderPriceChart(chartDiv, responseData.data.prices), 0);
		} else if (Array.isArray(responseData.data)) {
			const table = createTable(responseData.data);
			messageContent.appendChild(table);
		}
	}

	// 替换加载消息
	loadingMessage.querySelector('.message-content').replaceWith(messageContent);
}

// 创建图表容器
// 修改创建图表容器的函数
function createChartContainer() {
	const chartDiv = document.createElement('div');
	chartDiv.className = 'chart-container';
	// 设置最小宽度，确保图表不会太窄
	chartDiv.style.minWidth = '800px';
	chartDiv.style.width = '100%';
	chartDiv.style.height = '360px'; // 增加高度以适应旋转的标签
	// 添加水平滚动的容器
	const scrollContainer = document.createElement('div');
	scrollContainer.className = 'chart-scroll-container';
	scrollContainer.appendChild(chartDiv);
	return scrollContainer;
}

// 格式化日期
function formatDate(timestamp) {
	const date = new Date(timestamp);
	const month = (date.getMonth() + 1).toString().padStart(2, '0');
	const day = date.getDate().toString().padStart(2, '0');
	const hour = date.getHours().toString().padStart(2, '0');
	const minute = date.getMinutes().toString().padStart(2, '0');
	return `${month}-${day} ${hour}:${minute}`;
}

// 渲染价格图表
// 更新渲染图表函数
function renderPriceChart(chartContainer, prices) {
	const chartDiv = chartContainer.querySelector('.chart-container');
	const chart = echarts.init(chartDiv);

	const dates = prices.map((item) => formatDate(item.timestamp));
	const values = prices.map((item) => item.price);
	const startPrice = values[0];
	const endPrice = values[values.length - 1];
	const priceChange = (((endPrice - startPrice) / startPrice) * 100).toFixed(2);
	const isPositive = priceChange >= 0;

	const option = {
		title: {
			text: `价格走势${isPositive ? '↑' : '↓'} ${isPositive ? '+' : ''}${priceChange}%`,
			left: 'center',
			top: 10,
			textStyle: {
				color: isPositive ? '#52c41a' : '#f5222d',
				fontSize: 14,
				fontWeight: 'normal',
			},
		},
		tooltip: {
			trigger: 'axis',
			backgroundColor: 'rgba(255, 255, 255, 0.9)',
			borderColor: '#eee',
			borderWidth: 1,
			textStyle: { color: '#333' },
			formatter: function (params) {
				const data = params[0];
				return `${data.name}<br/>价格: $${data.value.toFixed(2)}`;
			},
			axisPointer: {
				type: 'cross',
				label: {
					backgroundColor: '#6a7985',
				},
			},
		},
		grid: {
			top: 60,
			left: 60, // 增加左侧间距以显示价格
			right: 30,
			bottom: 60, // 增加底部间距以显示日期
			containLabel: true,
		},
		xAxis: {
			type: 'category',
			data: dates,
			boundaryGap: false,
			axisLine: { lineStyle: { color: '#ddd' } },
			axisLabel: {
				color: '#666',
				rotate: 45, // 固定45度角显示日期
				interval: Math.ceil(dates.length / 30), // 根据数据量自动计算间隔
				margin: 15, // 增加标签与轴的距离
			},
		},
		yAxis: {
			type: 'value',
			scale: true,
			axisLine: { lineStyle: { color: '#ddd' } },
			axisLabel: {
				color: '#666',
				formatter: function (value) {
					return '$' + value.toFixed(2);
				},
			},
			splitLine: { lineStyle: { color: '#eee' } },
		},
		dataZoom: [
			{
				// 添加缩放控件
				type: 'inside',
				start: 0,
				end: 100,
			},
			{
				type: 'slider',
				show: true,
				bottom: 10,
			},
		],
		series: [
			{
				data: values,
				type: 'line',
				smooth: true,
				symbol: 'circle',
				symbolSize: 6,
				itemStyle: {
					color: isPositive ? '#52c41a' : '#f5222d',
				},
				lineStyle: {
					width: 2,
					color: isPositive ? '#52c41a' : '#f5222d',
				},
				areaStyle: {
					color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
						{ offset: 0, color: isPositive ? 'rgba(82,196,26,0.2)' : 'rgba(245,34,45,0.2)' },
						{ offset: 1, color: 'rgba(255,255,255,0.1)' },
					]),
				},
			},
		],
	};

	chart.setOption(option);

	// 响应式调整
	const resizeHandler = () => {
		if (chart) {
			chart.resize({
				width: Math.max(800, chartContainer.clientWidth), // 确保最小宽度
			});
		}
	};

	window.addEventListener('resize', resizeHandler);
	resizeHandler(); // 初始调整

	// 清理函数
	return () => {
		window.removeEventListener('resize', resizeHandler);
		chart.dispose();
	};
}

// 创建质押池表格
function createStakingPoolsTable(pools) {
	const table = document.createElement('table');
	table.className = 'staking-pools-table';

	table.innerHTML = `
        <thead>
            <tr>
                <th>平台</th>
                <th>代币</th>
                <th>APY</th>
                <th>风险等级</th>
                <th>最小质押额</th>
            </tr>
        </thead>
        <tbody>
            ${pools
				.map(
					(pool) => `
                <tr>
                    <td>${pool.platform}</td>
                    <td>${pool.token}</td>
                    <td class="apy-cell">${pool.apy}%</td>
                    <td class="risk-cell ${pool.risk.toLowerCase()}">${pool.risk}</td>
                    <td>$${formatNumber(pool.minStake)}</td>
                </tr>
            `,
				)
				.join('')}
        </tbody>
    `;

	return table;
}

// 创建普通数据表格
function createTable(data) {
	const table = document.createElement('table');
	table.className = 'data-table';

	const headers = Object.keys(data[0]);

	table.innerHTML = `
        <thead>
            <tr>
                ${headers.map((header) => `<th>${header}</th>`).join('')}
            </tr>
        </thead>
        <tbody>
            ${data
				.map(
					(row) => `
                <tr>
                    ${headers.map((header) => `<td>${row[header]}</td>`).join('')}
                </tr>
            `,
				)
				.join('')}
        </tbody>
    `;

	return table;
}

// 创建收益计算显示
function createEarningsDisplay(data) {
	const div = document.createElement('div');
	div.className = 'earnings-display';

	div.innerHTML = `
        <div class="earnings-header">
            <h3>收益预测</h3>
            <span class="amount">投资金额: $${formatNumber(data.principal)}</span>
        </div>
        <div class="earnings-grid">
            <div class="earnings-item">
                <span class="label">日收益</span>
                <span class="value">$${formatNumber(data.dailyEarnings)}</span>
            </div>
            <div class="earnings-item">
                <span class="label">月收益</span>
                <span class="value">$${formatNumber(data.monthlyEarnings)}</span>
            </div>
            <div class="earnings-item">
                <span class="label">年收益</span>
                <span class="value">$${formatNumber(data.yearlyEarnings)}</span>
            </div>
        </div>
    `;

	return div;
}

// 创建风险分析显示
function createRiskAnalysisDisplay(data) {
	const div = document.createElement('div');
	div.className = 'risk-analysis';

	div.innerHTML = `
        <div class="risk-header">
            <h3>${data.platform}平台风险分析</h3>
        </div>
        <div class="risk-factors">
            ${data.factors
				.map(
					(factor) => `
                <div class="risk-factor">
                    <div class="factor-header">
                        <span class="factor-name">${factor.name}</span>
                        <span class="risk-level ${factor.level.toLowerCase()}">${factor.level}</span>
                    </div>
                    <p class="factor-description">${factor.description}</p>
                </div>
            `,
				)
				.join('')}
        </div>
    `;

	return div;
}

// UI Helper 函数
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

function addMessage(content, type) {
	const chatMessages = document.getElementById('chatMessages');
	const messageDiv = document.createElement('div');
	messageDiv.className = `message ${type}`;

	const avatar = document.createElement('div');
	avatar.className = 'avatar';
	avatar.textContent = type === 'ai' ? 'AI' : '👨🏻';

	const messageContent = document.createElement('div');
	messageContent.className = 'message-content';

	if (type === 'ai') {
		const processedContent = content.replace(/\\n/g, '\n').replace(/\n/g, '<br>');
		messageContent.innerHTML = processedContent;
	} else {
		messageContent.textContent = content;
	}

	messageDiv.appendChild(avatar);
	messageDiv.appendChild(messageContent);
	chatMessages.appendChild(messageDiv);
	scrollToBottom();
}

// 工具函数
function formatNumber(num) {
	return new Intl.NumberFormat('en-US', {
		maximumFractionDigits: 2,
		notation: num > 1000000 ? 'compact' : 'standard',
		compactDisplay: 'short',
	}).format(num);
}

function scrollToBottom() {
	const chatMessages = document.getElementById('chatMessages');
	chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 设置事件监听
function setupEventListeners() {
	document.getElementById('sendButton').addEventListener('click', sendMessage);

	document.getElementById('messageInput').addEventListener('keypress', function (e) {
		if (e.key === 'Enter') {
			sendMessage();
		}
	});
}
// 初始化右侧面板图表
function initializeRightPanelCharts() {
	initializeStakingDistribution();
	initializeEarningsChart();
	initializePlatformHealth();
}

// 质押分布饼图
function initializeStakingDistribution() {
	const chart = echarts.init(document.getElementById('stakingDistribution'));

	const option = {
		tooltip: {
			trigger: 'item',
			formatter: '{b}: ${c} ({d}%)',
		},
		legend: {
			orient: 'horizontal',
			bottom: 0,
			left: 'center',
			itemWidth: 12,
			itemHeight: 12,
			textStyle: {
				fontSize: 12,
			},
		},
		series: [
			{
				type: 'pie',
				radius: ['40%', '70%'],
				avoidLabelOverlap: true,
				itemStyle: {
					borderRadius: 4,
					borderWidth: 2,
					borderColor: '#fff',
				},
				label: {
					show: false,
				},
				labelLine: {
					show: false,
				},
				data: [
					{ value: 1000, name: 'USDC-Morpho' },
					{ value: 2000, name: 'USDT-Aave' },
				],
			},
		],
	};

	chart.setOption(option);
	window.addEventListener('resize', () => chart.resize());
}

// 收益走势图
function initializeEarningsChart() {
	const chart = echarts.init(document.getElementById('earningsChart'));

	// 模拟最近7天的每日收益数据
	const dates = Array.from({ length: 7 }, (_, i) => {
		const date = new Date();
		date.setDate(date.getDate() - i);
		return date.toLocaleDateString();
	}).reverse();

	const option = {
		tooltip: {
			trigger: 'axis',
			formatter: '${c0}',
		},
		grid: {
			top: 10,
			right: 10,
			bottom: 20,
			left: 40,
			containLabel: true,
		},
		xAxis: {
			type: 'category',
			data: dates,
			axisLabel: {
				interval: 1,
				fontSize: 10,
			},
		},
		yAxis: {
			type: 'value',
			axisLabel: {
				formatter: '${value}',
			},
		},
		series: [
			{
				data: [4.8, 5.2, 4.9, 5.1, 5.0, 4.8, 5.3],
				type: 'line',
				smooth: true,
				symbol: 'circle',
				symbolSize: 6,
				lineStyle: {
					width: 2,
					color: '#1890ff',
				},
				itemStyle: {
					color: '#1890ff',
				},
				areaStyle: {
					color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
						{ offset: 0, color: 'rgba(24,144,255,0.2)' },
						{ offset: 1, color: 'rgba(24,144,255,0.05)' },
					]),
				},
			},
		],
	};

	chart.setOption(option);
	window.addEventListener('resize', () => chart.resize());
}

// 平台健康度仪表盘
function initializePlatformHealth() {
	const chart = echarts.init(document.getElementById('platformHealth'));

	const option = {
		series: [
			{
				type: 'gauge',
				startAngle: 180,
				endAngle: 0,
				min: 0,
				max: 100,
				splitNumber: 4,
				axisLine: {
					lineStyle: {
						width: 6,
						color: [
							[0.25, '#f5222d'],
							[0.5, '#faad14'],
							[0.75, '#52c41a'],
							[1, '#1890ff'],
						],
					},
				},
				pointer: {
					icon: 'path://M12.8,0.7l12,40.1H0.7L12.8,0.7z',
					length: '12%',
					width: 4,
					offsetCenter: [0, '-60%'],
					itemStyle: {
						color: 'auto',
					},
				},
				axisTick: {
					length: 12,
					lineStyle: {
						color: 'auto',
						width: 1,
					},
				},
				splitLine: {
					length: 20,
					lineStyle: {
						color: 'auto',
						width: 2,
					},
				},
				axisLabel: {
					color: '#666',
					fontSize: 10,
					distance: -60,
				},
				title: {
					offsetCenter: [0, '-20%'],
					fontSize: 12,
				},
				detail: {
					fontSize: 14,
					offsetCenter: [0, '0%'],
					valueAnimation: true,
					color: 'auto',
				},
				data: [
					{
						value: 95,
						name: 'Morpho',
					},
				],
			},
			{
				type: 'gauge',
				startAngle: 180,
				endAngle: 0,
				min: 0,
				max: 100,
				itemStyle: {
					color: '#58D9F9',
				},
				progress: {
					show: true,
					width: 6,
				},
				pointer: {
					show: false,
				},
				axisLine: {
					lineStyle: {
						width: 6,
						color: [
							[0.25, '#f5222d'],
							[0.5, '#faad14'],
							[0.75, '#52c41a'],
							[1, '#1890ff'],
						],
					},
				},
				axisTick: {
					show: false,
				},
				splitLine: {
					show: false,
				},
				axisLabel: {
					show: false,
				},
				title: {
					fontSize: 12,
					offsetCenter: [0, '-40%'],
				},
				detail: {
					fontSize: 14,
					offsetCenter: [0, '-20%'],
					valueAnimation: true,
					color: 'auto',
				},
				data: [
					{
						value: 92,
						name: 'Aave',
					},
				],
			},
		],
	};

	chart.setOption(option);
	window.addEventListener('resize', () => chart.resize());
}
