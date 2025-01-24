// src/tools/security.tools.ts
import { DynamicTool } from '@langchain/core/tools';
import { ethers } from 'ethers';

interface EtherscanResponse {
	status: string;
	result: any[];
}

interface ContractData {
	SourceCode: string;
	ContractName: string;
}

interface Transaction {
	from: string;
	isError: string;
}

export class SecurityTools {
	private provider: ethers.JsonRpcProvider;
	private etherscanApiKey: string;

	constructor(rpcUrl: string, etherscanApiKey: string) {
		this.provider = new ethers.JsonRpcProvider(rpcUrl);
		this.etherscanApiKey = etherscanApiKey;
	}

	private async checkEtherscan(address: string): Promise<ContractData> {
		const url = `https://api.etherscan.io/api?module=contract&action=getsourcecode&address=${address}&apikey=${this.etherscanApiKey}`;
		const response = await fetch(url);
		const data = await response.json();
		//@ts-ignore
		return data.result[0];
	}

	private async analyzeBytecode(bytecode: string): Promise<string[]> {
		const patterns: Record<string, RegExp> = {
			blacklist: /blacklist|denylist/i,
			ownerOnly: /onlyOwner|ownable/i,
			highFees: /fee.*(\d{2,})/i,
			transferLimit: /maxTransfer|transferLimit/i,
		};

		return Object.entries(patterns)
			.filter(([_, pattern]) => pattern.test(bytecode))
			.map(([key]) => key);
	}

	getTools(): DynamicTool[] {
		return [
			new DynamicTool({
				name: 'analyze_contract',
				description: 'Analyze smart contract for security risks',
				func: async (address: string) => {
					try {
						const code = await this.provider.getCode(address);
						if (code === '0x') return JSON.stringify({ isContract: false });

						const etherscanData = await this.checkEtherscan(address);
						const isVerified = etherscanData.SourceCode !== '';
						const risks = await this.analyzeBytecode(code);

						return JSON.stringify({
							isContract: true,
							isVerified,
							bytecodeSize: code.length,
							contractName: etherscanData.ContractName,
							risks,
							riskLevel: risks.length > 2 ? 'HIGH' : risks.length > 0 ? 'MEDIUM' : 'LOW',
						});
					} catch (error) {
						return JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' });
					}
				},
			}),
			new DynamicTool({
				name: 'check_transactions',
				description: 'Check contract transaction history',
				func: async (address: string) => {
					try {
						const url = `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&apikey=${this.etherscanApiKey}`;
						const response = await fetch(url);
						const data = (await response.json()) as EtherscanResponse;

						if (data.status === '0') return JSON.stringify({ error: 'No transactions' });

						const txs = data.result.slice(0, 100) as Transaction[];
						const failRate = txs.filter((tx) => tx.isError === '1').length / txs.length;

						return JSON.stringify({
							txCount: txs.length,
							uniqueSenders: new Set(txs.map((tx) => tx.from)).size,
							failRate,
							isSuspicious: failRate > 0.3,
						});
					} catch (error) {
						return JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' });
					}
				},
			}),
		];
	}
}
