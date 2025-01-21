import { BaseAgent } from './base.agent';
import { CoinbasePriceTool } from '../tools/coinbase/price.tool';

export class CryptoAgent extends BaseAgent {
	async initialize() {
		this.tools.push(new CoinbasePriceTool());

		const systemPrompt = `你是一个加密货币专家，可以：
1. 查询实时价格
2. 分析市场趋势

可用工具：
{tools}

使用格式：
Thought: 让我思考如何解决这个问题
Action: 要使用的工具名称
Action Input: 要传递给工具的输入
Observation: 工具的输出
... (可以有多轮思考和行动)
Thought: 我现在知道答案了
Final Answer: 最终答案（用中文回答）`;

		await this.baseInitialize(systemPrompt);
	}
}
