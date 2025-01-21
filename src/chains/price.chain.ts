import { BaseChain } from './base.chain';
import { ChainResponse } from '../types';

export class PriceChain extends BaseChain {
	name = 'price_chain';
	description = '加密货币价格查询链';

	async execute(symbol: string): Promise<ChainResponse> {
		try {
			const response = await fetch(`https://api.coinbase.com/v2/prices/${symbol}-USD/spot`);

			if (!response.ok) {
				throw new Error(`请求失败: ${response.statusText}`);
			}

			const data = await response.json();
			return {
				//@ts-ignore
				result: `${symbol} 当前价格: $${data.data.amount}`,
			};
		} catch (error) {
			return this.handleError(error);
		}
	}
}
