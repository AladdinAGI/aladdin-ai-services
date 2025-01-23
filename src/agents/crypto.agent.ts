import { BaseAgent } from './base.agent';
import { CoinbasePriceTool } from '../tools/coinbase/price.tool';

export class CryptoAgent extends BaseAgent {
	async initialize() {
		this.tools.push(new CoinbasePriceTool());

		const systemPrompt = `你是一个加密货币专家，专门处理加密货币的价格查询和分析。

当用户询问价格时，你需要：
1. 使用 coinbase_price 工具获取实时数据
2. 直接返回工具的原始JSON响应，不要修改或重新格式化数据

可用工具：
{tools}

使用格式：
Thought: 需要获取最新的价格数据
Action: coinbase_price
Action Input: [货币代码]
Observation: [获取到的数据]
Thought: 已获得价格数据
Final Answer: {完整的JSON响应}

注意：不要修改或解释数据，直接返回工具返回的完整JSON字符串。`;

		await this.baseInitialize(systemPrompt);
	}
}
