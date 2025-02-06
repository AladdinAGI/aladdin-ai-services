// src/tools/staking/pools.tool.ts
import { Tool } from '@langchain/core/tools';

interface StakingPool {
	id: string;
	name: string;
	platform: string;
	type: 'CEX' | 'DEX';
	token: string;
	apy: number;
	minStake: number;
	maxStake: number;
	totalTVL: number;
	risk: 'low' | 'medium' | 'high';
	lockPeriod: number; // in days, 0 for flexible
	features: string[];
	withdrawalTime: number; // in hours
	contractAddress?: string; // for DEX pools
	requiresKYC: boolean;
}

export class StakingPoolsTool extends Tool {
	name = 'staking_pools';
	description = 'Get information about stablecoin staking pools across CEX and DEX platforms';

	private readonly pools: StakingPool[] = [
		// DEX Pools
		{
			id: 'morpho-usdc',
			name: 'Morpho USDC Pool',
			platform: 'Morpho',
			type: 'DEX',
			token: 'USDC',
			apy: 5.31,
			minStake: 1,
			maxStake: 1000000,
			totalTVL: 42156789,
			risk: 'low',
			lockPeriod: 0,
			features: ['auto-compounding', 'insurance-covered'],
			withdrawalTime: 1,
			contractAddress: '0xA7Da0AA37618B77e39C7f41B0875c07c27E534d9',
			requiresKYC: false,
		},
		{
			id: 'aave-usdt',
			name: 'Aave USDT Pool',
			platform: 'Aave',
			type: 'DEX',
			token: 'USDT',
			apy: 4.82,
			minStake: 1,
			maxStake: 2000000,
			totalTVL: 156789000,
			risk: 'low',
			lockPeriod: 0,
			features: ['auto-compounding', 'insurance-covered'],
			withdrawalTime: 1,
			contractAddress: '0xB8f67b2d411F5A984f85479c42DcA49D6D718378',
			requiresKYC: false,
		},
		// CEX Pools
		{
			id: 'binance-usdc',
			name: 'Binance USDC Flexible Savings',
			platform: 'Binance',
			type: 'CEX',
			token: 'USDC',
			apy: 4.95,
			minStake: 0.1,
			maxStake: 1000000,
			totalTVL: 897654321,
			risk: 'low',
			lockPeriod: 0,
			features: ['instant-withdrawal', 'auto-compounding'],
			withdrawalTime: 0,
			requiresKYC: true,
		},
		{
			id: 'okx-usdt',
			name: 'OKX USDT Earnings',
			platform: 'OKX',
			type: 'CEX',
			token: 'USDT',
			apy: 5.15,
			minStake: 1,
			maxStake: 500000,
			totalTVL: 456789123,
			risk: 'low',
			lockPeriod: 0,
			features: ['instant-withdrawal', 'auto-compounding'],
			withdrawalTime: 0,
			requiresKYC: true,
		},
	];

	async _call(input: string): Promise<string> {
		try {
			const result = this.pools.map((pool) => ({
				...pool,
				risk: this.getRiskLevel(pool.risk),
			}));

			// Add filtering logic based on input parameters
			let filteredPools = result;
			const inputLower = input.toLowerCase();

			if (inputLower.includes('dex')) {
				filteredPools = result.filter((pool) => pool.type === 'DEX');
			} else if (inputLower.includes('cex')) {
				filteredPools = result.filter((pool) => pool.type === 'CEX');
			}

			if (inputLower.includes('usdc')) {
				filteredPools = filteredPools.filter((pool) => pool.token === 'USDC');
			} else if (inputLower.includes('usdt')) {
				filteredPools = filteredPools.filter((pool) => pool.token === 'USDT');
			}

			const output = JSON.stringify(
				{
					data: filteredPools,
					timestamp: new Date().toISOString(),
				},
				null,
				2,
			);

			return output;
		} catch (error) {
			return JSON.stringify({
				error:
					'Failed to fetch staking pool information: ' +
					(error instanceof Error ? error.message : 'Unknown error'),
				timestamp: new Date().toISOString(),
			});
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
