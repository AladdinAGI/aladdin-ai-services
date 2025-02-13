// base.agent.ts
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
		try {
			// 使用 basePromptTemplate
			const prompt = basePromptTemplate(systemPrompt);

			const agent = await createReactAgent({
				llm: this.model,
				tools: this.tools,
				prompt,
			});

			this.executor = new AgentExecutor({
				agent,
				tools: this.tools,
				maxIterations: 3,
				returnIntermediateSteps: true,
				verbose: false, // 开启调试输出
				handleParsingErrors: false, // 关闭默认的解析错误处理
			});

			// 添加错误处理回调
			// Note: AgentExecutor does not have an onError property, so this part is removed.
		} catch (error) {
			console.error('Error initializing agent:', error);
			throw error;
		}
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

			// 准备工具名称列表
			const toolNames = this.tools.map((tool) => tool.name).join(', ');

			const result = await this.executor.invoke({
				input,
				agent_scratchpad: '',
				tool_names: toolNames,
			});

			// 处理结果
			let parsedData = null;
			let outputText = result.output;

			// 尝试从中间步骤中提取数据
			if (result.intermediateSteps) {
				for (const step of result.intermediateSteps) {
					try {
						const observation = JSON.parse(step.observation);
						if (observation.success && observation.data) {
							parsedData = observation.data;
							break;
						}
					} catch (e) {
						continue;
					}
				}
			}

			return {
				output: outputText,
				data: parsedData,
			};
		} catch (error) {
			console.error('Query error:', error);

			// 特殊处理迭代超限错误
			if ((error as Error).message?.includes('max iterations')) {
				return {
					output: '抱歉，我需要更多步骤来处理这个查询。请尝试更具体的问题。',
					error: 'MAX_ITERATIONS_REACHED',
				};
			}

			return {
				output: '处理请求时发生错误',
				error: error instanceof Error ? error.message : '未知错误',
			};
		}
	}

	protected addTool(tool: Tool): void {
		this.tools.push(tool);
	}
}
