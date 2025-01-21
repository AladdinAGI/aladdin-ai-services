// src/tools/morpho/pools.tool.ts
import { Tool } from '@langchain/core/tools';

interface MorphoPool {
	name: string;
	apy: number;
	totalSupply: number;
	token: string;
	risk: 'low' | 'medium' | 'high';
	details: string;
}

export class MorphoPoolsTool extends Tool {
	name = 'morpho_pools';
	description = 'Get information about Morpho staking pools and recommendations';

	// 精选的 Morpho 质押池列表
	private readonly pools: MorphoPool[] = [
		{
			name: 'USDT Supply',
			token: 'USDT',
			apy: 4.71,
			totalSupply: 82_000_000,
			risk: 'low',
			details: 'Aave V3 market on Ethereum mainnet',
		},
		{
			name: 'USDC.e Supply',
			token: 'USDC.e',
			apy: 4.85,
			totalSupply: 95_000_000,
			risk: 'low',
			details: 'Aave V3 market on Ethereum mainnet',
		},
		{
			name: 'DAI Supply',
			token: 'DAI',
			apy: 4.68,
			totalSupply: 78_000_000,
			risk: 'low',
			details: 'Aave V3 market on Ethereum mainnet',
		},
	];

	async _call(input: string): Promise<string> {
		try {
			let response = '基于 Morpho 协议的稳定币质押方案推荐：\n\n';

			this.pools.forEach((pool) => {
				response += `${pool.name}:\n`;
				response += `- 当前 APY: ${pool.apy}%\n`;
				response += `- TVL (总锁仓量): $${pool.totalSupply.toLocaleString()}\n`;
				response += `- 风险评级: ${this.getRiskLevel(pool.risk)}\n`;
				response += `- 市场类型: ${pool.details}\n\n`;
			});

			response += '\n重要提示：\n';
			response += '1. 以上数据来自 Morpho 协议精选池子\n';
			response += '2. 建议在 Morpho 官网 (https://app.morpho.org) 进行操作\n';
			response += '3. 投资前请仔细评估风险，合理分配资金\n';

			return response;
		} catch (error) {
			return '获取 Morpho 质押池信息失败: ' + (error instanceof Error ? error.message : '未知错误');
		}
	}

	private getRiskLevel(risk: 'low' | 'medium' | 'high'): string {
		const riskMap = {
			low: '低风险',
			medium: '中等风险',
			high: '高风险',
		};
		return riskMap[risk];
	}
}
