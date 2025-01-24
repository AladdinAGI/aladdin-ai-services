// src/tools/wallet/balance.tool.ts
import { Tool } from '@langchain/core/tools';
import { TokenInfo, ChainConfig, RpcResponse } from '../../types/wallet';

export class WalletBalanceTool extends Tool {
	name = 'wallet_balance';
	description =
		'Get wallet balance for a given address on specific chain. Input format: "chainId|address". Chain IDs: 1 (Ethereum), 137 (Polygon), 56 (BSC)';

	private readonly chainConfigs: Record<string, ChainConfig> = {
		'1': {
			rpcUrl: 'https://eth.llamarpc.com',
			nativeSymbol: 'ETH',
			tokens: [
				{
					address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
					symbol: 'USDT',
					decimals: 6,
				},
				{
					address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
					symbol: 'USDC',
					decimals: 6,
				},
			],
		},
		'137': {
			rpcUrl: 'https://polygon.llamarpc.com',
			nativeSymbol: 'MATIC',
			tokens: [
				{
					address: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
					symbol: 'USDT',
					decimals: 6,
				},
			],
		},
		'56': {
			rpcUrl: 'https://bsc.llamarpc.com',
			nativeSymbol: 'BNB',
			tokens: [
				{
					address: '0x55d398326f99059ff775485246999027b3197955',
					symbol: 'USDT',
					decimals: 18,
				},
			],
		},
	};

	async _call(input: string): Promise<string> {
		try {
			const [chainId, address] = input.split('|');

			if (!this.chainConfigs[chainId]) {
				return `不支持的链 ID: ${chainId}`;
			}

			if (!this.isValidAddress(address)) {
				return '无效的钱包地址';
			}

			const chainConfig = this.chainConfigs[chainId];
			const nativeBalance = await this.getNativeBalance(chainConfig.rpcUrl, address);
			const tokenBalances = await this.getTokenBalances(chainConfig, address);

			let result = `地址 ${address} 的资产:\n`;
			result += `${chainConfig.nativeSymbol}: ${this.formatBalance(nativeBalance)}\n`;
			if (tokenBalances.length > 0) {
				result += tokenBalances.join('\n');
			}

			return result;
		} catch (error) {
			console.error('查询钱包余额失败:', error);
			return '查询钱包余额失败: ' + (error instanceof Error ? error.message : '未知错误');
		}
	}

	private isValidAddress(address: string): boolean {
		return /^0x[a-fA-F0-9]{40}$/.test(address);
	}

	private formatBalance(balance: string | number, decimals: number = 18): string {
		const num = typeof balance === 'string' ? parseFloat(balance) : balance;
		return num.toFixed(4);
	}

	private async makeRpcCall<T>(rpcUrl: string, method: string, params: any[]): Promise<T> {
		const response = await fetch(rpcUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				jsonrpc: '2.0',
				id: 1,
				method,
				params,
			}),
		});

		if (!response.ok) {
			throw new Error(`RPC请求失败: ${response.statusText}`);
		}

		const data = (await response.json()) as RpcResponse<T>;

		if (data.error) {
			throw new Error(`RPC错误: ${data.error.message}`);
		}

		if (data.result === undefined) {
			throw new Error('RPC返回结果为空');
		}

		return data.result;
	}

	private async getNativeBalance(rpcUrl: string, address: string): Promise<string> {
		const balance = await this.makeRpcCall<string>(rpcUrl, 'eth_getBalance', [address, 'latest']);

		const balanceInEther = parseInt(balance, 16) / 1e18;
		return balanceInEther.toString();
	}

	private async getTokenBalances(chainConfig: ChainConfig, address: string): Promise<string[]> {
		const balances: string[] = [];

		for (const token of chainConfig.tokens) {
			try {
				const data = this.createTokenBalanceData(address);
				const result = await this.makeRpcCall<string>(chainConfig.rpcUrl, 'eth_call', [
					{
						to: token.address,
						data,
					},
					'latest',
				]);

				const balance = parseInt(result, 16) / Math.pow(10, token.decimals);

				if (balance > 0) {
					balances.push(`${token.symbol}: ${this.formatBalance(balance, token.decimals)}`);
				}
			} catch (error) {
				console.error(`获取代币余额失败 (${token.symbol}):`, error);
			}
		}

		return balances;
	}

	private createTokenBalanceData(address: string): string {
		// ERC20 balanceOf method ID (0x70a08231) + padded address
		return `0x70a08231000000000000000000000000${address.slice(2)}`;
	}
}
