// src/agents/defi.agent.ts
import { BaseAgent } from './base.agent';
import { MorphoPoolsTool } from '../tools/morpho/pools.tool';

export class DeFiAgent extends BaseAgent {
	private morphoTool: MorphoPoolsTool;
	private initialized = false;

	constructor(openAIApiKey: string) {
		super(openAIApiKey);
		this.morphoTool = new MorphoPoolsTool();
	}

	async initialize() {
		if (this.initialized) return;

		const systemPrompt = `你是 Morpho 协议的 DeFi 专家。分析用户查询，使用 morpho_pools 工具获取最新数据。

对于基础查询（如"显示所有池子"），直接返回数据。
对于复杂查询（如"哪个池子最适合我"），需要：
1. 获取最新数据
2. 基于用户需求分析每个池子
3. 给出专业的投资建议

始终记住：
- 数据是实时的，每次都要重新获取
- 建议要基于最新数据
- 返回的是 JSON 格式数据`;

		this.tools.push(this.morphoTool);
		await this.baseInitialize(systemPrompt);
		this.initialized = true;
	}

	async query(input: string): Promise<any> {
		try {
			// 使用简单的关键词匹配来判断是否是基础的质押池查询
			const isBasicPoolQuery = /质押|收益率|apy|投资|利率|池子|理财/.test(input.toLowerCase());

			if (isBasicPoolQuery) {
				// 直接调用工具获取最新数据
				const result = await this.morphoTool._call(input);
				return {
					output: result,
					intermediateSteps: [],
				};
			}

			// 对于复杂查询（如风险分析、收益比较等），使用 AI 处理
			return super.query(input);
		} catch (error) {
			console.error('DeFi agent query error:', error);
			return {
				output: '获取质押池数据失败',
				error: error instanceof Error ? error.message : '未知错误',
			};
		}
	}
}
