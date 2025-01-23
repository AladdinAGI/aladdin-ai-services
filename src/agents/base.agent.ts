// src/agents/base.agent.ts
import { AgentExecutor, createReactAgent } from 'langchain/agents';
import { ChatOpenAI } from '@langchain/openai';
import { Tool } from '@langchain/core/tools';
import { basePromptTemplate } from '../prompts/templates';

export abstract class BaseAgent {
	protected model: ChatOpenAI;
	protected tools: Tool[];
	protected executor: AgentExecutor | null = null;

	constructor(openAIApiKey: string) {
		if (!openAIApiKey) {
			throw new Error('OpenAI API key is required');
		}

		this.model = new ChatOpenAI({
			openAIApiKey,
			modelName: 'gpt-3.5-turbo',
			temperature: 0,
		});

		this.tools = [];
	}

	protected async baseInitialize(systemPrompt: string) {
		const prompt = basePromptTemplate(systemPrompt);

		const agent = await createReactAgent({
			llm: this.model,
			tools: this.tools,
			prompt,
		});

		this.executor = new AgentExecutor({
			agent,
			tools: this.tools,
			maxIterations: 2,
			verbose: true,
		});
	}

	abstract initialize(): Promise<void>;

	async query(input: string): Promise<any> {
		try {
			if (!this.executor) {
				await this.initialize();
			}

			if (!this.executor) {
				throw new Error('Executor not initialized');
			}

			const result = await this.executor.invoke({
				input,
				agent_scratchpad: '', // 提供空的 scratchpad
				tool_names: this.tools.map((tool) => tool.name).join(', '),
			});

			return {
				output: result.output,
				intermediateSteps: result.intermediateSteps,
			};
		} catch (error) {
			console.error('Agent query error:', error);
			return {
				output: '处理请求时发生错误',
				error: error instanceof Error ? error.message : '未知错误',
			};
		}
	}

	// 获取工具列表
	getTools(): Tool[] {
		return this.tools;
	}

	// 添加工具
	protected addTool(tool: Tool): void {
		this.tools.push(tool);
	}
}
