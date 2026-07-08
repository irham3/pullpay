"use client";

import * as React from "react";
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatUnits } from "viem";
import { PULLPAY_ESCROW_ABI } from "@/lib/contracts/PullPayEscrow";
import { MOCK_ORACLE_ABI } from "@/lib/contracts/mockOracle";
import {
  ESCROW_ADDRESS,
  UMA_ADDRESS,
  USDC_DECIMALS,
  DEMO_MODE,
} from "@/lib/contracts/addresses";
import { CONTRACT_STATUS, contractStatusToUi } from "@/lib/status";
import type { Bounty, Mode } from "@/lib/types";
import { getLocalReward } from "@/lib/localStore";

type FullRecord = readonly [
  `0x${string}`, // maintainer
  `0x${string}`, // token
  bigint, // amount
  bigint, // bond
  string, // repo
  bigint, // issueNumber
  `0x${string}`, // criteriaHash
  number, // mode
  bigint, // deadline
  `0x${string}`, // assertionId
  `0x${string}`, // contributor
  number, // status
];

const ZERO = "0x0000000000000000000000000000000000000000";

// Resolve a bounty by id across three sources: demo mock → local created cache →
// live on-chain (getReward / rewards). Returns a unified Bounty for the UI.
export function useBounty(id: `0x${string}`) {
  const [local, setLocal] = React.useState<Bounty | undefined>(undefined);
  const [mountTs, setMountTs] = React.useState(0);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read local cache + clock on mount
    setLocal(getLocalReward(id));
    setMountTs(Math.floor(Date.now() / 1000));
  }, [id]);

  const onchain = useReadContract({
    address: ESCROW_ADDRESS,
    abi: PULLPAY_ESCROW_ABI,
    functionName: "rewards",
    args: [id],
    query: { enabled: !DEMO_MODE },
  });

  const bounty = React.useMemo<Bounty | undefined>(() => {
    const rec = onchain.data as FullRecord | undefined;
    const onchainExists = rec && rec[0] !== ZERO;

    if (onchainExists && rec) {
      const contractStatus = CONTRACT_STATUS[rec[11]] ?? "Funded";
      const merged: Bounty = {
        id,
        repo: rec[4] || local?.repo || "unknown/repo",
        issueNumber: Number(rec[5]),
        issueTitle: local?.issueTitle || `${rec[4]} #${Number(rec[5])}`,
        amount: Number(formatUnits(rec[2], USDC_DECIMALS)),
        bond: Number(formatUnits(rec[3], USDC_DECIMALS)),
        token: "USDC",
        maintainer: rec[0],
        contributor: rec[10] !== ZERO ? rec[10] : undefined,
        contributorHandle: local?.contributorHandle,
        mode: (rec[7] === 0 ? "Instant" : "Safeguarded") as Mode,
        status: contractStatusToUi(contractStatus),
        deadline: Number(rec[8]),
        createdAt: local?.createdAt ?? mountTs,
        language: local?.language || "TypeScript",
        labels: local?.labels || [],
        fundingTx: local?.fundingTx || ("0x" as `0x${string}`),
        prNumber: local?.prNumber,
      };
      return merged;
    }

    return local;
  }, [onchain.data, local, id, mountTs]);

  const assertionId =
    (onchain.data as FullRecord | undefined)?.[9] ??
    ("0x" as `0x${string}`);

  return {
    bounty,
    assertionId,
    isLoading: !DEMO_MODE && onchain.isLoading,
    refetch: onchain.refetch,
    isOnchain: Boolean((onchain.data as FullRecord | undefined)?.[0] && (onchain.data as FullRecord)[0] !== ZERO),
  };
}

/** Demo-only: resolve a pending assertion via the local MockOptimisticOracle. */
export function useResolveAssertion() {
  const { writeContractAsync, data: hash, isPending } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash });
  const resolve = (assertionId: `0x${string}`, truthfully: boolean) =>
    writeContractAsync({
      address: UMA_ADDRESS,
      abi: MOCK_ORACLE_ABI,
      functionName: truthfully ? "settleAssertion" : "disputeAndResolveFalse",
      args: [assertionId],
    });
  return { resolve, hash, isResolving: isPending || receipt.isLoading };
}
