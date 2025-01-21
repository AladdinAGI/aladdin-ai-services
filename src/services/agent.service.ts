import { CryptoAgent } from '../agents/crypto.agent';
import { DeFiAgent } from '../agents/defi.agent';
import { OpenAIService } from './openai.service';
import { AgentResponse } from '../types';

export class AgentService {
	private cryptoAgent: CryptoAgent;
	private defiAgent: DeFiAgent;
	private openaiService: OpenAIService;

	constructor(openAIApiKey: string) {
		this.cryptoAgent = new CryptoAgent(openAIApiKey);
		this.defiAgent = new DeFiAgent(openAIApiKey);
		this.openaiService = new OpenAIService(openAIApiKey);
	}

	async initialize() {
		await Promise.all([this.cryptoAgent.initialize(), this.defiAgent.initialize()]);
	}

	async query(input: string): Promise<AgentResponse> {
		try {
			const normalizedInput = input.toLowerCase();

			// 首先检查是否是质押相关查询
			if (
				normalizedInput.includes('推荐一些') ||
				normalizedInput.includes('收益') ||
				normalizedInput.includes('apy') ||
				normalizedInput.includes('稳定币')
			) {
				return await this.defiAgent.query(input);
			}
			// 然后检查是否是价格相关查询
			else if (
				normalizedInput.includes('价格') ||
				normalizedInput.includes('比特币') ||
				(normalizedInput.includes('币') && !normalizedInput.includes('稳定币'))
			) {
				return await this.cryptoAgent.query(input);
			} else if (normalizedInput.includes('你是谁')) {
				return {
					output: '我是Aladdin AI机器人🤖',
				};
			}
			// 默认使用 OpenAI
			else {
				const response = await this.openaiService.query(input);
				return { output: response };
			}
		} catch (error) {
			return {
				output: '处理请求时发生错误',
				error: error instanceof Error ? error.message : '未知错误',
			};
		}
	}
}
