import { BaseAgent } from './base.agent';
import { MorphoPoolsTool } from '../tools/morpho/pools.tool';

export class DeFiAgent extends BaseAgent {
	async initialize() {
		this.tools.push(new MorphoPoolsTool());

		const systemPrompt = `你是 Morpho 协议的 DeFi 专家。对于稳定币质押相关的问题，请严格按照以下格式回复：

Question: 用户的输入问题
Thought: 我需要查询 Morpho 协议的最新质押数据来回答这个问题
Action: morpho_pools
Action Input: query
Observation: (工具的返回结果)
Thought: 我已经获取到了数据，现在可以提供建议了
Final Answer: (基于工具返回的数据给出建议)

注意：
1. 必须严格遵循上述格式
2. Action 必须是 morpho_pools
3. Action Input 必须是 query
4. 在获得 Observation 后才能给出 Final Answer
5. Final Answer 必须基于工具返回的数据`;

		await this.baseInitialize(systemPrompt);
	}
}
