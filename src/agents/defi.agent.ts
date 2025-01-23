// src/agents/defi.agent.ts
import { BaseAgent } from './base.agent';
import { MorphoPoolsTool } from '../tools/morpho/pools.tool';

export class DeFiAgent extends BaseAgent {
	async initialize() {
		this.tools.push(new MorphoPoolsTool());

		const systemPrompt = `你是一个 DeFi 专家，专门提供 Morpho 协议的稳定币质押建议。当用户询问质押相关问题时，你需要使用 morpho_pools 工具获取最新数据。

可用工具：
{tools}

使用格式：
Thought: 让我思考如何解决这个问题
Action: morpho_pools
Action Input: query
Observation: (工具返回的数据)
Thought: 我现在知道答案了
Final Answer: [完整展示池子信息]`;

		await this.baseInitialize(systemPrompt);
	}
}
