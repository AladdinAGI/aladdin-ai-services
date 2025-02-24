// src/tools/defi-staking-tool.ts
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

// 定义数据结构
const StakingOptionSchema = z.object({
  platform: z.string(),
  apy: z.number(),
  tvl: z.number().optional(),
  minAmount: z.number().optional(),
  lockPeriod: z.string().optional(),
  tags: z.array(z.string()),
  risks: z.array(z.string()),
});

const stakingData = {
  DEX: [
    {
      platform: 'Uniswap V3',
      apy: 5.2,
      tvl: 245000000,
      minAmount: 100,
      lockPeriod: 'No lock',
      tags: ['DEX', 'Automated'],
      risks: ['Smart Contract Risk', 'Impermanent Loss'],
    },
    {
      platform: 'Curve Finance',
      apy: 4.8,
      tvl: 320000000,
      minAmount: 100,
      lockPeriod: 'No lock',
      tags: ['DEX', 'Stablecoin Focused'],
      risks: ['Smart Contract Risk', 'Pool Imbalance Risk'],
    },
    {
      platform: 'Balancer',
      apy: 4.5,
      tvl: 180000000,
      minAmount: 100,
      lockPeriod: 'No lock',
      tags: ['DEX', 'Multi-token'],
      risks: ['Smart Contract Risk', 'Impermanent Loss'],
    },
  ],
  CEX: [
    {
      platform: 'Binance',
      apy: 6.0,
      minAmount: 100,
      lockPeriod: '30-90 days',
      tags: ['CEX', 'Flexible'],
      risks: ['Platform Risk', 'Custodial Risk'],
    },
    {
      platform: 'OKX',
      apy: 5.5,
      minAmount: 100,
      lockPeriod: '15-60 days',
      tags: ['CEX', 'Flexible'],
      risks: ['Platform Risk', 'Custodial Risk'],
    },
    {
      platform: 'Huobi',
      apy: 5.0,
      minAmount: 100,
      lockPeriod: '30 days',
      tags: ['CEX', 'Fixed Term'],
      risks: ['Platform Risk', 'Custodial Risk'],
    },
  ],
  'OnChain Pools': [
    {
      platform: 'Aave V3',
      apy: 3.8,
      tvl: 420000000,
      minAmount: 0,
      lockPeriod: 'No lock',
      tags: ['Lending', 'Multi-chain'],
      risks: ['Smart Contract Risk', 'Interest Rate Risk'],
    },
    {
      platform: 'Compound V3',
      apy: 3.5,
      tvl: 380000000,
      minAmount: 0,
      lockPeriod: 'No lock',
      tags: ['Lending', 'Ethereum'],
      risks: ['Smart Contract Risk', 'Interest Rate Risk'],
    },
    {
      platform: 'Yearn Finance',
      apy: 7.2,
      tvl: 150000000,
      minAmount: 0,
      lockPeriod: 'No lock',
      tags: ['Yield Aggregator', 'Auto-compounding'],
      risks: ['Smart Contract Risk', 'Strategy Risk', 'Complex Dependencies'],
    },
  ],
};

export const defiStakingTool = createTool({
  id: 'defi-staking',
  description:
    'Get stablecoin staking opportunities across different platforms',
  inputSchema: z.object({
    platform: z.enum(['DEX', 'CEX', 'OnChain Pools', 'ALL']).default('ALL'),
    minApy: z.number().optional(),
    stablecoin: z.string().default('USDC'),
  }),
  enableCache: true,
  execute: async ({ context }) => {
    try {
      let result = {};

      if (context.platform === 'ALL') {
        result = stakingData;
      } else {
        result = {
          [context.platform]: stakingData[context.platform].filter(
            (option) => !context.minApy || option.apy >= context.minApy
          ),
        };
      }

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to fetch staking options: ${error.message}`,
      };
    }
  },
});
