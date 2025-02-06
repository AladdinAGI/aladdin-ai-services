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

	// 实现抽象方法 initialize
	async initialize(): Promise<void> {
		if (this.initialized) return;

		const systemPrompt = Defiprompt;

		// 添加工具
		this.tools.push(this.stakingTool);

		// 调用父类的初始化方法
		await super.baseInitialize(systemPrompt);

		this.initialized = true;
	}

	async query(input: string): Promise<any> {
		try {
			const isStakingQuery =
				/质押|收益率|apy|投资|利率|池子|理财|usdt|usdc|稳定币|defi|收益|savings|yield|staking|deposit/.test(
					input.toLowerCase(),
				);

			if (isStakingQuery) {
				// 获取最新质押池数据
				const stakingData = await this.stakingTool._call(input);
				const parsedData = JSON.parse(stakingData);

				// 根据不同类型的查询进行 AI 分析和处理
				if (input.includes('推荐') || input.includes('建议')) {
					return this.generateRecommendation(input, parsedData.data);
				} else if (input.includes('计算') || input.includes('收益')) {
					return this.generateYieldAnalysis(input, parsedData.data);
				} else {
					return this.generatePoolsOverview(input, parsedData.data);
				}
			}

			return super.query(input);
		} catch (error) {
			console.error('DeFi agent query error:', error);
			return {
				output: '获取质押池数据失败',
				error: error instanceof Error ? error.message : '未知错误',
			};
		}
	}

	private generatePoolsOverview(input: string, pools: any[]): any {
		// 根据APY排序
		const sortedPools = [...pools].sort((a, b) => b.apy - a.apy);

		// 按平台类型分组
		const dexPools = sortedPools.filter((p) => p.type === 'DEX');
		const cexPools = sortedPools.filter((p) => p.type === 'CEX');

		// 生成市场概览文本
		const overview = `当前稳定币质押市场概况：

1. 市场总览：
   • 当前共有 ${pools.length} 个优质稳定币质押池可供选择
   • 最高年化收益率达到 ${sortedPools[0].apy}%（${sortedPools[0].platform}）
   • 平均年化收益率为 ${(sortedPools.reduce((sum, p) => sum + p.apy, 0) / pools.length).toFixed(2)}%

2. DEX 平台：
   • ${dexPools.length} 个去中心化质押池
   • 最高收益：${dexPools[0].platform} 提供 ${dexPools[0].apy}% APY
   • 特点：无需KYC，智能合约自动化运行

3. CEX 平台：
   • ${cexPools.length} 个中心化质押池
   • 最高收益：${cexPools[0].platform} 提供 ${cexPools[0].apy}% APY
   • 特点：操作便捷，提现迅速

4. 风险提示：
   • DEX平台需注意智能合约风险和Gas费用
   • CEX平台需要完成KYC，注意平台安全性
   • 建议分散投资，不要将资金集中在单一平台

您可以输入"推荐质押方案"获取个性化建议，或输入具体金额了解预期收益。`;

		return {
			output: overview,
			data: sortedPools,
			type: 'staking_pools',
		};
	}

	private generateRecommendation(input: string, pools: any[]): any {
		// 分析用户偏好
		const riskAverse = input.includes('安全') || input.includes('低风险');
		const highYield = input.includes('高收益') || input.includes('高回报');
		const hasAmount = input.match(/\d+/);
		const amount = hasAmount ? parseInt(hasAmount[0]) : null;

		// 根据APY和风险排序
		const sortedPools = [...pools].sort((a, b) => b.apy - a.apy);
		const lowRiskPools = sortedPools.filter((p) => p.risk === '低风险');

		let recommendedPools;
		let recommendationReason;

		if (riskAverse) {
			recommendedPools = lowRiskPools.slice(0, 3);
			recommendationReason = '基于您对安全性的重视，我们优先推荐以下低风险质押池：';
		} else if (highYield) {
			recommendedPools = sortedPools.slice(0, 3);
			recommendationReason = '基于您对收益的追求，以下是当前收益率最高的质押池：';
		} else {
			recommendedPools = [...lowRiskPools.slice(0, 2), ...sortedPools.slice(0, 1)];
			recommendationReason = '为了平衡收益和风险，我们推荐以下质押组合：';
		}

		const recommendation = `📊 质押方案推荐

${recommendationReason}

${recommendedPools
	.map(
		(pool, index) => `
${index + 1}. ${pool.name}
   • 平台：${pool.platform} (${pool.type})
   • 收益率：${pool.apy}% APY
   • 风险等级：${pool.risk}
   • 最小质押：$${pool.minStake}
   • 特色：${pool.features.join(', ')}
   • ${pool.requiresKYC ? '需要KYC认证' : '无需KYC'}`,
	)
	.join('\n')}

💡 投资建议：
${
	amount
		? `• 对于您的 $${amount} 投资额，建议：\n` +
			`  - ${recommendedPools[0].platform}: $${Math.floor(amount * 0.4)} (40%)\n` +
			`  - ${recommendedPools[1].platform}: $${Math.floor(amount * 0.4)} (40%)\n` +
			`  - ${recommendedPools[2].platform}: $${Math.floor(amount * 0.2)} (20%)\n`
		: '• 建议将资金分散投资到2-3个不同平台，单个平台投资比例不超过50%'
}

⚠️ 风险提示：
• 投资前请仔细阅读各平台的服务条款
• DEX平台需注意Gas费用和智能合约风险
• CEX平台需要完成KYC，注意账户安全
• 建议先小额尝试，熟悉平台操作流程

需要了解具体操作步骤或收益计算，请告诉我。`;

		return {
			output: recommendation,
			data: recommendedPools,
			type: 'staking_recommendation',
		};
	}

	private generateYieldAnalysis(input: string, pools: any[]): any {
		// 提取投资金额
		const amountMatch = input.match(/\d+/);
		const amount = amountMatch ? parseInt(amountMatch[0]) : 10000; // 默认金额

		// 计算不同周期的收益
		const topPool = [...pools].sort((a, b) => b.apy - a.apy)[0];
		const apy = topPool.apy / 100;

		const dailyRate = Math.pow(1 + apy, 1 / 365) - 1;
		const weeklyRate = Math.pow(1 + apy, 7 / 365) - 1;
		const monthlyRate = Math.pow(1 + apy, 30 / 365) - 1;
		const yearlyRate = apy;

		const analysis = `💰 收益分析 (基于 $${amount} 投资额)

1. 收益预测（${topPool.platform} - ${topPool.apy}% APY）：
   • 日收益：$${(amount * dailyRate).toFixed(2)}
   • 周收益：$${(amount * weeklyRate).toFixed(2)}
   • 月收益：$${(amount * monthlyRate).toFixed(2)}
   • 年收益：$${(amount * yearlyRate).toFixed(2)}

2. 复利效应：
   • 3个月：$${(amount * (Math.pow(1 + apy, 0.25) - 1)).toFixed(2)}
   • 6个月：$${(amount * (Math.pow(1 + apy, 0.5) - 1)).toFixed(2)}
   • 1年：$${(amount * (Math.pow(1 + apy, 1) - 1)).toFixed(2)}

3. 平台对比：
${pools
	.slice(0, 3)
	.map((pool) => `   • ${pool.platform}: $${((amount * pool.apy) / 100).toFixed(2)}/年`)
	.join('\n')}

📝 注意事项：
• 以上收益基于当前APY，实际收益可能因市场变化而波动
• 复利计算假设收益自动复投
• 未考虑平台手续费和Gas费用
• 建议定期查看收益率变化，适时调整投资策略

需要了解具体质押操作或其他平台的收益计算，请告诉我。`;

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
