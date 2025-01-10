import { ChatOpenAI } from '@langchain/openai';
import { AgentExecutor, createReactAgent } from 'langchain/agents';
import { pull } from 'langchain/hub';
import dotenv from 'dotenv';

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

class Calculator {
	name = 'calculator';
	description = '用于执行数学计算';

	async call(input: string): Promise<string> {
		try {
			return eval(input).toString();
		} catch (error) {
			return '计算错误';
		}
	}
}

async function createAgent() {
	const model = new ChatOpenAI({
		openAIApiKey: OPENAI_API_KEY,
		temperature: 0,
		modelName: 'gpt-3.5-turbo',
	});

	const tools = [new Calculator()];
	const prompt = await pull('hwchase17/react-chat');

	const agent = await createReactAgent({
		llm: model,
		tools,
		prompt,
	});

	return new AgentExecutor({
		agent,
		tools,
		maxIterations: 3,
	});
}

async function runAgent() {
	try {
		const agent = await createAgent();
		const question = '当前比特币(BTC)的价格是多少?';

		console.log('问题:', question);
		const result = await agent.invoke({ input: question });
		console.log('回答:', result.output);
	} catch (error) {
		console.error('错误:', error);
	}
}

runAgent();
