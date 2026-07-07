# PullPay — Web

Next.js 16 (App Router) frontend for PullPay: trust-minimized open source rewards
on Optimism. Implements the PRD (`docs/PRD.md`) and design system (`docs/DESIGN.md`).

## Stack

- **Next.js 16** App Router + **React 19** + TypeScript
- **wagmi v3 + viem + RainbowKit** for wallet/chain (SSR-safe, cookie storage)
- **Tailwind CSS v4** with the CSS-first token theme from `DESIGN.md`
- **Geist / Geist Mono** fonts; **lucide-react** icons

## Pages

| Route | What |
| --- | --- |
| `/` | Landing — hero (CountUp stats), differentiation (UMA/EAS/gasless), how-it-works, tiers, contributor protection |
| `/bounties` | Public bounty board (ISR) with search + status/mode/language filters |
| `/reward/[id]` | Reward detail — Proof of Funding, lifecycle stepper, dispute panel, role-aware actions |
| `/create` | Fund a reward — approve → createReward, Instant/Safeguarded, live reward-ID preview |
| `/dashboard` | Your funded / earned rewards + USDC balance |
| `/profile/[address]` | Contributor reputation built from EAS attestations |

## Getting started

```bash
npm install
cp .env.example .env      # fill NEXT_PUBLIC_ESCROW_ADDRESS once deployed
npm run dev               # http://localhost:3000
```

### Demo mode

When `NEXT_PUBLIC_ESCROW_ADDRESS` is unset (or the zero address), the app runs in
**demo mode**: pages render against sample on-chain data (`lib/mock.ts`) and the
create flow simulates the approve → createReward transactions. Set a deployed
escrow address to switch to live contract reads/writes.

## Full local E2E (anvil)

Runs the whole loop — fund → verify merge → pay → attest — with no faucet, using
mock USDC/UMA/EAS contracts.

```bash
# 1. Chain + contracts
cd contracts
forge test                      # 15 tests, full lifecycle
anvil                           # keep running in another terminal
forge script script/DeployLocal.s.sol:DeployLocal \
  --rpc-url http://127.0.0.1:8545 --broadcast \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
# copy the printed MockUSDC / MockUMA / PullPayEscrow addresses

# 2. Frontend + relayer (one Next.js app)
cd ../frontend
# create .env.local with CHAIN_ID=31337 + the addresses above +
#   RELAYER_PRIVATE_KEY=0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
#   RELAYER_RPC_URL=http://127.0.0.1:8545   GITHUB_WEBHOOK_SECRET=
npm run dev
```

Then either fund a reward in the UI (`/create`) or drive the relayer directly —
it re-verifies the merge on GitHub before paying:

```bash
curl -X POST http://localhost:3000/api/settle -H 'Content-Type: application/json' \
  -d '{"rewardId":"0x…","repo":"wevm/viem","pr":3,"issue":1,"contributor":"0x…"}'
# → { ok: true, action: "settleInstant", txHash: "0x…" }  (contributor paid)
```

The relayer refuses unmerged PRs (`{"error":"PR is not merged"}`) — the GitHub
verification gate is what turns "merge" into "paid".

### Which contract path runs when

| Path | Trigger | Function |
| --- | --- | --- |
| Instant (maintainer trust) | Maintainer clicks release | `approveAndRelease` |
| Instant (relayer) | Merged PR → `pullpay.yml` → `/api/settle` | `settleInstant` |
| Safeguarded (UMA) | Merged PR, pooled/sponsor funds | `assertMerge` → oracle → callback |
| Refund | Deadline passes, unclaimed | `refund` |

## Structure

```
app/                      routes (marketing + app) + layout, providers
components/
  ui/                     Button, Card, Input, StatusPill, SegmentedControl, Badge, CountUp…
  layout/                 Header, Footer, ConnectButton, ThemeToggle, NetworkBanner
  bounty/                 BountyCard, BountyBoard (filters)
  onchain/                ProofPanel, Lifecycle, DisputePanel, RewardActions, AddressChip…
hooks/                    usePullPay (contract writes/reads), useNetworkGuard
lib/                      wagmi, contracts (ABIs + addresses), status model, format, mock data
```

## Scripts

- `npm run dev` — dev server (Turbopack)
- `npm run build` — production build
- `npm run lint` — ESLint
