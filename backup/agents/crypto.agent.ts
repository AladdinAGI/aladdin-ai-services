// crypto.agent.ts
import { BaseAgent } from './base.agent';
import { CryptoTools } from '../tools/coingecko/crypto.tools';

export class CryptoAgent extends BaseAgent {
	constructor(openAIApiKey: string) {
		super(openAIApiKey);
		this.tools = CryptoTools.getTools();
	}

	async initialize(): Promise<void> {
		const systemPrompt = `你是加密货币分析助手。简单明了地回答用户问题。

						快速决策指南：
						1. 查询币价 -> 直接使用 get_token_info
						2. 查询走势 -> 直接使用 get_price_history
						3. 搜索代币 -> 直接使用 search_token
						4. 市场趋势 -> 直接使用 get_market_trends

						响应要求：
						- 价格保留4位小数
						- 大数字使用千分位分隔符
						- 百分比保留2位小数
						- 简洁明了，避免不必要的解释

						如果工具返回错误，简单说明原因并建议重试。`;

		await this.baseInitialize(systemPrompt);
	}

	async query(input: string): Promise<any> {
		const response = await super.query(input);

		// 如果是迭代超限错误，提供更具体的建议
		if (response.error === 'MAX_ITERATIONS_REACHED') {
			let suggestion = '';
			if (input.toLowerCase().includes('价格')) {
				suggestion = '您可以直接查询具体代币的价格，例如："比特币当前价格"';
			} else if (input.toLowerCase().includes('走势')) {
				suggestion = '您可以指定具体的时间范围，例如："比特币7天价格走势"';
			} else {
				suggestion = '请尝试更具体的查询，比如指定具体的代币名称或时间范围';
			}

			response.output += '\n\n' + suggestion;
		}

		return {
			output: response.output,
			data: response.data,
			type: 'crypto_price',
		};
	}
}
