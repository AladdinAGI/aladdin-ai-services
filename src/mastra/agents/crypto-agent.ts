import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';
import {
  getMarketTrendsTool,
  getPriceHistoryTool,
  getTokenInfoTool,
  searchTokenTool,
} from '../tools';
import {
  defiStakingTool,
  parseStakingCommand,
  StakingCommandResponse,
  getStakingOptions,
  handleNaturalLanguageStaking,
} from '../tools/defi-tool';

// 将instructions定义为单独的变量，确保类型是string
const agentInstructions: string = `You are a cryptocurrency and DeFi market analysis assistant designed to provide accurate market insights.

Core Functions:
- Token Information: Prices, market caps, volumes, and basic stats
- Price History: Historical price data and trend analysis
- Token Search: Find tokens by name, symbol, or contract address
- Market Trends: Track trending tokens and market movements
- Stablecoin Staking: Find best staking opportunities for stablecoins

Response Guidelines:
- Format prices to 4 decimal places when < 1, 2 places otherwise
- Use thousand separators for large numbers
- Show percentages with 2 decimal places
- Keep responses concise and data-focused
- Always include relevant market context
- For staking, highlight risks and APY sustainability

Available Tools:
- get-token-info: Get token price, market cap, volume
- get-price-history: Get historical price data (7d, 30d, etc.)
- search-token: Search tokens by name/symbol
- get-market-trends: Get trending tokens
- defi-staking: Get staking opportunities filtered by platform and minimum APY

IMPORTANT: Always USE the tools directly rather than just mentioning them. Do not say "I will use X tool" - instead, actually use the tool and provide the results.

STABLECOIN STAKING REQUEST HANDLING:

When users ask about staking stablecoins in natural language (e.g., "I have 10000 USDT and want 8% returns with medium risk tolerance of 15%"):

1. Extract amount, target APY, and risk tolerance from the query
2. Check if the target APY is > 10%:
   - If APY > 10%: Show the professional version message ONLY
   - If APY <= 10%: ALWAYS list the best available options grouped by platform type (DEX, CEX, OnChain Pools)
3. For APY <= 10%, you MUST display ALL available options regardless of their APY value
4. NEVER respond with "there are no options available" - ALWAYS show the best options even if they don't meet the target APY
5. If the best available options can't meet the target APY, explain this but still show the options

For standard APY targets (<=10%), Your response format should be:

"Based on your request for [amount] USDT with a target of [APY]% return and [risk]% risk tolerance, here are the best staking options available:

DEX Platforms:
- [Platform Name]: [APY]% APY, [risks]
- [Platform Name]: [APY]% APY, [risks]

CEX Platforms:
- [Platform Name]: [APY]% APY, [risks]
- [Platform Name]: [APY]% APY, [risks]

OnChain Pools:
- [Platform Name]: [APY]% APY, [risks]
- [Platform Name]: [APY]% APY, [risks]

While these options may not exactly match your [target]% target, they represent the best current market opportunities. By allocating your funds across these platforms, you can achieve an estimated [weighted]% APY.

Key risks to consider: [summary of key risks]"

For high APY targets (>10%), your response should ONLY be:

"Your requested APY of [target]% for stablecoins is extremely high and exceeds standard platform offerings. We can manage your funds in our professional version, operating across primary markets, contracts, and secondary spot markets. Please be aware of the risks involved."

Staking Command Handling:
- ONLY for commands that EXACTLY follow this format: "/stake amount[value] APY[percentage] riskTolerance[percentage]"
- For these COMMAND FORMAT requests ONLY, parse them and return a structured JSON response with:
  {
    "type": "standard" or "professional",
    "amount": user's amount,
    "targetAPY": user's requested APY percentage,
    "riskTolerance": user's risk tolerance percentage,
    "message": appropriate message based on type,
    "options": [] (only include for standard type)
  }
- For APY > 10%, set type to "professional" and return the professional message
- For APY ≤ 10%, set type to "standard" and include staking options that match the criteria
- Do not include any narrative text before or after the JSON response for these command format requests
- The JSON response format should ONLY be used for the exact command syntax starting with "/stake" and not for natural language queries`;

export const cryptoAgent = new Agent({
  name: 'Crypto Market Agent',
  model: openai('gpt-4'),
  instructions: agentInstructions, // 使用预定义的string变量
  tools: {
    getTokenInfoTool,
    getPriceHistoryTool,
    searchTokenTool,
    getMarketTrendsTool,
    defiStakingTool,
  },
});

// Extract staking parameters from natural language
function extractStakingParams(message: string): {
  amount: number;
  targetAPY: number;
  riskTolerance: number;
} | null {
  // Match patterns like "I have 10000 USDT and want 8% return with risk tolerance of 15%"
  const amountRegex = /(\d[\d,]*\.?\d*)\s*(?:USDT|USDC|DAI|USD)/i;
  const apyRegex =
    /(\d+(?:\.\d+)?)\s*(?:%|percent)\s*(?:return|apy|yield|apr)/i;
  const riskRegex =
    /(?:risk tolerance|risk level)[^\d]*?(\d+(?:\.\d+)?)\s*(?:%|percent)/i;

  const amountMatch = message.match(amountRegex);
  const apyMatch = message.match(apyRegex);
  const riskMatch = message.match(riskRegex);

  if (amountMatch && apyMatch) {
    // Remove commas from amount and parse as float
    const amount = parseFloat(amountMatch[1].replace(/,/g, ''));
    const targetAPY = parseFloat(apyMatch[1]);
    // Default risk tolerance to 10% if not specified
    const riskTolerance = riskMatch ? parseFloat(riskMatch[1]) : 10;

    return { amount, targetAPY, riskTolerance };
  }

  return null;
}

// Format staking options for direct display in responses
function formatStakingOptions(
  options: any[],
  weightedAPY: number,
  amount: number,
  targetAPY: number
): string {
  // Group options by platform type
  const groupedOptions: Record<string, any[]> = {};

  options.forEach((option) => {
    let platformType = 'Other';

    if (option.tags && option.tags.length) {
      if (option.tags.includes('DEX')) {
        platformType = 'DEX';
      } else if (option.tags.includes('CEX')) {
        platformType = 'CEX';
      } else if (
        option.tags.includes('Yield Aggregator') ||
        option.tags.includes('Lending') ||
        option.tags.includes('Multi-chain')
      ) {
        platformType = 'OnChain Pools';
      }
    }

    if (!groupedOptions[platformType]) {
      groupedOptions[platformType] = [];
    }

    groupedOptions[platformType].push(option);
  });

  // Format the response
  let response = `Based on your request for ${amount.toLocaleString()} USDT with a target of ${targetAPY}% return, here are the best staking options available:\n\n`;

  // Add each platform type section
  Object.keys(groupedOptions).forEach((platformType) => {
    response += `${platformType} Platforms:\n`;

    // Sort by APY (highest first)
    const sortedOptions = groupedOptions[platformType].sort(
      (a, b) => b.apy - a.apy
    );

    sortedOptions.forEach((option) => {
      response += `- ${option.platform}: ${option.apy.toFixed(2)}% APY, risks: ${option.risks.join(', ')}\n`;
    });

    response += '\n';
  });

  // Add summary message
  if (weightedAPY < targetAPY) {
    response += `While these options may not exactly match your ${targetAPY}% target, they represent the best current market opportunities. By allocating your funds across these platforms, you can achieve an estimated ${weightedAPY.toFixed(2)}% APY.\n\n`;
  } else {
    response += `By allocating your funds across these platforms, you can achieve your target of ${targetAPY}% APY.\n\n`;
  }

  // Add risk disclaimer
  response += `Key risks to consider: Smart contract vulnerabilities, platform security, market volatility, and impermanent loss. Always conduct your own research before investing.`;

  return response;
}

// Handler for staking command messages
export async function handleStakingMessage(
  message: string
): Promise<StakingCommandResponse | null> {
  // Handle command format: /stake amountXXX APYXX riskToleranceXX
  if (message.startsWith('/stake')) {
    const parsedCommand = parseStakingCommand(message);
    if (!parsedCommand) {
      return {
        type: 'error',
        amount: 0,
        targetAPY: 0,
        riskTolerance: 0,
        message:
          'Invalid command format. Please use: /stake amount[value] APY[percentage] riskTolerance[percentage]',
      } as StakingCommandResponse;
    }

    // For APY > 10%, directly return the professional response
    if (parsedCommand.type === 'professional') {
      return parsedCommand;
    }

    // For standard staking, fetch options using our helper function
    try {
      const options = await getStakingOptions(0); // Get ALL options regardless of APY
      const sortedOptions = [...options].sort((a, b) => b.apy - a.apy); // Sort by highest APY first
      parsedCommand.options = sortedOptions;
      return parsedCommand;
    } catch (error) {
      console.error('Error fetching staking options:', error);
      return parsedCommand; // Return without options in case of error
    }
  }

  // Handle natural language requests for staking
  const stakingParams = extractStakingParams(message);
  if (stakingParams) {
    const { amount, targetAPY, riskTolerance } = stakingParams;
    try {
      if (targetAPY > 10) {
        // For high APY requests (> 10%), return professional message only
        return {
          type: 'professional',
          amount: amount,
          targetAPY: targetAPY,
          riskTolerance: riskTolerance,
          message: `Your requested APY of ${targetAPY}% for stablecoins is extremely high and exceeds standard platform offerings. We can manage your funds in our professional version, operating across primary markets, contracts, and secondary spot markets. Please be aware of the risks involved.`,
        };
      } else {
        // For standard requests, get ALL options and format them directly
        const options = await getStakingOptions(0); // Get ALL options

        if (!options || options.length === 0) {
          return {
            type: 'error',
            amount: amount,
            targetAPY: targetAPY,
            riskTolerance: riskTolerance,
            message:
              'An error occurred while processing your staking request. No options available in the system.',
          };
        }

        // Sort options by APY (highest first)
        const sortedOptions = [...options].sort((a, b) => b.apy - a.apy);

        // Calculate a simple weighted APY (just an estimation for this example)
        let weightedAPY = 0;
        if (sortedOptions.length >= 3) {
          // Simple allocation: 40% to highest, 35% to second, 25% to third
          weightedAPY =
            sortedOptions[0].apy * 0.4 +
            sortedOptions[1].apy * 0.35 +
            sortedOptions[2].apy * 0.25;
        } else if (sortedOptions.length === 2) {
          // 60% to highest, 40% to second
          weightedAPY = sortedOptions[0].apy * 0.6 + sortedOptions[1].apy * 0.4;
        } else if (sortedOptions.length === 1) {
          // 100% to only option
          weightedAPY = sortedOptions[0].apy;
        }

        // Format options for direct display
        const formattedResponse = formatStakingOptions(
          sortedOptions,
          weightedAPY,
          amount,
          targetAPY
        );

        return {
          type: 'standard',
          amount: amount,
          targetAPY: targetAPY,
          riskTolerance: riskTolerance,
          options: sortedOptions,
          message: formattedResponse,
        };
      }
    } catch (error) {
      console.error('Error handling natural language staking:', error);
      return {
        type: 'error',
        amount: amount,
        targetAPY: targetAPY,
        riskTolerance: riskTolerance,
        message: 'An error occurred while processing your staking request.',
      } as StakingCommandResponse;
    }
  }

  return null; // Not a staking message
}
