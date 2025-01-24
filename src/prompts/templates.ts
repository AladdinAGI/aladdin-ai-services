import { ChatPromptTemplate } from '@langchain/core/prompts';

export const basePromptTemplate = (systemPrompt: string) => {
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
	return prompt;
};

export const routerPrompt = ChatPromptTemplate.fromTemplate(`
  分析用户的问题,并确定合适的处理方式:
  1. 如果是关于加密货币价格、市场、走势的问题,返回: CRYPTO
  2. 如果是关于质押、投资建议、收益率的问题,返回: DEFI 
  3. 如果是询问合约安全性、貔貅特征的问题,返回: SECURITY
  4. 如果是询问你是谁,返回: IDENTITY
  5. 其他问题,返回: DEFAULT
  
  用户问题: {input}
  
  仅返回: CRYPTO, DEFI, SECURITY, IDENTITY 或 DEFAULT`);
