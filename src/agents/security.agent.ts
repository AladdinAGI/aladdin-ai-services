// src/agents/security.agent.ts
import { BaseAgent } from './base.agent';
import { SecurityTools } from '../tools/chains/security.tools';

export class SecurityAgent extends BaseAgent {
	constructor(openAIApiKey: string, rpcUrl: string, etherscanApiKey: string) {
		super(openAIApiKey);
		const tools = new SecurityTools(rpcUrl, etherscanApiKey);
		tools.getTools().forEach((tool) => this.addTool(tool));
	}

	async initialize(): Promise<void> {
		const systemPrompt = `你是一个智能合约安全专家。分析合约时需要关注：
- 合约验证状态
- 貔貅特征
- 可疑权限控制
- 交易限制
- 交易历史模式

提供清晰的安全评估和风险等级。`;

		await this.baseInitialize(systemPrompt);
	}
}
