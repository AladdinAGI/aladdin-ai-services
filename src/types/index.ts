// src/types/index.ts
export interface AgentConfig {
	openAIApiKey: string;
	modelName: string;
	temperature: number;
}

export interface AgentResponse {
	output: string;
	error?: string;
	type?: 'staking_pools' | 'crypto_price' | 'default' | 'error' | 'contract_security' | 'identity'; // Type identifier for response handling
	data?: any; // Optional data field
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
