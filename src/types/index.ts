// src/types/index.ts
export interface AgentConfig {
	openAIApiKey: string;
	modelName: string;
	temperature: number;
}

export interface AgentResponse {
	output: string;
	error?: string;
	intermediateSteps?: any[];
}

export interface ChainResponse {
	result: string;
	error?: string;
}

export interface CryptoPrice {
	amount: string;
	base: string;
	currency: string;
}

export interface StakingPool {
	name: string;
	apy: number;
	tvl: number;
	risk: 'low' | 'medium' | 'high';
}

export interface WalletBalance {
	address: string;
	tokens: {
		symbol: string;
		balance: string;
		usdValue: number;
	}[];
}
