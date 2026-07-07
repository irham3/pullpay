export const PULLPAY_ESCROW_ABI = [
  {
    type: "function",
    name: "createReward",
    inputs: [
      { name: "id", type: "bytes32" },
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "bond", type: "uint256" },
      { name: "repo", type: "string" },
      { name: "issueNumber", type: "uint256" },
      { name: "criteriaHash", type: "bytes32" },
      { name: "mode", type: "uint8" },
      { name: "deadline", type: "uint256" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "getReward",
    inputs: [{ name: "id", type: "bytes32" }],
    outputs: [
      { name: "maintainer", type: "address" },
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "repo", type: "string" },
      { name: "issueNumber", type: "uint256" },
      { name: "status", type: "uint8" },
      { name: "deadline", type: "uint256" }
    ],
    stateMutability: "view"
  }
] as const;
