// src/index.ts
import { Mastra } from '@mastra/core/mastra';
import { createLogger } from '@mastra/core/logger';
import { cryptoAgent } from './agents/crypto-agent';
import { defiAgent } from './agents/defi-agent';

export const mastra = new Mastra({
  agents: {
    cryptoAgent, // 加密货币市场分析
    defiAgent, // 稳定币质押理财
  },
  logger: createLogger({
    name: 'Crypto-DeFi-Mastra',
    level: 'info',
  }),
});
