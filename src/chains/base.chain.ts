// src/chains/base.chain.ts
import { ChainResponse } from '../types';

export abstract class BaseChain {
	abstract name: string;
	abstract description: string;

	abstract execute(input: any): Promise<ChainResponse>;

	protected async handleError(error: any): Promise<ChainResponse> {
		return {
			result: '',
			error: error instanceof Error ? error.message : '未知错误',
		};
	}
}
