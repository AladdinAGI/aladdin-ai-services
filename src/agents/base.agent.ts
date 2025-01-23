import { AgentExecutor, createReactAgent } from 'langchain/agents';
import { ChatOpenAI } from '@langchain/openai';
import { Tool } from '@langchain/core/tools';
import { basePromptTemplate } from '../prompts/templates';

// Define an abstract BaseAgent class to serve as the foundation for specific agent implementations
// 定义一个抽象的 BaseAgent 类，作为具体 Agent 实现的基础
export abstract class BaseAgent {
	// The language model instance for the agent
	// Agent 使用的语言模型实例
	protected model: ChatOpenAI;

	// Array to store tools available for the agent
	// 用于存储 Agent 可用工具的数组
	protected tools: Tool[];

	// Executor responsible for managing the agent's workflow; initially set to null
	// 管理 Agent 工作流程的执行器，初始值为 null
	protected executor: AgentExecutor | null = null;

	constructor(openAIApiKey: string) {
		if (!openAIApiKey) {
			throw new Error('OpenAI API key is required');
		}

		// Initialize the language model with specific configurations
		// 使用特定配置初始化语言模型
		this.model = new ChatOpenAI({
			openAIApiKey,
			modelName: 'gpt-3.5-turbo',
			temperature: 0, // Low temperature for deterministic outputs
		});

		// Initialize the tools array
		// 初始化工具数组
		this.tools = [];
	}

	/**
	 * Initializes the base agent by creating the execution environment and linking tools.
	 * 通过创建执行环境并链接工具来初始化基础 Agent。
	 * @param systemPrompt - The prompt template to set the agent's context and behavior.
	 *                     - 用于设置 Agent 上下文和行为的提示模板。
	 */
	protected async baseInitialize(systemPrompt: string) {
		// Create the prompt using a template
		// 使用模板创建提示
		const prompt = basePromptTemplate(systemPrompt);

		// Create the agent with the language model, tools, and prompt
		// 使用语言模型、工具和提示创建 Agent
		const agent = await createReactAgent({
			llm: this.model,
			tools: this.tools,
			prompt,
		});

		// Set up the executor to manage agent workflow with a maximum of 2 iterations
		// 设置执行器以管理 Agent 工作流程，最多进行 3 次迭代
		this.executor = new AgentExecutor({
			agent,
			tools: this.tools,
			maxIterations: 3,
			verbose: false, // Enable verbose mode for debugging purposes
		});
	}

	/**
	 * Abstract method to be implemented by subclasses for custom initialization.
	 * 抽象方法，需由子类实现以进行自定义初始化。
	 */
	abstract initialize(): Promise<void>;

	/**
	 * Handles querying the agent with input and returns the result.
	 * 处理对 Agent 的查询并返回结果。
	 * @param input - The input string for the agent to process.
	 *              - 要处理的输入字符串。
	 * @returns The output and intermediate steps from the agent.
	 *          Agent 的输出和中间步骤。
	 */
	// async query(input: string): Promise<any> {
	// 	try {
	// 		// Ensure the executor is initialized before processing
	// 		// 确保在处理之前已初始化执行器
	// 		if (!this.executor) {
	// 			await this.initialize();
	// 		}

	// 		if (!this.executor) {
	// 			throw new Error('Executor not initialized');
	// 		}

	// 		// Invoke the executor with the input and additional metadata
	// 		// 使用输入和附加元数据调用执行器
	// 		const result = await this.executor.invoke({
	// 			input,
	// 			agent_scratchpad: '', // Provide an empty scratchpad for agent processing
	// 			tool_names: this.tools.map((tool) => tool.name).join(', '),
	// 		});
	// 		console.log('🐻🐻🐻🐻🐻--》', result);
	// 		return {
	// 			output: result.output, // Final output from the agent
	// 			intermediateSteps: result.intermediateSteps, // Steps taken during the agent's reasoning
	// 		};
	// 	} catch (error) {
	// 		console.error('Agent query error:', error);
	// 		return {
	// 			output: '处理请求时发生错误',
	// 			error: error instanceof Error ? error.message : '未知错误',
	// 		};
	// 	}
	// }
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
				agent_scratchpad: '',
				tool_names: this.tools.map((tool) => tool.name).join(', '),
			});

			// 尝试从 intermediateSteps 中获取 morpho_pools 工具的输出
			const morphoStep = result.intermediateSteps?.find((step: any) => step.action?.tool === 'morpho_pools');
			console.log('morphoStep:🐻🐻🐻🐻🐻 ', result);

			if (morphoStep?.observation) {
				return {
					output: morphoStep.observation,
					intermediateSteps: result.intermediateSteps,
				};
			}

			// 如果没有找到工具输出，返回原始输出
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
	getTools(): Tool[] {
		return this.tools;
	}

	protected addTool(tool: Tool): void {
		this.tools.push(tool);
	}
}
