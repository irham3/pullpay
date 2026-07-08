<p align="center">
  <h1 align="center">PullPay</h1>
  <p align="center">
    <strong>Trust-minimized open-source rewards on Optimism.</strong><br>
    Merge the PR, the contributor gets paid in USDC — verified without an intermediary, settled securely, and recorded as on-chain reputation.
  </p>
</p>

<p align="center">
  <img alt="Optimism" src="https://img.shields.io/badge/Optimism-L2-FF0420?style=flat-square&logo=optimism&logoColor=white&labelColor=0B0F14">
  <img alt="UMA" src="https://img.shields.io/badge/UMA-Optimistic_Oracle-FF4A4A?style=flat-square&labelColor=0B0F14">
  <img alt="EAS" src="https://img.shields.io/badge/EAS-Attestations-4285F4?style=flat-square&labelColor=0B0F14">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-App_Router-000000?style=flat-square&logo=next.js&logoColor=white&labelColor=0B0F14">
  <img alt="Solidity" src="https://img.shields.io/badge/Solidity-Smart_Contracts-363636?style=flat-square&logo=solidity&logoColor=white&labelColor=0B0F14">
</p>

## The Problem & Vision

The open-source ecosystem runs on hundreds of small contributions (bug fixes, docs, translations, tooling). But paying out small bounties ($5–20) is surprisingly hard: transaction fees eat the reward, manual payouts are a hassle for maintainers, and contributors have no guarantee they will actually get paid.

**PullPay** solves this with an **on-chain escrow + GitHub App integration**. A maintainer locks USDC in a smart contract and selects an open issue via the PullPay platform. When a contributor merges a Pull Request (PR) resolving that issue, USDC is automatically unlocked and paid to them.

What makes PullPay different?

- **Seamless GitHub Integration:** Install the PullPay GitHub App once. We automatically track merged PRs and manage the settlement securely.
- **Decentralized Verification (UMA):** We don't just blindly trust a centralized server. The payout is asserted to the UMA Optimistic Oracle, meaning anyone can dispute a payout if the PR quality is malicious or invalid.
- **On-Chain Reputation (EAS):** Every paid contribution mints an Ethereum Attestation Service (EAS) record, creating a portable, verifiable, and permanent developer CV.

## How It Works

```mermaid
flowchart TD
    subgraph S1[Maintainer Creates Reward]
        A[Connect GitHub & Wallet] --> B[Install PullPay App on Repositories]
        B --> C[Select an Issue & Lock USDC in Escrow]
        C --> D[Reward goes live on PullPay]
    end
    
    subgraph S2[Contributor Works]
        F[Contributor links GitHub -> Wallet]
        F --> G[Submit a Pull Request]
        G --> H{Maintainer merges PR?}
    end
    
    D -.-> F
    H -->|Close / Expired| R[USDC refunded to maintainer]
    H -->|MERGE| J[PullPay App Webhook Triggered]
    
    subgraph S3[Verification & Payout]
        J --> K[Assert PR resolution to UMA Oracle]
        K --> L{Disputed within challenge window?}
        L -->|Yes| V[DVM Voting resolves the dispute]
        L -->|No| M[Claim treated as valid]
        V --> M
        M --> N[Release USDC to contributor]
        N --> O[EAS mints reputation attestation]
    end
```

## Core Features

1. **GitHub App Native:** No need to manually add `.yml` files to every repository. Just install the PullPay GitHub App and select which repositories to enable for bounties.
2. **Trustless Escrow:** Funds are securely locked in an audited smart contract on Optimism. Maintainers cannot simply walk away with the money after the work is done, and contributors cannot drain funds with spam PRs due to the UMA challenge window.
3. **Automated Settlement:** The system listens for GitHub Webhooks and proposes the settlement on-chain automatically.
4. **Reputation Building:** Get recognized for your open-source work. Each successful bounty yields an EAS attestation tied to your wallet address.

## Architecture

The system is built to be trust-minimized and reliable, utilizing the best of the Optimism ecosystem.

```mermaid
flowchart LR
    subgraph OnChain[On-chain - Optimism]
        ESC[PullPayEscrow]
        UMA[UMA Optimistic Oracle]
        EAS[EAS Attestation]
    end
    subgraph OffChain[Off-chain]
        GH[PullPay GitHub App]
        API[Next.js Backend / Relayer]
        UI[Web Frontend]
    end
    UI --> ESC
    GH --> API
    API --> UMA
    UMA --> ESC
    ESC --> EAS
```

## Repository Layout

```text
contracts/               Foundry project — Smart contracts including PullPayEscrow (Solidity)
frontend/                Next.js App Router — Web UI, dashboard, API routes, and GitHub Webhooks
docs/                    Product documentation and planning notes
```

## Quickstart

**1. Smart Contracts**

```bash
cd contracts
forge install
forge build
forge test
```

**2. Frontend & Relayer**

Ensure you have your environment variables set up in `frontend/.env.local` for the RPC endpoints, UMA addresses, GitHub App credentials, and EAS schema UID.

```bash
cd frontend
npm install
npm run dev
```

*Note: You must have a configured GitHub App with Webhook access to fully run the local development server.*
