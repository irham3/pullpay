<p align="center">
  <h1 align="center">PullPay</h1>
  <p align="center">
    <strong>Trust-minimized open source rewards on Optimism.</strong><br>
    Merge the PR, the contributor gets paid in USDC — verified without an intermediary, settled without gas, and recorded as on-chain reputation.
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

The open source ecosystem runs on hundreds of small contributions (bug fixes, docs, translations, tooling). But paying a $5–20 reward is surprisingly hard: fees eat the reward, manual payouts are a hassle, and contributors have no guarantee they will actually get paid.

**PullPay** solves this with an **on-chain escrow + GitHub automation**. A maintainer locks USDC in a smart contract and adds a single workflow file to their repo. When a Pull Request (PR) is merged and verified, USDC is automatically paid to the contributor.

What makes PullPay different?

- **Decentralized Verification (UMA):** We don't just rely on a centralized bot to check `merged == true`. Anyone can dispute a payout if the PR quality is poor.
- **On-Chain Reputation (EAS):** Every paid contribution mints an attestation, creating a portable, verifiable developer CV.
- **Gasless Claims (ERC-4337):** Contributors don't need ETH. The USDC just arrives.

## How It Works

```mermaid
flowchart TD
    subgraph S1[PHASE 1 - Maintainer locks funds]
        A[Connect wallet] --> B[Create reward, link GitHub Issue]
        B --> C[Approve USDC to escrow]
        C --> D[USDC LOCKED in escrow on Optimism]
    end
    D --> F[Reward visible on-chain]
    subgraph S2[PHASE 2 - Contributor works]
        F --> G[Contributor links GitHub username -> wallet]
        G --> H[Open a Pull Request]
        H --> I{Maintainer merges?}
    end
    I -->|Close / timeout| R[Refund -> USDC back to maintainer]
    I -->|MERGE| J[GitHub Action triggered]
    subgraph S3[PHASE 3 - Verification & Payout]
        J --> K[Assert PR to UMA Optimistic Oracle]
        K --> L{Disputed within challenge window?}
        L -->|Yes| V[DVM Voting resolves the dispute]
        L -->|No| M[Claim treated as true]
        V --> M
        M --> N[Release USDC gasless to contributor]
        N --> O[EAS mints reputation attestation]
    end
```

## 🏗️ Architecture

The system is built to be trust-minimized and reliable, utilizing the best of the Optimism ecosystem.

```mermaid
flowchart LR
    subgraph OnChain[On-chain - Optimism]
        ESC[PullPayEscrow]
        UMA[UMA Optimistic Oracle V3]
        EAS[EAS Attestation]
        PM[Paymaster / EntryPoint 4337]
    end
    subgraph OffChain[Off-chain]
        GA[GitHub Actions - pullpay.yml]
        REL[Relayer / Worker]
        API[GitHub API]
    end
    FE[Frontend Next.js] --> ESC
    GA --> REL
    REL --> API
    REL --> UMA
    UMA --> ESC
    ESC --> EAS
    ESC --> PM
```

## Repository Layout

```text
contracts/               Foundry project — PullPayEscrow & WhitelistEM (Solidity)
frontend/                Next.js App Router — Web UI, dashboard, and relayer API
docs/                    Product Requirements Document (PRD) and Planning notes
```

## Quickstart

**1. Smart Contracts**

```bash
cd contracts
forge install
forge test
```

**2. Frontend & Relayer**

```bash
cd frontend
npm install
npm run dev
```

*Note: Ensure you have your environment variables set up for the RPC endpoints, UMA addresses, and EAS schema UID.*
