// agent.service.ts
import { CryptoAgent } from '../agents/crypto.agent';
import { DeFiAgent } from '../agents/defi.agent';
import { ChatOpenAI } from '@langchain/openai';
import { routerPrompt } from '../prompts/templates';
import { OpenAIService } from './openai.service';
import { PromptTemplate } from '@langchain/core/prompts';

type RouteType = 'CRYPTO' | 'DEFI' | 'SECURITY' | 'IDENTITY' | 'DEFAULT';

const ROUTE_KEYWORDS: Record<RouteType, string[]> = {
	CRYPTO: ['价格', '币价', '行情', '走势', '涨跌', '价值', '多少钱', '币', '代币', 'token', 'coin'],
	DEFI: [
		'质押',
		'挖矿',
		'流动性',
		'收益率',
		'apy',
		'apr',
		'投资',
		'理财',
		'defi',
		'收益',
		'利息',
		'年化',
		'swap',
		'闪兑',
		'兑换',
		'交易所',
		'借贷',
	],
	SECURITY: [
		'安全',
		'风险',
		'检查',
		'审计',
		'漏洞',
		'合约',
		'源代码',
		'验证',
		'开源',
		'貔貅',
		'盘子',
		'跑路',
		'诈骗',
		'黑名单',
	],
	IDENTITY: ['你是谁', '介绍', '自我介绍', '能做什么', '帮助'],
	DEFAULT: [],
};

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

// 创建判断是否加密相关的 prompt
const cryptoCheckPrompt = PromptTemplate.fromTemplate(`判断以下问题是否与加密货币、区块链或Web3相关。
只需回答 "true" 或 "false"，不要解释。

问题: {input}

回答:`);

export class AgentService {
	private cryptoAgent: CryptoAgent;
	private defiAgent: DeFiAgent;
	private routerModel: ChatOpenAI;
	private cryptoCheckModel: ChatOpenAI;
	private openAIService: OpenAIService;

	constructor(config: AgentServiceConfig) {
		const { openAIApiKey, rpcUrl, etherscanApiKey } = config;

		this.cryptoAgent = new CryptoAgent(openAIApiKey);
		this.defiAgent = new DeFiAgent(openAIApiKey);
		this.openAIService = new OpenAIService(openAIApiKey);

		this.routerModel = new ChatOpenAI({
			openAIApiKey,
			temperature: 0,
			modelName: 'gpt-3.5-turbo',
		});

		this.cryptoCheckModel = new ChatOpenAI({
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

	private determineRouteByKeywords(input: string): RouteType | null {
		input = input.toLowerCase();
		input = input
			.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, ' ')
			.replace(/\s+/g, ' ')
			.trim();

		for (const [route, keywords] of Object.entries(ROUTE_KEYWORDS)) {
			for (const keyword of keywords) {
				if (input.includes(keyword)) {
					return route as RouteType;
				}
			}
		}

		return null;
	}

	private async isCryptoRelated(input: string): Promise<boolean> {
		try {
			const formattedPrompt = await cryptoCheckPrompt.format({ input });
			const response = await this.cryptoCheckModel.invoke(formattedPrompt);
			const result = typeof response.content === 'string' ? response.content.toLowerCase().trim() : '';
			return result === 'true';
		} catch (error) {
			console.error('Error checking if crypto related:', error);
			// 出错时保守返回 false
			return false;
		}
	}

	async query(input: string): Promise<AgentResponse> {
		try {
			let route = this.determineRouteByKeywords(input);
			if (!route) {
				const routerResponse = await this.routerModel.invoke(await routerPrompt.format({ input }));
				route = String(routerResponse.content).trim() as RouteType;
			}

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
					response = {
						output: defiResponse.output,
						type: 'staking_pools',
					};
					break;
				}
				case 'IDENTITY':
					response = {
						output: '我是 AI 加密货币助手,可以帮您查询币价、分析行情、检查合约安全性,并推荐优质的 DeFi 项目。',
						type: 'identity',
					};
					break;
				default:
					// 使用 LLM 判断是否是加密货币相关问题
					if (await this.isCryptoRelated(input)) {
						console.log('🍊🍊🍊🍊兜底问题🍊🍊🍊🍊');
						const openAIResponse = await this.openAIService.query(input);
						response = {
							output: openAIResponse,
							type: 'crypto_general',
						};
					} else {
						response = {
							output: '抱歉，我是一个专门的加密货币助手，只能回答与加密货币、区块链相关的问题。请问我有关币价、DeFi项目、合约安全等方面的问题。',
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
