import "server-only";
import {
  createPublicClient,
  createWalletClient,
  http,
  type Address,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { parseAbiItem } from "viem";
import { serverChain, rpcUrl } from "./chain";
import { PULLPAY_ESCROW_ABI } from "@/lib/contracts/PullPayEscrow";
import { ESCROW_ADDRESS, DEPLOY_BLOCK } from "@/lib/contracts/addresses";

export const publicClient = createPublicClient({
  chain: serverChain,
  transport: http(rpcUrl),
});

// Least-privilege relayer account (asserts / settles only — never holds reward
// funds, PRD §13). Present only when RELAYER_PRIVATE_KEY is configured.
export function getRelayer() {
  const pk = process.env.RELAYER_PRIVATE_KEY;
  if (!pk || pk === "0x" || /^0x0+$/.test(pk)) return null;
  const account = privateKeyToAccount(pk as `0x${string}`);
  const wallet = createWalletClient({
    account,
    chain: serverChain,
    transport: http(rpcUrl),
  });
  return { account, wallet };
}

export const escrow = {
  address: ESCROW_ADDRESS,
  abi: PULLPAY_ESCROW_ABI,
} as const;

// Reward record shape from getReward(id).
export interface OnchainReward {
  maintainer: Address;
  token: Address;
  amount: bigint;
  repo: string;
  issueNumber: bigint;
  status: number; // 0 None, 1 Funded, 2 Asserted, 3 Settled, 4 Refunded, 5 Rejected
  deadline: bigint;
}

export async function readReward(id: `0x${string}`): Promise<OnchainReward> {
  const r = (await publicClient.readContract({
    ...escrow,
    functionName: "getReward",
    args: [id],
  })) as readonly [Address, Address, bigint, string, bigint, number, bigint];
  return {
    maintainer: r[0],
    token: r[1],
    amount: r[2],
    repo: r[3],
    issueNumber: r[4],
    status: Number(r[5]),
    deadline: r[6],
  };
}

/** Read the full record and return the settlement mode (0 Instant, 1 Safeguarded). */
export async function readRewardMode(id: `0x${string}`): Promise<number> {
  const r = (await publicClient.readContract({
    ...escrow,
    functionName: "rewards",
    args: [id],
  })) as readonly unknown[];
  return Number(r[7]);
}

const REWARD_CREATED = parseAbiItem(
  "event RewardCreated(bytes32 indexed id, address indexed maintainer, uint256 amount)"
);

// Scan RewardCreated logs to find a Funded reward matching a repo+issue when
// the store has no explicit link (nonce makes the id underivable otherwise).
export async function findRewardIdForIssue(
  repo: string,
  issue: number
): Promise<`0x${string}` | null> {
  const logs = await publicClient.getLogs({
    address: ESCROW_ADDRESS,
    event: REWARD_CREATED,
    fromBlock: DEPLOY_BLOCK,
    toBlock: "latest",
  });
  const ids = Array.from(new Set(logs.map((l) => l.args.id as `0x${string}`)));
  for (const id of ids) {
    try {
      const r = (await publicClient.readContract({
        ...escrow,
        functionName: "rewards",
        args: [id],
      })) as readonly unknown[];
      const matchRepo = String(r[4]).toLowerCase() === repo.toLowerCase();
      const matchIssue = Number(r[5] as bigint) === issue;
      const funded = Number(r[11]) === 1;
      if (matchRepo && matchIssue && funded) return id;
    } catch {
      // skip unreadable record
    }
  }
  return null;
}
