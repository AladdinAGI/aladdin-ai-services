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
	lastUpdated: string;
	history?: { date: string; close: number }[];
}

export class CoinbasePriceTool extends Tool {
	name = 'coinbase_price';
	description = 'Get real-time and historical cryptocurrency prices.';

	private cache: Map<string, { response: PriceResponse; timestamp: number }> = new Map();
	private readonly CACHE_DURATION = 30 * 1000; // 30秒缓存
	private readonly symbolMap: Record<string, { symbol: string; id: string }> = {
		BITCOIN: { symbol: 'BTC', id: 'bitcoin' },
		BTC: { symbol: 'BTC', id: 'bitcoin' },
		ETHEREUM: { symbol: 'ETH', id: 'ethereum' },
		ETH: { symbol: 'ETH', id: 'ethereum' },
		USDT: { symbol: 'USDT', id: 'tether' },
		BNB: { symbol: 'BNB', id: 'binancecoin' },
		SOL: { symbol: 'SOL', id: 'solana' },
	};

	async _call(input: string): Promise<string> {
		try {
			const rawSymbol = input.trim().toUpperCase();
			const coinInfo = this.symbolMap[rawSymbol];

			if (!coinInfo) {
				return `币种 SYMBOL=${rawSymbol} 不支持，请检查输入`;
			}

			// 检查缓存
			const cached = this.cache.get(coinInfo.symbol);
			if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
				return JSON.stringify(cached.response);
			}

			// 获取实时价格
			const spotUrl = `https://api.coinbase.com/v2/prices/${coinInfo.symbol}-USD/spot`;
			const realTimePrice = await this.fetchRealTimePrice(spotUrl, coinInfo.symbol);

			// 获取历史价格
			const historyUrl = `https://api.coingecko.com/api/v3/coins/${coinInfo.id}/market_chart?vs_currency=usd&days=7&interval=daily`;
			const history = await this.fetchHistoryPrices(historyUrl);

			// 合并数据
			const response: PriceResponse = {
				...realTimePrice,
				history,
			};

			// 更新缓存
			this.cache.set(coinInfo.symbol, {
				response,
				timestamp: Date.now(),
			});

			return JSON.stringify(response);
		} catch (error) {
			console.error('价格查询错误:', error);
			return JSON.stringify({
				success: false,
				error: `获取价格失败: ${error instanceof Error ? error.message : '未知错误'}`,
			});
		}
	}

	private async fetchRealTimePrice(url: string, symbol: string): Promise<PriceResponse> {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`实时价格API请求失败: ${response.statusText}`);
		}

		const data = await response.json();
		//@ts-ignore
		const spotPrice = data.data as CoinbasePrice;

		return {
			symbol: spotPrice.base,
			price: parseFloat(spotPrice.amount),
			formattedPrice: new Intl.NumberFormat('en-US', {
				style: 'currency',
				currency: 'USD',
			}).format(parseFloat(spotPrice.amount)),
			lastUpdated: new Date().toISOString(),
		};
	}

	private async fetchHistoryPrices(url: string): Promise<{ date: string; close: number }[]> {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`历史价格API请求失败: ${response.statusText}`);
		}

		const data = await response.json();
		// @ts-ignore
		return data.prices.map((price: [number, number]) => ({
			date: new Date(price[0]).toISOString().split('T')[0],
			close: price[1],
		}));
	}
}
