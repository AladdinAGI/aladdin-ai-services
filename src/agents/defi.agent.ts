// src/agents/defi.agent.ts
import { BaseAgent } from './base.agent';
import { MorphoPoolsTool } from '../tools/morpho/pools.tool';

export class DeFiAgent extends BaseAgent {
	async initialize() {
		this.tools.push(new MorphoPoolsTool());

		const systemPrompt = `你是 Morpho 协议的数据提供者。
  
  每当收到用户查询，执行以下步骤：
  1. 调用 morpho_pools 工具获取数据
  2. 直接返回工具的输出，使用下面的格式：
  
  示例过程：
  Human: 查询质押池
  Thought: 调用工具获取数据
  Action: morpho_pools
  Action Input: query
  Observation: [工具返回的数据]
  Final Answer: [完全相同的数据]
  
  注意：Final Answer 必须与 Observation 完全相同，不要添加任何额外文字或解释。`;

		await this.baseInitialize(systemPrompt);
	}
}
