// src/types/wallet.ts
export interface TokenInfo {
	address: string;
	symbol: string;
	decimals: number;
}

export interface ChainConfig {
	rpcUrl: string;
	nativeSymbol: string;
	tokens: TokenInfo[];
}

export interface RpcResponse<T> {
	jsonrpc: string;
	id: number;
	result?: T;
	error?: {
		code: number;
		message: string;
	};
}
