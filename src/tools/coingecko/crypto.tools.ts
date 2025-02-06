// crypto.tools.ts
import { DynamicTool } from '@langchain/core/tools';

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';

// 定义基础响应接口
interface BaseResponse<T> {
	success: boolean;
	data: T | null;
	error?: string;
}

// API 响应类型
interface CoinGeckoPrice {
	usd: number;
}

interface CoinGeckoMarketData {
	current_price: CoinGeckoPrice;
	market_cap: CoinGeckoPrice;
	total_volume: CoinGeckoPrice;
	price_change_percentage_24h: number;
}

interface CoinGeckoResponse {
	name: string;
	symbol: string;
	market_data?: CoinGeckoMarketData;
	description?: {
		en?: string;
	};
}

interface CoinGeckoTrendingItem {
	item: {
		id: string;
		name: string;
		symbol: string;
		market_cap_rank: number;
		score: number;
	};
}

interface CoinGeckoTrendingResponse {
	coins: CoinGeckoTrendingItem[];
}

interface CoinGeckoPriceResponse {
	[key: string]: {
		usd: number;
	};
}

interface CoinGeckoSearchResponse {
	coins: Array<{
		id: string;
		name: string;
		symbol: string;
		market_cap_rank: number | null;
	}>;
}

interface CoinGeckoMarketChartResponse {
	prices: [number, number][];
}

// 输出类型
export interface TokenInfo {
	name: string;
	symbol: string;
	current_price?: number;
	market_cap?: number;
	total_volume?: number;
	price_change_24h?: number;
	description?: string;
}

export interface PriceHistoryData {
	prices: Array<{
		timestamp: number;
		price: number;
	}>;
}

export interface SearchResult {
	id: string;
	name: string;
	symbol: string;
	market_cap_rank: number;
}

export interface TrendingData {
	name: string;
	symbol: string;
	market_cap_rank: number;
	price_usd: number;
	score: number;
}

// 工具响应类型
export type TokenInfoResponse = BaseResponse<TokenInfo>;
export type PriceHistoryResponse = BaseResponse<PriceHistoryData>;
export type SearchResponse = BaseResponse<SearchResult[]>;
export type TrendingResponse = BaseResponse<TrendingData[]>;

export class CryptoTools {
	private static async fetchWithTimeout<T>(url: string, options: RequestInit = {}): Promise<T> {
		const timeout = 10000;
		const controller = new AbortController();
		const id = setTimeout(() => controller.abort(), timeout);

		try {
			const response = await fetch(url, {
				...options,
				signal: controller.signal,
			});
			clearTimeout(id);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = (await response.json()) as T;
			return data;
		} catch (error) {
			clearTimeout(id);
			throw error;
		}
	}

	private static createSuccessResponse<T>(data: T): string {
		const response: BaseResponse<T> = {
			success: true,
			data,
		};
		return JSON.stringify(response);
	}

	private static createErrorResponse(error: string): string {
		const response: BaseResponse<null> = {
			success: false,
			data: null,
			error,
		};
		return JSON.stringify(response);
	}

	static async getTokenInfo(tokenId: string): Promise<string> {
		try {
			const endpoint = tokenId.startsWith('0x')
				? `${COINGECKO_API_BASE}/coins/ethereum/contract/${tokenId}`
				: `${COINGECKO_API_BASE}/coins/${tokenId}`;

			const data = await this.fetchWithTimeout<CoinGeckoResponse>(endpoint);

			const tokenInfo: TokenInfo = {
				name: data.name,
				symbol: data.symbol,
				current_price: data.market_data?.current_price.usd,
				market_cap: data.market_data?.market_cap.usd,
				total_volume: data.market_data?.total_volume.usd,
				price_change_24h: data.market_data?.price_change_percentage_24h,
				description: data.description?.en?.slice(0, 200),
			};

			return this.createSuccessResponse(tokenInfo);
		} catch (error) {
			return this.createErrorResponse('无法获取该代币信息，请确认输入的代币ID或合约地址是否正确');
		}
	}

	static async getPriceHistory(coinId: string, days: string): Promise<string> {
		try {
			const params = new URLSearchParams({
				vs_currency: 'usd',
				days: days || '7',
				interval: 'daily',
			});

			const data = await this.fetchWithTimeout<CoinGeckoMarketChartResponse>(
				`${COINGECKO_API_BASE}/coins/${coinId}/market_chart?${params}`,
			);

			const priceHistory: PriceHistoryData = {
				prices: data.prices.map(([timestamp, price]) => ({
					timestamp,
					price,
				})),
			};

			return this.createSuccessResponse(priceHistory);
		} catch (error) {
			return this.createErrorResponse('无法获取价格历史数据，请检查代币ID是否正确');
		}
	}

	static async searchToken(query: string): Promise<string> {
		try {
			const params = new URLSearchParams({ query });
			const data = await this.fetchWithTimeout<CoinGeckoSearchResponse>(`${COINGECKO_API_BASE}/search?${params}`);

			const results: SearchResult[] = data.coins.slice(0, 5).map((coin) => ({
				id: coin.id,
				name: coin.name,
				symbol: coin.symbol,
				market_cap_rank: coin.market_cap_rank ?? 0,
			}));

			return this.createSuccessResponse(results);
		} catch (error) {
			return this.createErrorResponse('搜索失败，请稍后重试');
		}
	}

	static async getMarketTrends(): Promise<string> {
		try {
			// 获取趋势数据
			const trendingData = await this.fetchWithTimeout<CoinGeckoTrendingResponse>(
				`${COINGECKO_API_BASE}/search/trending`,
			);

			// 获取所有趋势代币的ID
			const coinIds = trendingData.coins.map((coin) => coin.item.id).join(',');

			// 获取这些代币的USD价格
			const priceData = await this.fetchWithTimeout<CoinGeckoPriceResponse>(
				`${COINGECKO_API_BASE}/simple/price?ids=${coinIds}&vs_currencies=usd`,
			);

			const trends: TrendingData[] = trendingData.coins.map((coin) => ({
				name: coin.item.name,
				symbol: coin.item.symbol,
				market_cap_rank: coin.item.market_cap_rank,
				price_usd: priceData[coin.item.id]?.usd ?? 0,
				score: coin.item.score,
			}));

			return this.createSuccessResponse(trends);
		} catch (error) {
			return this.createErrorResponse('无法获取市场趋势数据');
		}
	}

	static getTools(): DynamicTool[] {
		return [
			new DynamicTool({
				name: 'get_token_info',
				description:
					'获取代币的价格、市值、24小时交易量等市场数据。输入为代币ID(如bitcoin, ethereum)或合约地址',
				func: this.getTokenInfo.bind(this),
			}),
			new DynamicTool({
				name: 'get_price_history',
				description: '获取代币的历史价格数据。输入格式: "token_id,days" 如 "bitcoin,30"获取比特币30天价格数据',
				func: async (input: string) => {
					const [coinId, days] = input.split(',');
					return this.getPriceHistory(coinId, days);
				},
			}),
			new DynamicTool({
				name: 'search_token',
				description: '搜索代币信息，可通过名称或符号查询。输入为搜索关键词',
				func: this.searchToken.bind(this),
			}),
			new DynamicTool({
				name: 'get_market_trends',
				description: '获取市场趋势数据，包括涨跌幅排名等信息',
				func: this.getMarketTrends.bind(this),
			}),
		];
	}
}
