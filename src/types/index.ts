// src/types/index.ts
export interface AgentConfig {
	openAIApiKey: string;
	modelName: string;
	temperature: number;
}

export interface AgentResponse {
	output: string;
	error?: string;
	type?: 'staking_pools' | 'crypto_price' | 'default' | 'error'; // 添加这个字段
	data?: any; // 可选的数据字段
}

export interface MorphoPool {
	name: string;
	token: string;
	apy: number;
	totalSupply: number;
	risk: 'low' | 'medium' | 'high';
	details: string;
}

export interface StakingPoolsResponse {
	pools: MorphoPool[];
}
