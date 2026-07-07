"use client";

import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import type { Address } from "viem";
import { PULLPAY_ESCROW_ABI } from "@/lib/contracts/PullPayEscrow";
import { ERC20_ABI } from "@/lib/contracts/erc20";
import {
  ESCROW_ADDRESS,
  USDC_ADDRESS,
  USDC_DECIMALS,
} from "@/lib/contracts/addresses";

/** Connected wallet's USDC balance (raw bigint + decimals). */
export function useUsdcBalance() {
  const { address } = useAccount();
  const query = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) },
  });
  return { ...query, decimals: USDC_DECIMALS };
}

/** Current USDC allowance the wallet has granted the escrow. */
export function useAllowance() {
  const { address } = useAccount();
  return useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address ? [address, ESCROW_ADDRESS] : undefined,
    query: { enabled: Boolean(address) },
  });
}

/** Approve the escrow to pull `amount` USDC (approve → createReward, PRD §8.1). */
export function useApproveUsdc() {
  const { writeContractAsync, data: hash, isPending } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash });

  const approve = (amount: bigint) =>
    writeContractAsync({
      address: USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [ESCROW_ADDRESS, amount],
    });

  return {
    approve,
    hash,
    isApproving: isPending || receipt.isLoading,
    isApproved: receipt.isSuccess,
  };
}

export interface CreateRewardArgs {
  id: `0x${string}`;
  token: Address;
  amount: bigint;
  bond: bigint;
  repo: string;
  issueNumber: bigint;
  criteriaHash: `0x${string}`;
  mode: number;
  deadline: bigint;
}

export function useCreateReward() {
  const { writeContractAsync, data: hash, isPending } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash });

  const createReward = (a: CreateRewardArgs) =>
    writeContractAsync({
      address: ESCROW_ADDRESS,
      abi: PULLPAY_ESCROW_ABI,
      functionName: "createReward",
      args: [
        a.id,
        a.token,
        a.amount,
        a.bond,
        a.repo,
        a.issueNumber,
        a.criteriaHash,
        a.mode,
        a.deadline,
      ],
    });

  return {
    createReward,
    hash,
    isCreating: isPending || receipt.isLoading,
    isCreated: receipt.isSuccess,
  };
}

/** On-chain reward record (getReward view, PRD §28.3). */
export function useReward(id?: `0x${string}`) {
  return useReadContract({
    address: ESCROW_ADDRESS,
    abi: PULLPAY_ESCROW_ABI,
    functionName: "getReward",
    args: id ? [id] : undefined,
    query: { enabled: Boolean(id) },
  });
}

/** Full on-chain record incl. mode / bond / assertionId / contributor. */
export function useRewardFull(id?: `0x${string}`) {
  return useReadContract({
    address: ESCROW_ADDRESS,
    abi: PULLPAY_ESCROW_ABI,
    functionName: "rewards",
    args: id ? [id] : undefined,
    query: { enabled: Boolean(id) },
  });
}

/** Contributor escalates a stalled Instant reward to UMA (PRD §24.3). */
export function useEscalate() {
  const { writeContractAsync, data: hash, isPending } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash });
  const escalate = (id: `0x${string}`, claim: `0x${string}`) =>
    writeContractAsync({
      address: ESCROW_ADDRESS,
      abi: PULLPAY_ESCROW_ABI,
      functionName: "escalateToUMA",
      args: [id, claim],
    });
  return { escalate, hash, isEscalating: isPending || receipt.isLoading };
}

/** Maintainer refund after deadline (PRD §19.4). */
export function useRefund() {
  const { writeContractAsync, data: hash, isPending } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash });
  const refund = (id: `0x${string}`) =>
    writeContractAsync({
      address: ESCROW_ADDRESS,
      abi: PULLPAY_ESCROW_ABI,
      functionName: "refund",
      args: [id],
    });
  return { refund, hash, isRefunding: isPending || receipt.isLoading };
}

/** Instant Path A — maintainer approves + releases directly (PRD §24.3). */
export function useApproveAndRelease() {
  const { writeContractAsync, data: hash, isPending } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash });
  const approveAndRelease = (id: `0x${string}`, contributor: Address) =>
    writeContractAsync({
      address: ESCROW_ADDRESS,
      abi: PULLPAY_ESCROW_ABI,
      functionName: "approveAndRelease",
      args: [id, contributor],
    });
  return {
    approveAndRelease,
    hash,
    isReleasing: isPending || receipt.isLoading,
  };
}
