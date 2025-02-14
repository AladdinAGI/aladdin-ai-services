import { ChatOpenAI } from '@langchain/openai';

export class OpenAIService {
	private model: ChatOpenAI;

	constructor(openAIApiKey: string) {
		this.model = new ChatOpenAI({
			openAIApiKey,
			modelName: 'gpt-3.5-turbo',
			temperature: 0,
		});
	}

	async query(input: string): Promise<string> {
		try {
			const result = await this.model.invoke(input);
			return Array.isArray(result.content) ? result.content.join(' ') : result.content.toString();
		} catch (error) {
			return `OpenAI query failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
		}
	}
}
