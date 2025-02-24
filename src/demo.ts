import { mastra } from './mastra';

async function main() {
  const agent = mastra.getAgent('cryptoAgent');

  const result = await agent.generate('BTC价格是多少');

  console.log('Agent response:', result.text);
}

main();
