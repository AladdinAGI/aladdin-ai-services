// Store chat history
let chatHistory = [];
const MAX_HISTORY = 20; // Maximum stored history items

// Tool configuration
const toolsInfo = [
	{
		name: { en: 'Token Information', zh: '代币信息' },
		examples: {
			en: ['Current Bitcoin price', 'Ethereum market cap', 'Search by contract address (e.g. 0x...)'],
			zh: ['当前比特币价格', '以太坊市值', '通过合约地址搜索 (例如 0x...)']
		}
	},
	{
		name: { en: 'Price History', zh: '价格历史' },
		examples: {
			en: ['Bitcoin 7-day trend', 'Ethereum 30-day history', 'BNB price changes'],
			zh: ['比特币7天趋势', '以太坊30天历史', 'BNB价格变化']
		}
	},
	{
		name: { en: 'Token Search', zh: '代币搜索' },
		examples: {
			en: ['Search "uni" tokens', 'Find Arbitrum tokens', 'Trending tokens'],
			zh: ['搜索"uni"代币', '查找Arbitrum代币', '热门代币']
		}
	},
	{
		name: { en: 'Market Trends', zh: '市场趋势' },
		examples: {
			en: ['Current market trends', 'Top trending tokens', 'Top gainers'],
			zh: ['当前市场趋势', '热门代币', '涨幅最大代币']
		}
	},
	{
		name: { en: 'Stablecoin Staking', zh: '稳定币质押' },
		examples: {
			en: ['Best USDC staking pools', 'Best USDT staking APY', 'Top DAI yields'],
			zh: ['最佳USDC质押池', '最佳USDT质押年化', '最高DAI收益']
		}
	},
];

// Initialize on window load
window.onload = function () {
	initializeLanguage();
	initializeHelpContent();
	loadChatHistory();
	setupEventListeners();
	initializeRightPanelCharts();
};

// Initialize help content
function initializeHelpContent() {
	const helpContent = document.getElementById('helpContent');
	const lang = document.documentElement.lang;
	
	helpContent.innerHTML = ''; // Clear existing content
	
	toolsInfo.forEach((tool) => {
		const section = document.createElement('div');
		section.className = 'tool-section';
		section.innerHTML = `
			<h3>${tool.name[lang]}</h3>
			<div class="quick-questions">
				${tool.examples[lang].map(example => `
					<button class="quick-question-btn">${example}</button>
				`).join('')}
			</div>
		`;
		helpContent.appendChild(section);
	});

	// Add quick question click handlers
	document.querySelectorAll('.quick-question-btn').forEach((btn) => {
		btn.addEventListener('click', () => {
			document.getElementById('messageInput').value = btn.textContent;
			sendMessage();
		});
	});
}

// Load history from localStorage
function loadChatHistory() {
	const saved = localStorage.getItem('chatHistory');
	if (saved) {
		chatHistory = JSON.parse(saved);
		updateHistoryDisplay();
	}
}

// Save history to localStorage
function saveChatHistory() {
	localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
}

// Add new history entry
function addToHistory(question, answer) {
	const time = new Date().toLocaleTimeString();
	let type = 'general';

	// Bilingual type detection
	const lowerQuestion = question.toLowerCase();
	if (lowerQuestion.includes('staking') || lowerQuestion.includes('质押') || 
		lowerQuestion.includes('apy') || lowerQuestion.includes('收益')) {
		type = 'staking';
	} else if (lowerQuestion.includes('price') || lowerQuestion.includes('价格') || 
		lowerQuestion.includes('market cap') || lowerQuestion.includes('币价')) {
		type = 'price';
	}

	chatHistory.push({ time, question, answer, type });

	// Maintain history limit
	if (chatHistory.length > MAX_HISTORY) {
		chatHistory.shift();
	}

	updateHistoryDisplay();
}

// Update history display
function updateHistoryDisplay() {
	const historyList = document.getElementById('historyList');
	historyList.innerHTML = '';

	// Display reversed history (newest first)
	chatHistory
		.slice()
		.reverse()
		.forEach((item) => {
			const historyItem = document.createElement('div');
			historyItem.className = 'history-item';

			// Bilingual tags
			let tags = '';
			if (item.type === 'staking') {
				tags = `
					<span class="tag-staking" data-lang="en">Staking</span>
					<span class="tag-staking" data-lang="zh">质押</span>
				`;
			} else if (item.type === 'price') {
				tags = `
					<span class="tag-price" data-lang="en">Price</span>
					<span class="tag-price" data-lang="zh">行情</span>
				`;
			}

			historyItem.innerHTML = `
				<div class="history-time">${item.time}</div>
				<div class="history-content">
					<div class="history-question">${item.question}</div>
					${tags}
				</div>
			`;

			// Click to resend
			historyItem.addEventListener('click', () => {
				document.getElementById('messageInput').value = item.question;
				sendMessage();
			});

			historyList.appendChild(historyItem);
		});
}

// Message sending logic
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
		const response = await fetch('https://api.aladdinagi.xyz/query', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ input: message }),
		});

		const responseData = await response.json();
		handleResponse(responseData, loadingMessage);

		// Add to history after response
		if (responseData.output) {
			addToHistory(message, responseData.output);
		}
	} catch (error) {
		console.error('API Error:', error);
		loadingMessage.querySelector('.message-content').textContent = 
			document.documentElement.lang === 'zh' 
				? '抱歉，服务器连接失败，请稍后重试。' 
				: 'Service unavailable. Please try again later.';
	} finally {
		input.disabled = false;
		sendButton.disabled = false;
		input.value = '';
		input.focus();
		scrollToBottom();
	}
}

// Handle API response
function handleResponse(responseData, loadingMessage) {
	const messageContent = document.createElement('div');
	messageContent.className = 'message-content';

	// Process text response
	if (responseData.output) {
		const textDiv = document.createElement('div');
		const processedOutput = responseData.output.replace(/\\n/g, '\n').replace(/\n/g, '<br>');
		textDiv.innerHTML = processedOutput;
		messageContent.appendChild(textDiv);
	}

	// Process data responses
	if (responseData.data) {
		if (responseData.type === 'staking_pools') {
			const poolsTable = createStakingPoolsTable(responseData.data);
			messageContent.appendChild(poolsTable);
		} else if (responseData.data.prices) {
			const chartDiv = createChartContainer();
			messageContent.appendChild(chartDiv);
			setTimeout(() => renderPriceChart(chartDiv, responseData.data.prices), 0);
		} else if (Array.isArray(responseData.data)) {
			const table = createTable(responseData.data);
			messageContent.appendChild(table);
		}
	}

	// Replace loading message
	loadingMessage.querySelector('.message-content').replaceWith(messageContent);
}

// Create chart container
function createChartContainer() {
	const chartDiv = document.createElement('div');
	chartDiv.className = 'chart-container';
	// Set minimum width to ensure chart doesn't get too narrow
	chartDiv.style.minWidth = '800px';
	chartDiv.style.width = '100%';
	chartDiv.style.height = '360px'; // Increase height to accommodate rotated labels
	// Add horizontal scroll container
	const scrollContainer = document.createElement('div');
	scrollContainer.className = 'chart-scroll-container';
	scrollContainer.appendChild(chartDiv);
	return scrollContainer;
}

// Format date
function formatDate(timestamp) {
	const date = new Date(timestamp);
	const month = (date.getMonth() + 1).toString().padStart(2, '0');
	const day = date.getDate().toString().padStart(2, '0');
	const hour = date.getHours().toString().padStart(2, '0');
	const minute = date.getMinutes().toString().padStart(2, '0');
	return `${month}-${day} ${hour}:${minute}`;
}

// Render price chart
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
			text: `Price Trend ${isPositive ? '↑' : '↓'} ${isPositive ? '+' : ''}${priceChange}%`,
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
				return `${data.name}<br/>Price: $${data.value.toFixed(2)}`;
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
			left: 60, // Increase left spacing to show price
			right: 30,
			bottom: 60, // Increase bottom spacing to show date
			containLabel: true,
		},
		xAxis: {
			type: 'category',
			data: dates,
			boundaryGap: false,
			axisLine: { lineStyle: { color: '#ddd' } },
			axisLabel: {
				color: '#666',
				rotate: 45, // Fixed 45 degree angle for date display
				interval: Math.ceil(dates.length / 30), // Auto-calculate interval based on data
				margin: 15, // Increase label-to-axis distance
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
				// Add zoom controls
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

	// Responsive adjustment
	const resizeHandler = () => {
		if (chart) {
			chart.resize({
				width: Math.max(800, chartContainer.clientWidth), // Ensure minimum width
			});
		}
	};

	window.addEventListener('resize', resizeHandler);
	resizeHandler(); // Initial adjustment

	// Cleanup function
	return () => {
		window.removeEventListener('resize', resizeHandler);
		chart.dispose();
	};
}

// Create staking pool table
function createStakingPoolsTable(pools) {
	const table = document.createElement('table');
	table.className = 'staking-pools-table';

	table.innerHTML = `
        <thead>
            <tr>
                <th>Platform</th>
                <th>Token</th>
                <th>APY</th>
                <th>Risk Level</th>
                <th>Minimum Stake</th>
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

// Create regular data table
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

// Create earnings display
function createEarningsDisplay(data) {
	const div = document.createElement('div');
	div.className = 'earnings-display';

	div.innerHTML = `
        <div class="earnings-header">
            <h3>Earnings Prediction</h3>
            <span class="amount">Investment Amount: $${formatNumber(data.principal)}</span>
        </div>
        <div class="earnings-grid">
            <div class="earnings-item">
                <span class="label">Daily Earnings</span>
                <span class="value">$${formatNumber(data.dailyEarnings)}</span>
            </div>
            <div class="earnings-item">
                <span class="label">Monthly Earnings</span>
                <span class="value">$${formatNumber(data.monthlyEarnings)}</span>
            </div>
            <div class="earnings-item">
                <span class="label">Yearly Earnings</span>
                <span class="value">$${formatNumber(data.yearlyEarnings)}</span>
            </div>
        </div>
    `;

	return div;
}

// Create risk analysis display
function createRiskAnalysisDisplay(data) {
	const div = document.createElement('div');
	div.className = 'risk-analysis';

	div.innerHTML = `
        <div class="risk-header">
            <h3>${data.platform} Platform Risk Analysis</h3>
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

// UI Helper functions
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

// Utility functions
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

// Set event listeners
function setupEventListeners() {
	document.getElementById('sendButton').addEventListener('click', sendMessage);

	document.getElementById('messageInput').addEventListener('keypress', function (e) {
		if (e.key === 'Enter') {
			sendMessage();
		}
	});
}
// Initialize right panel charts
function initializeRightPanelCharts() {
	initializeStakingDistribution();
	initializeEarningsChart();
	initializePlatformHealth();
}

// Staking distribution pie chart
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

// Earnings trend chart
function initializeEarningsChart() {
	const chart = echarts.init(document.getElementById('earningsChart'));

	// Simulate daily earnings data for the past 7 days
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

// Platform health gauge
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

// Language initialization
document.addEventListener('DOMContentLoaded', initializeLanguage);

function initializeLanguage() {
	let userLang = localStorage.getItem('userLang') || 
				   detectChineseServer() || 
				   (navigator.language.startsWith('zh') ? 'zh' : 'en');
	
	document.documentElement.lang = userLang;
	
	// Update UI elements
	document.querySelectorAll('[data-lang]').forEach(el => {
		el.style.display = el.dataset.lang === userLang ? 'inline' : 'none';
	});
	
	document.querySelectorAll('[data-placeholder-en]').forEach(input => {
		input.placeholder = userLang === 'zh' 
			? input.dataset.placeholderZh 
			: input.dataset.placeholderEn;
	});
}

// Add to existing language functions
function switchLanguage(lang) {
	localStorage.setItem('userLang', lang);
	initializeLanguage();
	refreshDynamicContent();
}

function refreshDynamicContent() {
	initializeHelpContent(); // Refresh help examples
	updateHistoryDisplay(); // Refresh history items
	// Add other dynamic content refreshes if needed
}
