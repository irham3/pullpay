'use client'
import { useAccount, useSwitchChain } from 'wagmi'
import { optimismSepolia } from 'viem/chains'

export function useNetworkGuard() {
  const { chainId, isConnected } = useAccount()
  const { switchChain } = useSwitchChain()
  
  const wrongNetwork = isConnected && chainId !== optimismSepolia.id // 11155420
  
  return { 
    wrongNetwork, 
    fixNetwork: () => switchChain({ chainId: optimismSepolia.id }) 
  }
}
