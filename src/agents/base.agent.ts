// src/agents/base.agent.ts
import { AgentExecutor, createReactAgent } from 'langchain/agents';
import { ChatOpenAI } from '@langchain/openai';
import { Tool } from '@langchain/core/tools';
import { ChatPromptTemplate } from '@langchain/core/prompts';

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
		const prompt = ChatPromptTemplate.fromMessages([
			[
				'system',
				`你是一个AI助手。使用以下工具来帮助解决问题：
{tool_names}

工具详细说明：
{tools}

使用格式：
Thought: 让我思考如何解决这个问题
Action: 要使用的工具名称
Action Input: 要传递给工具的输入
Observation: 工具的输出
... (可以有多轮思考和行动)
Thought: 我现在知道答案了
Final Answer: 最终答案（用中文回答）

${systemPrompt}`,
			],
			['human', '{input}'],
			['assistant', '{agent_scratchpad}'],
		]);

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
