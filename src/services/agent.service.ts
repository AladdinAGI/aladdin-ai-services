// src/services/agent.service.ts
import { CryptoAgent } from '../agents/crypto.agent';
import { DeFiAgent } from '../agents/defi.agent';
import { SecurityAgent } from '../agents/security.agent';
import { OpenAIService } from './openai.service';
import { AgentResponse } from '../types';
import { ChatOpenAI } from '@langchain/openai';
import { routerPrompt } from '../prompts/templates';

type RouteType = 'CRYPTO' | 'DEFI' | 'SECURITY' | 'IDENTITY' | 'DEFAULT';

const ROUTE_KEYWORDS: Record<RouteType, string[]> = {
	CRYPTO: ['比特币', 'btc', '以太坊', 'eth', '币价', '价格'],
	DEFI: ['质押', '收益率', 'apy', '投资', '理财', 'defi'],
	SECURITY: ['安全', '合约检查', '貔貅', 'honeypot', '黑名单', '合约地址'],
	IDENTITY: ['你是谁', '你是什么', '介绍自己'],
	DEFAULT: [],
};

interface AgentServiceConfig {
	openAIApiKey: string;
	rpcUrl: string;
	etherscanApiKey: string;
}

export class AgentService {
	private cryptoAgent: CryptoAgent;
	private defiAgent: DeFiAgent;
	private securityAgent: SecurityAgent;
	private routerModel: ChatOpenAI;

	constructor(config: AgentServiceConfig) {
		const { openAIApiKey, rpcUrl, etherscanApiKey } = config;

		this.cryptoAgent = new CryptoAgent(openAIApiKey);
		this.defiAgent = new DeFiAgent(openAIApiKey);
		this.securityAgent = new SecurityAgent(openAIApiKey, rpcUrl, etherscanApiKey);

		this.routerModel = new ChatOpenAI({
			openAIApiKey,
			temperature: 0,
			modelName: 'gpt-3.5-turbo',
		});
	}

	async initialize() {
		try {
			await Promise.all([
				this.cryptoAgent.initialize(),
				this.defiAgent.initialize(),
				this.securityAgent.initialize(),
			]);
			console.log('Agents initialized successfully');
		} catch (error) {
			console.error('Failed to initialize agents:', error);
			throw new Error('Agent initialization failed');
		}
	}

	private determineRouteByKeywords(input: string): RouteType | null {
		input = input.toLowerCase();
		for (const [route, keywords] of Object.entries(ROUTE_KEYWORDS)) {
			if (keywords.some((keyword) => input.includes(keyword))) {
				return route as RouteType;
			}
		}
		return null;
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
				case 'SECURITY': {
					const securityResponse = await this.securityAgent.query(input);
					response = {
						output: securityResponse.output,
						type: 'contract_security',
					};
					break;
				}
				case 'IDENTITY':
					response = {
						output: '我是Aladdin AI机器人🤖',
					};
					break;
				default:
					response = {
						output: '我是专注给您进稳定币投资的机器人',
					};
			}

			return response;
		} catch (error) {
			console.error('Query error:', error);
			return {
				output: '处理请求时发生错误',
				error: error instanceof Error ? error.message : '未知错误',
			};
		}
	}
}
