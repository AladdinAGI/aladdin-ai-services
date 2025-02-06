// src/tools/staking/pools.tool.ts
import { Tool } from '@langchain/core/tools';

export interface StakingPool {
	id: string;
	name: string;
	platform: string;
	type: 'CEX' | 'DEX' | 'OnChain';
	token: string;
	apy: number;
	minStake: number;
	maxStake: number;
	totalTVL: number;
	risk: 'low' | 'medium' | 'high';
	lockPeriod: number; // 单位：天，0 表示灵活质押
	features: string[];
	withdrawalTime: number; // 单位：小时
	contractAddress?: string; // 针对 DEX 或链上池子
	requiresKYC: boolean;
}

export class StakingPoolsTool extends Tool {
	name = 'staking_pools';
	description = '获取来自DEX、CEX和链上多来源的稳定币质押池数据';

	// 模拟的 DEX 池数据，扩充了更多示例
	private readonly dexPools: StakingPool[] = [
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
			features: ['自动复投', '保险覆盖'],
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
			features: ['自动复投', '保险覆盖'],
			withdrawalTime: 1,
			contractAddress: '0xB8f67b2d411F5A984f85479c42DcA49D6D718378',
			requiresKYC: false,
		},
		{
			id: 'curve-usdt',
			name: 'Curve USDT StablePool',
			platform: 'Curve',
			type: 'DEX',
			token: 'USDT',
			apy: 6.1,
			minStake: 10,
			maxStake: 500000,
			totalTVL: 200000000,
			risk: 'medium',
			lockPeriod: 0,
			features: ['低滑点', '高流动性'],
			withdrawalTime: 1,
			contractAddress: '0xCurvePoolAddress',
			requiresKYC: false,
		},
		{
			id: 'balancer-usdc',
			name: 'Balancer USDC Pool',
			platform: 'Balancer',
			type: 'DEX',
			token: 'USDC',
			apy: 5.7,
			minStake: 5,
			maxStake: 800000,
			totalTVL: 150000000,
			risk: 'low',
			lockPeriod: 0,
			features: ['多资产池', '自动再平衡'],
			withdrawalTime: 1,
			contractAddress: '0xBalancerPoolAddress',
			requiresKYC: false,
		},
		{
			id: 'sushiswap-stable',
			name: 'SushiSwap Stable Pool',
			platform: 'SushiSwap',
			type: 'DEX',
			token: 'USDT',
			apy: 5.5,
			minStake: 1,
			maxStake: 600000,
			totalTVL: 100000000,
			risk: 'low',
			lockPeriod: 0,
			features: ['低手续费', '社区支持'],
			withdrawalTime: 1,
			contractAddress: '0xSushiPoolAddress',
			requiresKYC: false,
		},
	];

	// 模拟的 CEX 池数据，扩充了更多示例
	private readonly cexPools: StakingPool[] = [
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
			features: ['即时提现', '自动复投'],
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
			features: ['即时提现', '自动复投'],
			withdrawalTime: 0,
			requiresKYC: true,
		},
		{
			id: 'huobi-usdt',
			name: 'Huobi USDT Flexible Savings',
			platform: 'Huobi',
			type: 'CEX',
			token: 'USDT',
			apy: 5.2,
			minStake: 1,
			maxStake: 900000,
			totalTVL: 800000000,
			risk: 'low',
			lockPeriod: 0,
			features: ['即时提现', '高安全性'],
			withdrawalTime: 0,
			requiresKYC: true,
		},
		{
			id: 'kraken-usdc',
			name: 'Kraken USDC Earn',
			platform: 'Kraken',
			type: 'CEX',
			token: 'USDC',
			apy: 4.75,
			minStake: 0.5,
			maxStake: 750000,
			totalTVL: 500000000,
			risk: 'low',
			lockPeriod: 0,
			features: ['稳定收益', '平台保险'],
			withdrawalTime: 0,
			requiresKYC: true,
		},
	];

	// 如果需要整合链上数据，也可以增加相应数组
	private readonly onChainPools: StakingPool[] = [
		{
			id: 'compound-usdc',
			name: 'Compound USDC Market',
			platform: 'Compound',
			type: 'OnChain',
			token: 'USDC',
			apy: 4.5,
			minStake: 1,
			maxStake: 800000,
			totalTVL: 123456789,
			risk: 'medium',
			lockPeriod: 0,
			features: ['无需KYC', '去中心化治理'],
			withdrawalTime: 2,
			contractAddress: '0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b',
			requiresKYC: false,
		},
	];

	async _call(input: string): Promise<string> {
		try {
			// 聚合所有数据源
			let pools: StakingPool[] = [];
			pools = pools.concat(this.dexPools, this.cexPools, this.onChainPools);

			// 根据输入关键字进行过滤：平台类型、代币种类等
			let filteredPools = pools;
			const inputLower = input.toLowerCase();

			if (inputLower.includes('dex')) {
				filteredPools = filteredPools.filter((pool) => pool.type === 'DEX');
			} else if (inputLower.includes('cex')) {
				filteredPools = filteredPools.filter((pool) => pool.type === 'CEX');
			} else if (inputLower.includes('onchain') || inputLower.includes('链上')) {
				filteredPools = filteredPools.filter((pool) => pool.type === 'OnChain');
			}

			if (inputLower.includes('usdc')) {
				filteredPools = filteredPools.filter((pool) => pool.token === 'USDC');
			} else if (inputLower.includes('usdt')) {
				filteredPools = filteredPools.filter((pool) => pool.token === 'USDT');
			}

			// 将风险等级转为中文描述
			const riskMap = {
				low: '低风险',
				medium: '中等风险',
				high: '高风险',
			};

			const result = filteredPools.map((pool) => ({
				...pool,
				risk: riskMap[pool.risk] || pool.risk,
			}));

			const output = JSON.stringify(
				{
					data: result,
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
}
