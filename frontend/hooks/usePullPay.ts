import { useWriteContract, useReadContract } from 'wagmi';
import { PULLPAY_ESCROW_ABI } from '../lib/contracts/PullPayEscrow';
import { Address } from 'viem';

const ESCROW_ADDRESS = process.env.NEXT_PUBLIC_ESCROW_ADDRESS as Address;

export function useCreateReward() {
  const { writeContractAsync, isPending } = useWriteContract();

  const createReward = async (
    id: `0x${string}`,
    token: Address,
    amount: bigint,
    bond: bigint,
    repo: string,
    issueNumber: bigint,
    criteriaHash: `0x${string}`,
    mode: number,
    deadline: bigint
  ) => {
    return await writeContractAsync({
      address: ESCROW_ADDRESS,
      abi: PULLPAY_ESCROW_ABI,
      functionName: 'createReward',
      args: [id, token, amount, bond, repo, issueNumber, criteriaHash, mode, deadline],
    });
  };

  return { createReward, isCreating: isPending };
}

export function useGetReward(id: `0x${string}`) {
  return useReadContract({
    address: ESCROW_ADDRESS,
    abi: PULLPAY_ESCROW_ABI,
    functionName: 'getReward',
    args: [id],
  });
}
