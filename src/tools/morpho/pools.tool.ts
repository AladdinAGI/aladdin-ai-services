// src/tools/morpho/pools.tool.ts
import { Tool } from '@langchain/core/tools';

export class MorphoPoolsTool extends Tool {
	name = 'morpho_pools';
	description = 'Get information about Morpho staking pools and recommendations';

	private readonly pools = [
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
		console.log('Tool Invoked with Input:', input);

		try {
			const result = this.pools.map((pool) => ({
				name: pool.name,
				token: pool.token,
				apy: pool.apy,
				tvl: pool.totalSupply,
				risk: this.getRiskLevel(pool.risk as 'low' | 'medium' | 'high'),
				details: pool.details,
			}));

			const output = JSON.stringify({ data: result });
			console.log('Tool Output:🌺🌺🌺🌺🌺', output); // 打印返回值
			return output;
		} catch (error) {
			const errorOutput = JSON.stringify({
				data: [],
				error: '获取 Morpho 质押池信息失败🌺🌺🌺: ' + (error instanceof Error ? error.message : '未知错误'),
			});
			console.error('Tool Error:', errorOutput);
			return errorOutput;
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
