// ABI for PullPayEscrow (contracts/src/PullPayEscrow.sol). Hand-maintained to
// mirror the deployed surface; regenerate via `forge inspect` when the contract
// changes. Kept `as const` for end-to-end viem/wagmi type inference.
export const PULLPAY_ESCROW_ABI = [
  {
    type: "function",
    name: "createReward",
    stateMutability: "nonpayable",
    inputs: [
      { name: "id", type: "bytes32" },
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "bond", type: "uint256" },
      { name: "repo", type: "string" },
      { name: "issueNumber", type: "uint256" },
      { name: "criteriaHash", type: "bytes32" },
      { name: "mode", type: "uint8" },
      { name: "deadline", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "approveAndRelease",
    stateMutability: "nonpayable",
    inputs: [
      { name: "id", type: "bytes32" },
      { name: "contributor", type: "address" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "settleInstant",
    stateMutability: "nonpayable",
    inputs: [
      { name: "id", type: "bytes32" },
      { name: "contributor", type: "address" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "assertMerge",
    stateMutability: "nonpayable",
    inputs: [
      { name: "id", type: "bytes32" },
      { name: "contributor", type: "address" },
      { name: "claim", type: "bytes" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "escalateToUMA",
    stateMutability: "nonpayable",
    inputs: [
      { name: "id", type: "bytes32" },
      { name: "claim", type: "bytes" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "refund",
    stateMutability: "nonpayable",
    inputs: [{ name: "id", type: "bytes32" }],
    outputs: [],
  },
  {
    type: "function",
    name: "getReward",
    stateMutability: "view",
    inputs: [{ name: "id", type: "bytes32" }],
    outputs: [
      { name: "maintainer", type: "address" },
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "repo", type: "string" },
      { name: "issueNumber", type: "uint256" },
      { name: "status", type: "uint8" },
      { name: "deadline", type: "uint256" },
    ],
  },
  {
    // Full record incl. bond, criteriaHash, mode, assertionId, contributor.
    type: "function",
    name: "rewards",
    stateMutability: "view",
    inputs: [{ name: "", type: "bytes32" }],
    outputs: [
      { name: "maintainer", type: "address" },
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "bond", type: "uint256" },
      { name: "repo", type: "string" },
      { name: "issueNumber", type: "uint256" },
      { name: "criteriaHash", type: "bytes32" },
      { name: "mode", type: "uint8" },
      { name: "deadline", type: "uint256" },
      { name: "assertionId", type: "bytes32" },
      { name: "contributor", type: "address" },
      { name: "status", type: "uint8" },
    ],
  },
  {
    type: "function",
    name: "isFunded",
    stateMutability: "view",
    inputs: [{ name: "id", type: "bytes32" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "isSolvent",
    stateMutability: "view",
    inputs: [{ name: "id", type: "bytes32" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "liveness",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint64" }],
  },
  {
    type: "event",
    name: "RewardCreated",
    inputs: [
      { name: "id", type: "bytes32", indexed: true },
      { name: "maintainer", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "RewardAsserted",
    inputs: [
      { name: "id", type: "bytes32", indexed: true },
      { name: "assertionId", type: "bytes32", indexed: true },
      { name: "contributor", type: "address", indexed: false },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "RewardSettled",
    inputs: [
      { name: "id", type: "bytes32", indexed: true },
      { name: "contributor", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "attestationUID", type: "bytes32", indexed: false },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "RewardRejected",
    inputs: [{ name: "id", type: "bytes32", indexed: true }],
    anonymous: false,
  },
  {
    type: "event",
    name: "RewardRefunded",
    inputs: [{ name: "id", type: "bytes32", indexed: true }],
    anonymous: false,
  },
] as const;

// Contract Mode enum (createReward `mode` arg).
export const MODE = { Instant: 0, Safeguarded: 1 } as const;
export type ModeValue = (typeof MODE)[keyof typeof MODE];
