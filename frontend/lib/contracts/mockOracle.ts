// Minimal ABI for the local MockOptimisticOracleV3 — only the demo helpers the
// UI needs to resolve a pending assertion (never used against real UMA).
export const MOCK_ORACLE_ABI = [
  {
    type: "function",
    name: "settleAssertion",
    stateMutability: "nonpayable",
    inputs: [{ name: "assertionId", type: "bytes32" }],
    outputs: [],
  },
  {
    type: "function",
    name: "disputeAndResolveFalse",
    stateMutability: "nonpayable",
    inputs: [{ name: "assertionId", type: "bytes32" }],
    outputs: [],
  },
] as const;
