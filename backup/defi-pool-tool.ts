// src/tools/defi-pool-tool.ts
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { Edwin, EdwinConfig } from 'edwin-sdk';
import { Wallet } from 'ethers';

// Types
interface PoolInfo {
  protocol: string;
  chain: string;
  asset: string;
  apy: number;
  available: boolean;
  supplyAction: {
    protocol: string;
    chain: string;
    amount: string;
    asset: string;
  };
}

// Initialize a random wallet for read-only operations
const wallet = Wallet.createRandom();

// Configure Edwin
const edwinConfig: EdwinConfig = {
  evmPrivateKey: wallet.privateKey,
  actions: ['supply', 'withdraw', 'stake'],
};

// Initialize Edwin SDK
const edwin = new Edwin(edwinConfig);

// Supported protocols and chains
const SUPPORTED_PROTOCOLS = ['aave', 'compound'] as const;
const SUPPORTED_CHAINS = ['ethereum', 'base', 'arbitrum', 'optimism'] as const;

export const defiPoolTool = createTool({
  id: 'get-defi-pools',
  description: 'Get DeFi stablecoin pool recommendations using Edwin Finance',
  inputSchema: z.object({
    chain: z.string().optional().describe('Target blockchain'),
    protocol: z.string().optional().describe('Target protocol'),
    asset: z.string().optional().describe('Target asset'),
    minAmount: z.string().optional().describe('Minimum amount'),
  }),
  outputSchema: z.object({
    recommendedPools: z.array(
      z.object({
        protocol: z.string(),
        chain: z.string(),
        asset: z.string(),
        apy: z.number(),
        available: z.boolean(),
        supplyAction: z.object({
          protocol: z.string(),
          chain: z.string(),
          amount: z.string(),
          asset: z.string(),
        }),
      })
    ),
    timestamp: z.string(),
  }),
  execute: async ({ context }) => {
    try {
      const recommendedPools: PoolInfo[] = [];

      // Filter protocols and chains based on input
      const protocols = context.protocol
        ? SUPPORTED_PROTOCOLS.filter((p) => p === context.protocol)
        : SUPPORTED_PROTOCOLS;

      const chains = context.chain
        ? SUPPORTED_CHAINS.filter((c) => c === context.chain)
        : SUPPORTED_CHAINS;

      // Get pools for each protocol and chain combination
      for (const protocol of protocols) {
        for (const chain of chains) {
          try {
            const asset = context.asset || 'usdc';
            const amount = context.minAmount || '100';

            // Create supply action parameters
            const supplyAction = {
              protocol,
              chain,
              amount,
              asset,
            };

            try {
              // Try to get the supply quote to check availability
              const quote = await edwin.actions.supply.quote(supplyAction);

              // If we get here, the pool is available
              recommendedPools.push({
                protocol,
                chain,
                asset,
                apy: 0, // APY needs to be obtained from another source
                available: true,
                supplyAction,
              });
            } catch (error) {
              // If quote fails, pool is not available
              console.log(
                `Pool not available: ${protocol} on ${chain} for ${asset}`
              );
              continue;
            }
          } catch (error) {
            console.error(`Error checking ${protocol} on ${chain}:`, error);
            continue;
          }
        }
      }

      return {
        recommendedPools,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(`Failed to fetch pool data: ${error.message}`);
    }
  },
});

// Helper function to execute supply action
export const supply = async (params: {
  protocol: string;
  chain: string;
  amount: string;
  asset: string;
}) => {
  try {
    // Get quote first
    const quote = await edwin.actions.supply.quote(params);
    console.log('Supply quote:', quote);

    // Execute the supply action
    return await edwin.actions.supply.execute(params);
  } catch (error) {
    throw new Error(`Supply action failed: ${error.message}`);
  }
};
