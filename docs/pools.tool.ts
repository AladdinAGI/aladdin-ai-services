// src/tools/morpho/pools.tool.ts
import { MessageContent } from '@langchain/core/messages';
import { Tool } from '@langchain/core/tools';
import { ChatOpenAI } from '@langchain/openai';

export class MorphoPoolsTool extends Tool {
	name = 'morpho_pools';
	description = 'Get information about Morpho staking pools and recommendations';
	private model: ChatOpenAI;

	constructor(openAIApiKey: string) {
		super();
		this.model = new ChatOpenAI({
			openAIApiKey,
			modelName: 'gpt-3.5-turbo',
			temperature: 0.2,
		});
	}

	async _call(input: string): Promise<string> {
		console.log('Morpho Tool Input:', input);

		try {
			// 根据不同的查询类型使用不同的提示词
			const isAnalysisQuery = /分析|推荐|建议|比较|风险|收益|如何|应该/.test(input);
			const systemPrompt = isAnalysisQuery ? this.getAnalysisPrompt() : this.getBasicPrompt();

			const response = await this.model.invoke(`${systemPrompt}\n\n用户查询: ${input}`);

			// 确保输出是合法的 JSON 格式
			const formattedResponse = this.formatResponse(response.content as MessageContent);
			console.log('Morpho Tool Output:', formattedResponse);
			return formattedResponse;
		} catch (error) {
			console.error('Morpho Tool Error:', error);
			return JSON.stringify({
				data: [],
				error: '获取 Morpho 质押池信息失败: ' + (error instanceof Error ? error.message : '未知错误'),
			});
		}
	}

	private getBasicPrompt(): string {
		return `你是 Morpho 协议的数据提供者。请生成 Aave V3 以太坊主网上的稳定币供应池数据，包括：

- USDT、USDC.e、DAI 三个主要池子
- APY 范围在 3-6% 之间
- 总供应量在 5000万-2亿美元之间
- 基于协议安全性的风险评级

输出必须是以下格式的 JSON:
{
  "data": [
    {
      "name": "池子名称",
      "token": "代币符号",
      "apy": 年化收益率(数字),
      "tvl": 总锁仓量(数字),
      "risk": "风险等级(低风险/中等风险/高风险)",
      "details": "市场详情"
    }
  ]
}`;
	}

	private getAnalysisPrompt(): string {
		return `你是 Morpho 协议的专业分析师。请基于以下因素分析并提供建议：

- 风险偏好与收益率的平衡
- 流动性与市场深度
- 稳定币的信用风险
- 协议的技术风险

输出格式：
{
  "data": [池子数据数组],
  "analysis": {
    "recommendation": "建议摘要",
    "details": "详细分析"
  }
}`;
	}

	private formatResponse(content: MessageContent): string {
		try {
			// 尝试直接解析 AI 的回复
			const parsed = JSON.parse(content.toString());
			return JSON.stringify(parsed);
		} catch {
			// 如果解析失败，提取信息并格式化
			const poolData = this.extractPoolData(content.toString());
			return JSON.stringify({ data: poolData });
		}
	}

	private extractPoolData(text: string): any[] {
		const tokens = ['USDT', 'USDC.e', 'DAI'];
		return tokens
			.map((token) => {
				try {
					const apy = text.match(new RegExp(`${token}[^]*?apy[^]*?(\\d+(\\.\\d+)?)%`, 'i'))?.[1];
					const tvl = text.match(new RegExp(`${token}[^]*?tvl[^]*?(\\d+)`, 'i'))?.[1];
					const risk = text.match(new RegExp(`${token}[^]*?风险[^]*?(低|中|高)`, 'i'))?.[1];

					if (!apy || !tvl || !risk) return null;

					return {
						name: `${token} Supply`,
						token,
						apy: parseFloat(apy),
						tvl: parseInt(tvl) * 1_000_000,
						risk: `${risk}风险`,
						details: 'Aave V3 market on Ethereum mainnet',
					};
				} catch {
					return null;
				}
			})
			.filter(Boolean);
	}
}
