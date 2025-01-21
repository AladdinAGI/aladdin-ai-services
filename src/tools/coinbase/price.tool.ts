// src/tools/coinbase/price.tool.ts
import { Tool } from '@langchain/core/tools';

export class CoinbasePriceTool extends Tool {
	name = 'coinbase_price';
	description =
		'Get real-time cryptocurrency prices from Coinbase. Input should be a crypto symbol like "BTC" or "ETH"';

	private cache: Map<string, { price: string; timestamp: number }> = new Map();
	private readonly CACHE_DURATION = 30 * 1000; // 30秒缓存

	async _call(input: string): Promise<string> {
		try {
			const symbol = input.trim().toUpperCase();
			if (!symbol) {
				return '请提供有效的加密货币代码';
			}

			// 检查缓存
			const cached = this.cache.get(symbol);
			if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
				return `${symbol} 的当前价格是 $${cached.price}`;
			}

			// 构建API URL
			const url = `https://api.coinbase.com/v2/prices/${symbol}-USD/spot`;

			// 发起请求
			const response = await fetch(url);
			if (!response.ok) {
				throw new Error(`API请求失败: ${response.statusText}`);
			}

			// 解析响应
			const data = await response.json();
			//@ts-ignore
			const price = data.data.amount;

			// 更新缓存
			this.cache.set(symbol, {
				price,
				timestamp: Date.now(),
			});

			return `${symbol} 的当前价格是 $${parseFloat(price).toLocaleString()}`;
		} catch (error) {
			console.error('价格查询错误:', error);
			if (error instanceof Error) {
				if (error.message.includes('404')) {
					return `不支持的加密货币: ${input}`;
				}
			}
			return `获取价格失败: ${error instanceof Error ? error.message : '未知错误'}`;
		}
	}
}
