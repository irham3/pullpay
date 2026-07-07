import { keccak256, encodePacked, toHex, stringToHex } from "viem";

// Deterministic reward id bound to a repo+issue (PRD §28.4): anyone can recompute
// it from the GitHub issue and look up the on-chain record 1:1 — anti-spoofing.
export function computeRewardId(
  repo: string,
  issueNumber: number | bigint,
  nonce: bigint = BigInt(Date.now())
): `0x${string}` {
  return keccak256(
    encodePacked(
      ["string", "uint256", "uint256"],
      [repo, BigInt(issueNumber), nonce]
    )
  );
}

// Hash of the acceptance criteria (issue body / IPFS spec) bound into the reward.
export function criteriaHashFrom(criteria: string): `0x${string}` {
  if (!criteria.trim()) return toHex(new Uint8Array(32)); // bytes32(0)
  return keccak256(stringToHex(criteria));
}

// The structured UMA claim string (PRD §11) the relayer/contributor asserts.
export function buildClaim(params: {
  pr: number;
  repo: string;
  issue: number;
  rewardId: string;
  contributor: string;
}): string {
  const { pr, repo, issue, rewardId, contributor } = params;
  return (
    `PR #${pr} in repo ${repo} has been merged into the default branch ` +
    `AND resolves Issue #${issue} per the reward description ${rewardId}. ` +
    `The rightful recipient is ${contributor}.`
  );
}
