// src/tools/morpho/pools.tool.ts
import { Tool } from '@langchain/core/tools';

interface MorphoPool {
	vaultName: string;
	token: string;
	apy: number;
	totalSupply: number;
	risk: 'low' | 'medium' | 'high';
	curator: string;
	contractAddress: string;
}

export class MorphoPoolsTool extends Tool {
	name = 'morpho_pools';
	description = 'Get information about Morpho staking pools and recommendations';

	private readonly pools: MorphoPool[] = [
		{
			vaultName: 'USDC Morpho Vault',
			token: 'USDC',
			apy: 5.31,
			totalSupply: 42156789,
			risk: 'low',
			curator: 'Morpho Association',
			contractAddress: '0xA7Da0AA37618B77e39C7f41B0875c07c27E534d9',
		},
		{
			vaultName: 'USDT Morpho Vault',
			token: 'USDT',
			apy: 5.28,
			totalSupply: 35234567,
			risk: 'low',
			curator: 'Morpho Association',
			contractAddress: '0x843F69bE4501b8E91Df93A9E3a745A91E64b42d3',
		},
		{
			vaultName: 'DAI Morpho Vault',
			token: 'DAI',
			apy: 5.19,
			totalSupply: 28789123,
			risk: 'low',
			curator: 'Morpho Association',
			contractAddress: '0x83F20F44975D03b1b09e64809B757c47f942BEeA',
		},
		{
			vaultName: 'WBTC Morpho Vault',
			token: 'WBTC',
			apy: 4.75,
			totalSupply: 15789123,
			risk: 'medium',
			curator: 'Morpho Association',
			contractAddress: '0x1234567890abcdef1234567890abcdef12345678',
		},
		{
			vaultName: 'WETH Morpho Vault',
			token: 'WETH',
			apy: 4.5,
			totalSupply: 18789123,
			risk: 'medium',
			curator: 'Morpho Association',
			contractAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
		},
	];

	async _call(input: string): Promise<string> {
		console.log('Tool Invoked with Input:', input);

		try {
			const result = this.pools.map((pool) => ({
				vaultName: pool.vaultName,
				token: pool.token,
				apy: pool.apy,
				totalSupply: pool.totalSupply,
				risk: this.getRiskLevel(pool.risk),
				curator: pool.curator,
				contractAddress: pool.contractAddress,
			}));

			const output = JSON.stringify(
				{
					data: result,
					timestamp: new Date().toISOString(),
				},
				null,
				2,
			);

			console.log('Tool Output:', output);
			return output;
		} catch (error) {
			const errorOutput = JSON.stringify({
				data: [],
				error:
					'Failed to fetch Morpho staking pool information: ' +
					(error instanceof Error ? error.message : 'Unknown error'),
				timestamp: new Date().toISOString(),
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
