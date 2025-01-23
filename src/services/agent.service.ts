import { CryptoAgent } from '../agents/crypto.agent';
import { DeFiAgent } from '../agents/defi.agent';
import { OpenAIService } from './openai.service';
import { AgentResponse } from '../types';
import { ChatOpenAI } from '@langchain/openai';
import { routerPrompt } from '../prompts/templates';

export class AgentService {
	private cryptoAgent: CryptoAgent;
	private defiAgent: DeFiAgent;
	private openaiService: OpenAIService;
	private routerModel: ChatOpenAI;

	constructor(openAIApiKey: string) {
		this.cryptoAgent = new CryptoAgent(openAIApiKey);
		this.defiAgent = new DeFiAgent(openAIApiKey);
		this.openaiService = new OpenAIService(openAIApiKey);

		this.routerModel = new ChatOpenAI({
			openAIApiKey,
			temperature: 0,
			modelName: 'gpt-3.5-turbo',
		});
	}

	async initialize() {
		await Promise.all([this.cryptoAgent.initialize(), this.defiAgent.initialize()]);
	}

	async query(input: string): Promise<AgentResponse> {
		try {
			const routerResponse = await this.routerModel.invoke(
				await routerPrompt.format({
					input: input,
				}),
			);

			const route = String(routerResponse.content).trim();

			switch (route) {
				case 'CRYPTO':
					const cryptoResponse = await this.cryptoAgent.query(input);
					return {
						output: cryptoResponse.output,
						type: 'crypto_price',
					};
				case 'DEFI':
					const defiResponse = await this.defiAgent.query(input);
					return {
						output: defiResponse.output,
						type: 'staking_pools',
					};
				case 'IDENTITY':
					return {
						output: '我是Aladdin AI机器人🤖',
					};
				default:
					// const response = await this.openaiService.query(input);
					return { output: '我是专注给您进稳定币投资的机器人，不能回答您其他问题' };
			}
		} catch (error) {
			return {
				output: '处理请求时发生错误',
				error: error instanceof Error ? error.message : '未知错误',
			};
		}
	}
}
