// templates.ts
import { ChatPromptTemplate } from '@langchain/core/prompts';

export const basePromptTemplate = (systemPrompt: string) => {
	const prompt = ChatPromptTemplate.fromMessages([
		[
			'system',
			`你是一个专业的AI助手。你必须严格按照以下格式一步一步执行，确保包含所有必需的部分：

      可用工具：
      {tool_names}

      工具说明：
      {tools}

      严格按照此格式回答（缺少任何部分都会导致错误）：

      Thought: 让我思考如何解决这个问题
      Action: [工具名称]
      Action Input: [参数] (即使工具不需要参数，也必须填写 "" 空字符串)
      Observation: [工具返回结果]
      Thought: 分析工具返回的结果
      Final Answer: [最终答案]

      格式要求：
      1. Thought: 必须包含，说明你的思考过程
      2. Action: 必须是以下工具之一：get_token_info、get_price_history、search_token、get_market_trends
      3. Action Input: 必须有，参数需要用引号包裹。如果工具不需要参数，使用 ""
      4. Observation: 必须等待工具返回结果
      5. 最后必须有 Final Answer

      示例1（需要参数的工具）：
      Thought: 我需要查询比特币价格
      Action: get_token_info
      Action Input: "bitcoin"
      Observation: (等待工具返回结果)
      Thought: 已获得比特币价格信息
      Final Answer: 比特币当前价格是xxx美元

      示例2（不需要参数的工具）：
      Thought: 我需要查看市场趋势
      Action: get_market_trends
      Action Input: ""
      Observation: (等待工具返回结果)
      Thought: 已获得市场趋势数据
      Final Answer: 当前最热门的代币是xxx

      注意：不要跳过任何步骤，必须严格按照格式执行。每个步骤都是必需的。

      ${systemPrompt}`,
		],
		['human', '{input}'],
		['assistant', '{agent_scratchpad}'],
	]);
	return prompt;
};

export const routerPrompt = ChatPromptTemplate.fromTemplate(`
  分析用户输入,判断查询类型:
  1. 如果询问任何代币的价格、市场、走势相关信息,返回: CRYPTO
  2. 如果是关于质押、投资建议、收益率的问题,返回: DEFI 
  3. 如果是询问合约安全性、风险分析的问题,返回: SECURITY
  4. 如果是询问你是谁,返回: IDENTITY
  5. 其他问题,返回: DEFAULT

  用户输入包含代币相关词时,不论代币种类都返回CRYPTO。
  
  用户问题: {input}
  
  仅返回: CRYPTO, DEFI, SECURITY, IDENTITY 或 DEFAULT`);

// 添加代币提取prompt
export const extractTokenPrompt = ChatPromptTemplate.fromTemplate(`
  从用户输入中提取代币信息:
  1. 识别出用户想查询的是哪个代币
  2. 返回代币的标准符号
  3. 如果无法确定具体代币,返回 "UNKNOWN"
  
  举例:
  - 输入: "查询比特币价格" -> 返回: "BTC"
  - 输入: "doge币最近涨了多少" -> 返回: "DOGE"
  - 输入: "帮我看看luna代币" -> 返回: "LUNA"
  
  用户输入: {input}
  
  仅返回代币符号,不需要其他说明。`);
