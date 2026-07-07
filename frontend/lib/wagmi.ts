import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { foundry, optimism, optimismSepolia } from "wagmi/chains";
import { cookieStorage, createStorage } from "wagmi";
import type { Chain } from "viem";

const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 11155420);

// Put the active chain first so disconnected reads default to it. Include the
// local foundry chain only when targeting anvil (id 31337).
const chains: readonly [Chain, ...Chain[]] =
  CHAIN_ID === 31337
    ? [foundry, optimismSepolia, optimism]
    : [optimismSepolia, optimism];

// Single source of truth for the Web3 stack (PRD §29.3 / §30).
// SSR-safe via cookieStorage so wallet state hydrates without a mismatch.
export const config = getDefaultConfig({
  appName: "PullPay",
  projectId:
    process.env.NEXT_PUBLIC_WC_PROJECT_ID || "3251a2ac5ccda8f02540b616ecac4b24",
  chains,
  ssr: true,
  storage: createStorage({ storage: cookieStorage }),
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
