import { BaseChain } from './base.chain';
import { ChainResponse, StakingPool } from '../types';

export class StakeChain extends BaseChain {
	name = 'stake_chain';
	description = '质押相关查询链';

	// 预设的质押池数据
	private pools: StakingPool[] = [
		{
			name: 'USDC.e Supply',
			apy: 4.85,
			tvl: 95_000_000,
			risk: 'low',
		},
		{
			name: 'USDT Supply',
			apy: 4.71,
			tvl: 82_000_000,
			risk: 'low',
		},
	];

	async execute(query: string): Promise<ChainResponse> {
		try {
			const sortedPools = [...this.pools].sort((a, b) => b.apy - a.apy);
			const poolsInfo = sortedPools
				.map((pool) => `${pool.name}: APY ${pool.apy}%, TVL $${pool.tvl.toLocaleString()}`)
				.join('\n');

			return {
				result: `推荐的质押池:\n${poolsInfo}`,
			};
		} catch (error) {
			return this.handleError(error);
		}
	}
}
