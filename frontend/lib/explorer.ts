// Block-explorer link helpers (OP Sepolia by default, OP Mainnet on chainId 10).
const EXPLORERS: Record<number, string> = {
  11155420: "https://sepolia-optimism.etherscan.io",
  10: "https://optimistic.etherscan.io",
};

const DEFAULT_CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 11155420);

function base(chainId = DEFAULT_CHAIN_ID) {
  return EXPLORERS[chainId] ?? EXPLORERS[11155420];
}

export const explorerTx = (hash: string, chainId?: number) =>
  `${base(chainId)}/tx/${hash}`;

export const explorerAddr = (addr: string, chainId?: number) =>
  `${base(chainId)}/address/${addr}`;

export const explorerToken = (addr: string, chainId?: number) =>
  `${base(chainId)}/token/${addr}`;
