// agent.service.ts
import { CryptoAgent } from '../agents/crypto.agent';
import { DeFiAgent } from '../agents/defi.agent';
import { ChatOpenAI } from '@langchain/openai';
import { cryptoCheckPrompt, routerPrompt } from '../prompts/templates';
import { OpenAIService } from './openai.service';

type RouteType = 'CRYPTO' | 'DEFI' | 'SECURITY' | 'IDENTITY' | 'DEFAULT';

export interface AgentResponse {
	output: string;
	data?: any;
	error?: string;
	type: string;
}

interface AgentServiceConfig {
	openAIApiKey: string;
	rpcUrl: string;
	etherscanApiKey: string;
}

export class AgentService {
	private cryptoAgent: CryptoAgent;
	private defiAgent: DeFiAgent;
	private llmModel: ChatOpenAI;
	private openAIService: OpenAIService;

	constructor(config: AgentServiceConfig) {
		const { openAIApiKey, rpcUrl, etherscanApiKey } = config;

		this.cryptoAgent = new CryptoAgent(openAIApiKey);
		this.defiAgent = new DeFiAgent(openAIApiKey);
		this.openAIService = new OpenAIService(openAIApiKey);

		this.llmModel = new ChatOpenAI({
			openAIApiKey,
			temperature: 0,
			modelName: 'gpt-3.5-turbo',
		});
	}

	async initialize() {
		try {
			await Promise.all([this.cryptoAgent.initialize(), this.defiAgent.initialize()]);
			console.log('Agents initialized successfully');
		} catch (error) {
			console.error('Failed to initialize agents:', error);
			throw new Error('Agent initialization failed');
		}
	}

	private async isCryptoRelated(input: string): Promise<boolean> {
		try {
			const formattedPrompt = await cryptoCheckPrompt.format({ input });
			const response = await this.llmModel.invoke(formattedPrompt);
			console.log('🐻🐻🐻🐻🐻🐻🐻🐻🐻 ', response);
			const result = typeof response.content === 'string' ? response.content.toLowerCase().trim() : '';
			return result === 'true';
		} catch (error) {
			console.error('Error checking if crypto related:', error);
			return false;
		}
	}

	async query(input: string): Promise<AgentResponse> {
		try {
			const routerResponse = await this.llmModel.invoke(await routerPrompt.format({ input }));
			const route = String(routerResponse.content).trim() as RouteType;
			console.log('🍊🍊🍊🍊🍊🍊🍊🍊🍊🍊🍊', route);
			let response: AgentResponse;

			switch (route) {
				case 'CRYPTO': {
					const cryptoResponse = await this.cryptoAgent.query(input);
					response = {
						output: cryptoResponse.output,
						data: cryptoResponse.data,
						error: cryptoResponse.error,
						type: 'crypto_price',
					};
					break;
				}
				case 'DEFI': {
					const defiResponse = await this.defiAgent.query(input);
					console.log('🍌🍌🍌', defiResponse);
					response = {
						output: defiResponse.output,
						type: 'defi_general',
						data: defiResponse.data,
					};
					break;
				}
				case 'IDENTITY':
					response = {
						output:
							'我是 AI DeFi 助手，专注于加密货币和DeFi服务。我可以帮您：\n' +
							'1. 查询代币价格和市场走势\n' +
							'2. 分析不同DeFi平台的收益率和风险\n' +
							'3. 计算预期收益和投资回报\n' +
							'4. 提供市场趋势和安全建议',
						type: 'identity',
					};
					break;
				case 'SECURITY': {
					// Handle security-related queries
					const openAIResponse = await this.openAIService.query(input);
					response = {
						output: openAIResponse,
						type: 'security',
					};
					break;
				}
				default:
					if (await this.isCryptoRelated(input)) {
						console.log('Processing crypto-related general query');
						const openAIResponse = await this.openAIService.query(input);
						response = {
							output: openAIResponse,
							type: 'crypto_general',
						};
					} else {
						response = {
							output: '抱歉，我是一个专门的加密货币助手，主要解答数字货币和DeFi相关的问题。请问我关于加密货币、DeFi、投资等方面的问题。',
							type: 'non_crypto',
						};
					}
			}

			return response;
		} catch (error) {
			console.error('Query error:', error);
			return {
				output: '处理请求时发生错误',
				error: error instanceof Error ? error.message : '未知错误',
				type: 'error',
			};
		}
	}
}
