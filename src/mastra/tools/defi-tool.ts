// src/tools/defi-tool.ts
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

// Define data structures
const StakingOptionSchema = z.object({
  platform: z.string(),
  apy: z.number(),
  tvl: z.number().optional(),
  minAmount: z.number().optional(),
  lockPeriod: z.string().optional(),
  tags: z.array(z.string()),
  risks: z.array(z.string()),
});

export type StakingOption = z.infer<typeof StakingOptionSchema>;

// Staking command response interface
export interface StakingCommandResponse {
  type: string; // "standard" or "professional" or "error"
  amount: number; // User's staking amount
  targetAPY: number; // User's requested APY
  riskTolerance: number; // User's acceptable risk percentage
  options?: StakingOption[]; // Only for standard staking (APY ≤ 10%)
  message: string; // Response message to display
  formattedAllocation?: string; // Markdown table for natural language queries
}

// Allocation interface for portfolio calculation
export interface AllocationItem {
  platformType: string;
  platform: string;
  percentage: number;
  amount: number;
  apy: number;
  expectedReturn: number;
  risks: string[];
  tags: string[];
}

const stakingData: Record<string, StakingOption[]> = {
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

// Define the tool's output type
export interface DefiStakingToolResult {
  success: boolean;
  data?: Record<string, StakingOption[]>;
  summary?: {
    highestApy: number;
    lowestApy: number;
    totalOptions: number;
    stablecoin: string;
  };
  formatted?: string;
  error?: string;
}

export const defiStakingTool = createTool({
  id: 'defi-staking',
  description:
    'Get stablecoin staking opportunities across different platforms. Use this tool for any questions about stablecoin staking, yield, or APY.',
  inputSchema: z.object({
    platform: z.enum(['DEX', 'CEX', 'OnChain Pools', 'ALL']).default('ALL'),
    minApy: z.number().optional().default(0),
    stablecoin: z.string().default('USDC'),
  }),
  enableCache: true,
  execute: async ({ context }) => {
    try {
      let result: Record<string, StakingOption[]> = {};
      const minApyValue = context.minApy || 0;

      if (context.platform === 'ALL') {
        // Filter all data by minApy
        result = {
          DEX: stakingData.DEX.filter((option) => option.apy >= minApyValue),
          CEX: stakingData.CEX.filter((option) => option.apy >= minApyValue),
          'OnChain Pools': stakingData['OnChain Pools'].filter(
            (option) => option.apy >= minApyValue
          ),
        };
      } else {
        result = {
          [context.platform]: stakingData[context.platform].filter(
            (option) => option.apy >= minApyValue
          ),
        };
      }

      // Add formatted summary for easier consumption by the agent
      const allOptions = Object.values(result).flat() as StakingOption[];

      // Check if we have any options
      if (allOptions.length === 0) {
        return {
          success: false,
          error: `No staking options found with minimum APY of ${minApyValue}%`,
        };
      }

      const summary = {
        highestApy: Math.max(...allOptions.map((opt) => opt.apy)),
        lowestApy: Math.min(...allOptions.map((opt) => opt.apy)),
        totalOptions: allOptions.length,
        stablecoin: context.stablecoin,
      };

      return {
        success: true,
        data: result,
        summary: summary,
        formatted: `Found ${summary.totalOptions} staking options for ${context.stablecoin} with APY ranging from ${summary.lowestApy}% to ${summary.highestApy}%`,
      } as DefiStakingToolResult;
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to fetch staking options: ${error.message}`,
      } as DefiStakingToolResult;
    }
  },
});

// Function to get staking options manually
export async function getStakingOptions(
  minApy: number = 0,
  platform: 'DEX' | 'CEX' | 'OnChain Pools' | 'ALL' = 'ALL',
  stablecoin: string = 'USDC'
): Promise<StakingOption[]> {
  let filteredOptions: StakingOption[] = [];

  if (platform === 'ALL') {
    filteredOptions = [
      ...stakingData.DEX.filter((option) => option.apy >= minApy),
      ...stakingData.CEX.filter((option) => option.apy >= minApy),
      ...stakingData['OnChain Pools'].filter((option) => option.apy >= minApy),
    ];
  } else {
    filteredOptions = stakingData[platform].filter(
      (option) => option.apy >= minApy
    );
  }

  return filteredOptions;
}

// Get all staking options by platform type
export function getAllStakingOptions(): Record<string, StakingOption[]> {
  return {
    DEX: stakingData.DEX,
    CEX: stakingData.CEX,
    'OnChain Pools': stakingData['OnChain Pools'],
  };
}

// Command Parser for staking instructions
export function parseStakingCommand(
  command: string
): StakingCommandResponse | null {
  // Regex to match the staking command pattern
  // Example: /stake amount10000 APY15 riskTolerance10
  const regex =
    /\/stake\s+amount(\d+)\s+APY(\d+(?:\.\d+)?)\s+riskTolerance(\d+(?:\.\d+)?)/;
  const match = command.match(regex);

  if (!match) {
    return null; // Command format doesn't match
  }

  // Extract values from the command
  const amount = parseFloat(match[1]);
  const targetAPY = parseFloat(match[2]);
  const riskTolerance = parseFloat(match[3]);

  // Validate values
  if (isNaN(amount) || isNaN(targetAPY) || isNaN(riskTolerance)) {
    return null;
  }

  // Determine if this should be processed as professional staking
  const isProfessional = targetAPY > 10;

  if (isProfessional) {
    return {
      type: 'professional',
      amount: amount,
      targetAPY: targetAPY,
      riskTolerance: riskTolerance,
      message:
        'We can manage your funds in our professional version, operating across primary markets, contracts, and secondary spot markets. Please be aware of the risks involved.',
    };
  } else {
    // For standard staking, we would fetch options here
    return {
      type: 'standard',
      amount: amount,
      targetAPY: targetAPY,
      riskTolerance: riskTolerance,
      options: [], // These would be populated later
      message: 'Here are staking options that match your requirements:',
    };
  }
}

// Calculate optimal allocation for a given amount, target APY, and risk tolerance
export function calculateOptimalAllocation(
  amount: number,
  targetAPY: number,
  riskTolerance: number
): {
  allocation: AllocationItem[];
  weightedAPY: number;
  totalReturn: number;
  formattedTable: string;
} {
  const options = getAllStakingOptions();
  const allOptions: Array<StakingOption & { platformType: string }> = [];

  // Convert options to flat array with platform type
  Object.entries(options).forEach(([type, typeOptions]) => {
    typeOptions.forEach((option) => {
      allOptions.push({
        ...option,
        platformType: type,
      });
    });
  });

  // Sort by APY (highest first) within each platform type
  const dexOptions = options.DEX.sort((a, b) => b.apy - a.apy);
  const cexOptions = options.CEX.sort((a, b) => b.apy - a.apy);
  const onChainOptions = options['OnChain Pools'].sort((a, b) => b.apy - a.apy);

  // Initial allocation percentages based on platform type and APY
  // Priorities: highest APY options but with preference for diversification
  const allocation: AllocationItem[] = [];
  let remainingPercentage = 100;

  // Helper function to add allocation
  const addAllocation = (
    platformType: string,
    option: StakingOption,
    percentage: number
  ) => {
    if (percentage <= 0) return;

    const allocatedAmount = (amount * percentage) / 100;
    const expectedReturn = (allocatedAmount * option.apy) / 100;

    allocation.push({
      platformType,
      platform: option.platform,
      percentage,
      amount: allocatedAmount,
      apy: option.apy,
      expectedReturn,
      risks: option.risks,
      tags: option.tags,
    });

    remainingPercentage -= percentage;
  };

  // Allocate to OnChain (highest APY typically)
  if (onChainOptions.length > 0 && onChainOptions[0].apy >= 7) {
    // Highest APY OnChain option gets significant allocation
    addAllocation('OnChain Pools', onChainOptions[0], 40);

    // Second highest if available
    if (onChainOptions.length > 1) {
      addAllocation('OnChain Pools', onChainOptions[1], 10);
    }
  } else if (onChainOptions.length > 0) {
    // Lower allocation if APY is not as attractive
    addAllocation('OnChain Pools', onChainOptions[0], 30);
  }

  // Allocate to CEX options
  if (cexOptions.length > 0) {
    addAllocation('CEX', cexOptions[0], 25);

    if (cexOptions.length > 1) {
      addAllocation('CEX', cexOptions[1], 15);
    }
  }

  // Allocate to DEX options
  if (dexOptions.length > 0) {
    // Use a fixed percentage for the first DEX option
    const firstDexPercentage = Math.min(remainingPercentage, 15);
    addAllocation('DEX', dexOptions[0], firstDexPercentage);

    // Allocate remaining percentage to second DEX option if available
    if (dexOptions.length > 1 && remainingPercentage > 0) {
      addAllocation('DEX', dexOptions[1], remainingPercentage);
    }
  }

  // Calculate weighted APY and total return
  const weightedAPY = allocation.reduce(
    (sum, item) => sum + (item.apy * item.percentage) / 100,
    0
  );

  const totalReturn = allocation.reduce(
    (sum, item) => sum + item.expectedReturn,
    0
  );

  // Create formatted markdown table
  const formattedTable = formatAllocationTable(
    allocation,
    amount,
    targetAPY,
    riskTolerance,
    weightedAPY,
    totalReturn
  );

  return {
    allocation,
    weightedAPY,
    totalReturn,
    formattedTable,
  };
}

// Format allocation as simple text format
function formatAllocationTable(
  allocation: AllocationItem[],
  amount: number,
  targetAPY: number,
  riskTolerance: number,
  weightedAPY: number,
  totalReturn: number
): string {
  // Group by platform type
  const groupedByType: Record<string, AllocationItem[]> = {};

  allocation.forEach((item) => {
    if (!groupedByType[item.platformType]) {
      groupedByType[item.platformType] = [];
    }
    groupedByType[item.platformType].push(item);
  });

  let text = `${amount.toLocaleString()} USDT Staking Allocation\n\n`;
  text += `Target APY: ${targetAPY.toFixed(2)}% | Risk Tolerance: ${riskTolerance}% | Expected APY: ${weightedAPY.toFixed(2)}%\n\n`;
  text += `Allocation by Platform Type:\n\n`;

  // Add platform type sections
  for (const [type, items] of Object.entries(groupedByType)) {
    text += `${type}:\n`;

    for (const item of items) {
      text += `- ${item.platform}: ${item.percentage.toFixed(0)}% allocation (${item.amount.toLocaleString()} USDT), ${item.apy.toFixed(2)}% APY, Expected Return: ${item.expectedReturn.toLocaleString()} USDT\n`;
    }

    text += '\n';
  }

  // Add total information
  text += `TOTAL: 100% allocation (${amount.toLocaleString()} USDT), ${weightedAPY.toFixed(2)}% weighted APY, Total Return: ${totalReturn.toLocaleString()} USDT\n\n`;

  // Add risk disclaimer
  text += `Risk Disclaimer:\n`;
  text += `- Higher APY typically comes with higher risk\n`;
  text += `- Past performance is not indicative of future results\n`;
  text += `- Always conduct your own research before investing\n`;

  return text;
}

// Integration function for handling natural language staking requests
export async function handleNaturalLanguageStaking(
  amount: number,
  targetAPY: number,
  riskTolerance: number
): Promise<StakingCommandResponse> {
  // For high APY requests (> 10%), return professional message
  if (targetAPY > 10) {
    return {
      type: 'professional',
      amount: amount,
      targetAPY: targetAPY,
      riskTolerance: riskTolerance,
      message: `Your requested APY of ${targetAPY}% for stablecoins is extremely high and exceeds standard platform offerings. We can manage your funds in our professional version, operating across primary markets, contracts, and secondary spot markets. Please be aware of the risks involved.`,
    };
  }

  // For standard requests, always provide the best available allocation
  // Even if we can't reach the exact target APY
  const { allocation, weightedAPY, totalReturn, formattedTable } =
    calculateOptimalAllocation(amount, targetAPY, riskTolerance);

  // Get all available options (used by the agent)
  // We use a much lower threshold (40% of target) to ensure we get some options
  const options = await getStakingOptions(0);

  // Sort options by APY (highest first)
  const sortedOptions = [...options].sort((a, b) => b.apy - a.apy);

  // If we have no allocation at all (extremely rare case)
  if (allocation.length === 0 && sortedOptions.length === 0) {
    return {
      type: 'standard',
      amount: amount,
      targetAPY: targetAPY,
      riskTolerance: riskTolerance,
      message: `I'm sorry, but currently, there are no staking options available in our system. The market conditions for staking opportunities can change rapidly, so it's worth checking back regularly.`,
    };
  }

  // Even if our allocation calculation failed, use the highest APY options
  const effectiveAllocation = allocation.length > 0 ? allocation : [];
  const effectiveWeightedAPY =
    allocation.length > 0
      ? weightedAPY
      : sortedOptions.length > 0
        ? sortedOptions[0].apy
        : 0;

  let message = `Here are the best staking options for your ${amount.toLocaleString()} USDT investment.`;

  // Add note if we can't reach target APY
  if (effectiveWeightedAPY < targetAPY) {
    message += ` While the maximum achievable APY of ${effectiveWeightedAPY.toFixed(2)}% is below your target of ${targetAPY}%, these represent the best current market opportunities.`;
  } else {
    message += ` These options can help you achieve your target APY of ${targetAPY}%.`;
  }

  // Return standard response WITHOUT the markdown table for APY <= 10%
  return {
    type: 'standard',
    amount: amount,
    targetAPY: targetAPY,
    riskTolerance: riskTolerance,
    options: sortedOptions,
    message: message,
  };
}

// Integration function for handling staking commands
export async function handleStakingCommand(command: string) {
  const parsedCommand = parseStakingCommand(command);

  if (!parsedCommand) {
    return {
      success: false,
      message:
        'Incorrect command format. Please use: /stake amount[value] APY[percentage] riskTolerance[percentage]',
    };
  }

  // If this is standard staking, fetch options
  if (parsedCommand.type === 'standard') {
    try {
      const options = await getStakingOptions(parsedCommand.targetAPY * 0.9);
      parsedCommand.options = options;
    } catch (error) {
      console.error('Error fetching staking options:', error);
    }
  }

  return {
    success: true,
    data: parsedCommand,
  };
}
