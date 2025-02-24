// src/tools/crypto-tools.ts
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';
const DEFILLAMA_API_BASE = 'https://api.llama.fi';

const API_OPTIONS = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    // 'x-cg-demo-api-key': process.env.COINGECKO_API_KEY!,
  },
};

// Token Info Tool
export const getTokenInfoTool = createTool({
  id: 'get-token-info',
  description:
    'Get detailed token information including price, market cap, and volume',
  inputSchema: z.object({
    tokenId: z.string().optional(),
    contractAddress: z.string().optional(),
  }),
  enableCache: true,
  execute: async ({ context }) => {
    try {
      const tokenId = context.tokenId || context.contractAddress;
      if (!tokenId) throw new Error('Token ID or contract address is required');

      const endpoint = tokenId.startsWith('0x')
        ? `${COINGECKO_API_BASE}/coins/ethereum/contract/${tokenId}`
        : `${COINGECKO_API_BASE}/coins/${tokenId}`;

      const response = await fetch(endpoint, API_OPTIONS);
      if (!response.ok) throw new Error('Failed to fetch token info');

      const data = await response.json();
      return {
        name: data.name,
        symbol: data.symbol,
        current_price: data.market_data?.current_price.usd,
        market_cap: data.market_data?.market_cap.usd,
        total_volume: data.market_data?.total_volume.usd,
        price_change_24h: data.market_data?.price_change_percentage_24h,
        description: data.description?.en?.slice(0, 200),
      };
    } catch (error: any) {
      throw new Error(`Token info error: ${error.message}`);
    }
  },
});

// Price History Tool
export const getPriceHistoryTool = createTool({
  id: 'get-price-history',
  description: 'Get historical price data for a token',
  inputSchema: z.object({
    tokenId: z.string(),
    days: z.string().default('7'),
  }),
  enableCache: true,
  execute: async ({ context }) => {
    try {
      const query = new URLSearchParams({
        vs_currency: 'usd',
        days: context.days,
        interval: 'daily',
      });

      const response = await fetch(
        `${COINGECKO_API_BASE}/coins/${context.tokenId}/market_chart?${query}`,
        API_OPTIONS
      );
      if (!response.ok) throw new Error('Failed to fetch price history');

      const data = await response.json();
      return {
        prices: data.prices.map(([timestamp, price]: number[]) => ({
          timestamp,
          price,
        })),
      };
    } catch (error: any) {
      throw new Error(`Price history error: ${error.message}`);
    }
  },
});

// Search Tool
export const searchTokenTool = createTool({
  id: 'search-token',
  description: 'Search for tokens by name or symbol',
  inputSchema: z.object({
    query: z.string(),
  }),
  enableCache: true,
  execute: async ({ context }) => {
    try {
      const queryParams = new URLSearchParams({ query: context.query });
      const response = await fetch(
        `${COINGECKO_API_BASE}/search?${queryParams}`,
        API_OPTIONS
      );
      if (!response.ok) throw new Error('Search failed');

      const data = await response.json();
      return data.coins.slice(0, 5).map((coin: any) => ({
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol,
        market_cap_rank: coin.market_cap_rank ?? 0,
      }));
    } catch (error: any) {
      throw new Error(`Search error: ${error.message}`);
    }
  },
});

// Market Trends Tool
export const getMarketTrendsTool = createTool({
  id: 'get-market-trends',
  description: 'Get trending tokens and market movements',
  inputSchema: z.object({}),
  enableCache: true,
  execute: async () => {
    try {
      const trendingResponse = await fetch(
        `${COINGECKO_API_BASE}/search/trending`,
        API_OPTIONS
      );
      if (!trendingResponse.ok) throw new Error('Failed to fetch trends');

      const trendingData = await trendingResponse.json();
      const coinIds = trendingData.coins
        .map((coin: any) => coin.item.id)
        .join(',');

      const pricesResponse = await fetch(
        `${COINGECKO_API_BASE}/simple/price?ids=${coinIds}&vs_currencies=usd`,
        API_OPTIONS
      );
      if (!pricesResponse.ok) throw new Error('Failed to fetch prices');

      const priceData = await pricesResponse.json();
      return trendingData.coins.map((coin: any) => ({
        name: coin.item.name,
        symbol: coin.item.symbol,
        market_cap_rank: coin.item.market_cap_rank,
        price_usd: priceData[coin.item.id]?.usd ?? 0,
        score: coin.item.score,
      }));
    } catch (error: any) {
      throw new Error(`Market trends error: ${error.message}`);
    }
  },
});
