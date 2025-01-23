// src/tools/coinbase/price.tool.ts
import { Tool } from '@langchain/core/tools';

interface CoinbasePrice {
	base: string;
	amount: string;
	currency: string;
}

interface PriceResponse {
	symbol: string;
	price: number;
	formattedPrice: string;
	change24h?: number;
	volume24h?: number;
	marketCap?: number;
	lastUpdated: string;
}

export class CoinbasePriceTool extends Tool {
	name = 'coinbase_price';
	description = 'Get real-time cryptocurrency prices from Coinbase.';

	private cache: Map<string, { response: PriceResponse; timestamp: number }> = new Map();
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
				return this.formatResponse(cached.response);
			}

			// 获取实时价格
			const spotUrl = `https://api.coinbase.com/v2/prices/${symbol}-USD/spot`;
			const response = await fetch(spotUrl);
			if (!response.ok) {
				throw new Error(`API请求失败: ${response.statusText}`);
			}

			const data = await response.json();
			//@ts-ignore
			const spotPrice = data.data as CoinbasePrice;

			// 构建响应数据
			const priceResponse: PriceResponse = {
				symbol: spotPrice.base,
				price: parseFloat(spotPrice.amount),
				formattedPrice: new Intl.NumberFormat('en-US', {
					style: 'currency',
					currency: 'USD',
				}).format(parseFloat(spotPrice.amount)),
				lastUpdated: new Date().toISOString(),
			};

			// 更新缓存
			this.cache.set(symbol, {
				response: priceResponse,
				timestamp: Date.now(),
			});

			return this.formatResponse(priceResponse);
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

	private formatResponse(data: PriceResponse): string {
		let response = `${data.symbol} 实时行情：\n\n`;
		response += `当前价格: ${data.formattedPrice}\n`;
		if (data.change24h) {
			const changeSymbol = data.change24h >= 0 ? '↑' : '↓';
			response += `24h变化: ${changeSymbol} ${Math.abs(data.change24h).toFixed(2)}%\n`;
		}
		if (data.volume24h) {
			response += `24h成交量: $${this.formatNumber(data.volume24h)}\n`;
		}
		if (data.marketCap) {
			response += `市值: $${this.formatNumber(data.marketCap)}\n`;
		}
		response += `\n更新时间: ${new Date(data.lastUpdated).toLocaleString()}`;

		return response;
	}

	private formatNumber(num: number): string {
		if (num >= 1e9) {
			return (num / 1e9).toFixed(2) + 'B';
		}
		if (num >= 1e6) {
			return (num / 1e6).toFixed(2) + 'M';
		}
		if (num >= 1e3) {
			return (num / 1e3).toFixed(2) + 'K';
		}
		return num.toLocaleString();
	}
}
