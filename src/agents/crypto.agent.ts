// crypto.agent.ts
import { BaseAgent } from './base.agent';
import { CryptoTools } from '../tools/coingecko/crypto.tools';

export class CryptoAgent extends BaseAgent {
	constructor(openAIApiKey: string) {
		super(openAIApiKey);
		this.tools = CryptoTools.getTools();
	}

	async initialize(): Promise<void> {
		const systemPrompt = `You are a crypto analysis assistant. Answer user questions simply and clearly.

						Quick decision guide:
						1. Query price -> Use get_token_info
						2. Query trend -> Use get_price_history
						3. Search token -> Use search_token
						4. Market trend -> Use get_market_trends

						Response requirements:
						- Price to 4 decimal places
						- Large numbers with thousands separator
						- Percentage to 2 decimal places
						- Brief and to the point, avoid unnecessary explanations

						If the tool returns an error, simply explain the reason and suggest retrying.`;

		await this.baseInitialize(systemPrompt);
	}

	async query(input: string): Promise<any> {
		const response = await super.query(input);

		// Handle iteration limit errors with specific suggestions
		if (response.error === 'MAX_ITERATIONS_REACHED') {
			let suggestion = '';
			const lowerCaseInput = input.toLowerCase();

			if (lowerCaseInput.includes('价格')) {
				suggestion = 'You can directly query the price of a specific token, e.g., "Current price of Bitcoin"';
			} else if (lowerCaseInput.includes('走势')) {
				suggestion = 'You can specify a specific time range, e.g., "7-day price trend of Bitcoin"';
			} else {
				suggestion = 'Please try a more specific query, such as specifying a specific token name or time range';
			}

			response.output += '\n\n' + suggestion;
		}

		return {
			output: response.output,
			data: response.data,
			type: 'crypto_price',
		};
	}
}
