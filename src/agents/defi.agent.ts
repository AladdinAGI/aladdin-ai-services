// src/agents/defi.agent.ts
import { BaseAgent } from './base.agent';
import { StakingPoolsTool } from '../tools/staking/pools.tool';
import { Defiprompt } from '../prompts/templates';

export class DeFiAgent extends BaseAgent {
	private stakingTool: StakingPoolsTool;
	private initialized = false;

	constructor(openAIApiKey: string) {
		super(openAIApiKey);
		this.stakingTool = new StakingPoolsTool();
	}

	// Implement abstract method initialize
	async initialize(): Promise<void> {
		if (this.initialized) return;

		const systemPrompt = Defiprompt;

		// Add tools
		this.tools.push(this.stakingTool);

		// Call parent class initialization method
		await super.baseInitialize(systemPrompt);

		this.initialized = true;
	}

	async query(input: string): Promise<any> {
		try {
			const isStakingQuery = 
			/staking|yield|apy|deposit|investment|rate|pool|savings|defi|earnings/i.test(
				input.toLowerCase(),
				);

			if (isStakingQuery) {
				// Get latest staking pool data
				const stakingData = await this.stakingTool._call(input);
				const parsedData = JSON.parse(stakingData);

				// AI analysis and processing based on different query types
				if (input.includes('recommend') || input.includes('suggest')) {
					return this.generateRecommendation(input, parsedData.data);
				} else if (input.includes('calculate') || input.includes('earnings')) {
					return this.generateYieldAnalysis(input, parsedData.data);
				} else {
					return this.generatePoolsOverview(input, parsedData.data);
				}
			}

			return super.query(input);
		} catch (error) {
			console.error('DeFi agent query error:', error);
			return {
				output: 'Failed to get staking pool data',
				error: error instanceof Error ? error.message : 'Unknown error',
			};
		}
	}

	private generatePoolsOverview(input: string, pools: any[]): any {
		// Sort by APY
		const sortedPools = [...pools].sort((a, b) => b.apy - a.apy);

		// Group by platform type
		const dexPools = sortedPools.filter((p) => p.type === 'DEX');
		const cexPools = sortedPools.filter((p) => p.type === 'CEX');

		// Generate market overview text
		const overview = `Current stablecoin staking market overview:

1. Market Summary:
   • ${pools.length} high-quality staking pools available
   • Highest APY: ${sortedPools[0].apy}% (${sortedPools[0].platform})
   • Average APY: ${(sortedPools.reduce((sum, p) => sum + p.apy, 0) / pools.length).toFixed(2)}%

2. DEX Platforms:
   • ${dexPools.length} decentralized pools
   • Top Yield: ${dexPools[0].platform} offers ${dexPools[0].apy}% APY
   • Features: No KYC required, automated smart contracts

3. CEX Platforms:
   • ${cexPools.length} centralized pools
   • Top Yield: ${cexPools[0].platform} offers ${cexPools[0].apy}% APY
   • Features: User-friendly interface, fast withdrawals

4. Risk Notice:
   • DEX: Smart contract risks and gas fees
   • CEX: Requires KYC verification
   • Recommended to diversify investments across platforms


You can request "recommended staking strategies" for personalized advice or input specific amounts for earnings calculations.`;

		return {
			output: overview,
			data: sortedPools,
			type: 'staking_pools',
		};
	}

	private generateRecommendation(input: string, pools: any[]): any {
		// Analyze user preferences
		const riskAverse = input.includes('safe') || input.includes('low risk');
		const highYield = input.includes('high yield') || input.includes('high return');
		const hasAmount = input.match(/\d+/);
		const amount = hasAmount ? parseInt(hasAmount[0]) : null;

		// Sort by APY and risk
		const sortedPools = [...pools].sort((a, b) => b.apy - a.apy);
		const lowRiskPools = sortedPools.filter((p) => p.risk === '低风险');

		let recommendedPools;
		let recommendationReason;

		if (riskAverse) {
			recommendedPools = lowRiskPools.slice(0, 3);
			recommendationReason = 'Based on your focus on safety, we recommend these low-risk pools:';
		} else if (highYield) {
			recommendedPools = sortedPools.slice(0, 3);
			recommendationReason = 'For maximum returns, these pools offer the highest yields:';
		} else {
			recommendedPools = [...lowRiskPools.slice(0, 2), ...sortedPools.slice(0, 1)];
			recommendationReason = 'Balanced portfolio recommendation:';
		}

		const recommendation = `📊 Staking strategy recommendation

${recommendationReason}

${recommendedPools
	.map(
		(pool, index) => `
${index + 1}. ${pool.name}
   • Platform: ${pool.platform} (${pool.type})
   • APY: ${pool.apy}%
   • Risk Level: ${pool.risk}
   • Minimum Stake: $${pool.minStake}
   • Features: ${pool.features.join(', ')}
   • ${pool.requiresKYC ? 'Requires KYC' : 'No KYC required'}`
	)
	.join('\n')}

💡 Investment advice:
${
	amount
		? `• For your $${amount} investment, we recommend:\n` +
			`  - ${recommendedPools[0].platform}: $${Math.floor(amount * 0.4)} (40%)\n` +
			`  - ${recommendedPools[1].platform}: $${Math.floor(amount * 0.4)} (40%)\n` +
			`  - ${recommendedPools[2].platform}: $${Math.floor(amount * 0.2)} (20%)\n`
		: '• Suggest diversifying investments across 2-3 different platforms, with no single platform investment exceeding 50%'
}

⚠️ Risk Notice:
• Review platform terms before investing
• DEX: Monitor gas fees and contract risks
• CEX: Secure your account credentials
• Suggest starting with small amounts to test platform operations`;

		return {
			output: recommendation,
			data: recommendedPools,
			type: 'staking_recommendation',
		};
	}

	private generateYieldAnalysis(input: string, pools: any[]): any {
		// Extract investment amount
		const amountMatch = input.match(/\d+/);
		const amount = amountMatch ? parseInt(amountMatch[0]) : 10000; // Default amount

		// Calculate yields for different periods
		const topPool = [...pools].sort((a, b) => b.apy - a.apy)[0];
		const apy = topPool.apy / 100;

		const dailyRate = Math.pow(1 + apy, 1 / 365) - 1;
		const weeklyRate = Math.pow(1 + apy, 7 / 365) - 1;
		const monthlyRate = Math.pow(1 + apy, 30 / 365) - 1;
		const yearlyRate = apy;

		const analysis = `💰 Earnings Analysis ($${amount} Investment)

1. Projections (${topPool.platform} - ${topPool.apy}% APY):
   • Daily: $${(amount * dailyRate).toFixed(2)}
   • Weekly: $${(amount * weeklyRate).toFixed(2)}
   • Monthly: $${(amount * monthlyRate).toFixed(2)}
   • Annual: $${(amount * yearlyRate).toFixed(2)}

2. Compound Interest:
   • 3 Months: $${(amount * (Math.pow(1 + apy, 0.25) - 1)).toFixed(2)}
   • 6 Months: $${(amount * (Math.pow(1 + apy, 0.5) - 1)).toFixed(2)}
   • 1 Year: $${(amount * (Math.pow(1 + apy, 1) - 1)).toFixed(2)}

3. Platform Comparison:
${pools
	.slice(0, 3)
	.map((pool) => `   • ${pool.platform}: $${((amount * pool.apy) / 100).toFixed(2)}/year`)
	.join('\n')}

📝 Important Notes:
• APY rates may fluctuate
• Calculations assume automatic reinvestment
• Excludes platform fees and gas costs
• Monitor rates regularly and adjust strategies`;

		return {
			output: analysis,
			data: {
				investment: amount,
				yields: {
					daily: amount * dailyRate,
					weekly: amount * weeklyRate,
					monthly: amount * monthlyRate,
					yearly: amount * yearlyRate,
				},
			},
			type: 'yield_analysis',
		};
	}
}
