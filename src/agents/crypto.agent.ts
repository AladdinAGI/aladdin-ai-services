import { BaseAgent } from './base.agent';
import { CoinbasePriceTool } from '../tools/coinbase/price.tool';

export class CryptoAgent extends BaseAgent {
	private coinbaseTool: CoinbasePriceTool;
	private initialized = false;

	constructor(openAIApiKey: string) {
		super(openAIApiKey);
		this.coinbaseTool = new CoinbasePriceTool();
	}

	async initialize() {
		if (this.initialized) return;

		const systemPrompt = `你是一个专业的加密货币分析师，负责处理加密货币的价格查询和分析。
    
    处理用户查询时，请遵循以下规则：
    1. 价格查询类型：
       - 基础查询：查询单个币种当前价格（如"BTC价格"、"比特币价格"）
       - 趋势查询：查询价格走势（如"比特币最近一周走势"、"BTC价格走势"）
       - 对比分析：比较多个币种（如"比较BTC和ETH的表现"）
    
    2. 响应格式：
       - 基础查询：调用 coinbase_price 工具获取实时数据
       - 趋势查询：调用 coinbase_history 获取历史数据
       - 对比分析：分别获取数据后进行对比分析
    
    3. 输出要求：
       - 价格数据需要实时更新
       - 包含24小时涨跌幅
       - 对于趋势数据，提供关键时间点的价格变化
       - 添加简要的市场分析
    
    请使用工具获取数据，并以结构化的方式呈现结果。`;

		this.tools.push(this.coinbaseTool);
		await this.baseInitialize(systemPrompt);
		this.initialized = true;
	}

	async query(input: string): Promise<any> {
		try {
			// 判断查询类型
			const queryType = this.determineQueryType(input);

			if (queryType === 'basic') {
				// 直接获取价格
				const result = await this.coinbaseTool._call(this.extractCryptoSymbol(input));
				return {
					output: result,
					type: 'crypto_price',
				};
			} else if (queryType === 'trend') {
				// 获取历史数据用于绘制走势图
				const result = await this.getHistoricalData(this.extractCryptoSymbol(input));
				return {
					output: result,
					type: 'crypto_trend',
				};
			}

			// 其他复杂查询使用 AI 处理
			return super.query(input);
		} catch (error) {
			console.error('Crypto agent query error:', error);
			return {
				output: '获取加密货币数据失败',
				error: error instanceof Error ? error.message : '未知错误',
			};
		}
	}

	private determineQueryType(input: string): 'basic' | 'trend' | 'complex' {
		const basicPattern = /(BTC|ETH|比特币|以太坊).*(价格|多少)/i;
		const trendPattern = /.*(走势|趋势|变化|历史)/i;

		if (trendPattern.test(input)) return 'trend';
		if (basicPattern.test(input)) return 'basic';
		return 'complex';
	}

	private extractCryptoSymbol(input: string): string {
		const symbolMap = {
			比特币: 'BTC',
			以太坊: 'ETH',
			泰达币: 'USDT',
			币安币: 'BNB',
			索拉纳: 'SOL',
		};

		for (const [key, value] of Object.entries(symbolMap)) {
			if (input.includes(key)) return value;
		}

		// 如果包含直接的符号，提取它
		const match = input.match(/\b(BTC|ETH|USDT|BNB|SOL)\b/i);
		return match ? match[0].toUpperCase() : 'BTC';
	}

	private async getHistoricalData(symbol: string) {
		try {
			const result = await this.coinbaseTool._call(symbol);
			const parsedData = JSON.parse(result);

			if (parsedData.history) {
				return {
					symbol: parsedData.symbol,
					currentPrice: parsedData.price,
					priceData: parsedData.history,
					lastUpdated: parsedData.lastUpdated,
				};
			}

			throw new Error('无法获取历史数据');
		} catch (error) {
			console.error('获取历史数据失败:', error);
			throw error;
		}
	}
}
