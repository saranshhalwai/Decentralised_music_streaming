# BeatChain — Decentralised Music Streaming

A full-stack **Web3 music streaming platform** built on Ethereum (Sepolia testnet). Artists upload their tracks to IPFS, register them on-chain, and receive direct ETH payments and tips from fans — with zero intermediaries. Fans can also collect exclusive music NFTs and participate in community governance via the BEAT token.

---

## Architecture Overview

```
Decentralised_music_streaming/
├── blockchain/          # Hardhat 3 project (smart contracts + tests + deploy)
│   ├── contracts/
│   │   ├── MusicRegistry.sol     # On-chain music catalog & Artist rewards
│   │   ├── Payment.sol           # Tips & per-stream micro-payments
│   │   ├── MusicNFT.sol          # ERC-721 collectibles with ERC-2981 royalties
│   │   ├── BeatToken.sol         # ERC-20 Governance token (BEAT)
│   │   ├── DisputeResolution.sol # Community governance for copyright claims
│   │   └── SharedOwnership.sol   # Revenue sharing for multiple stakeholders
│   ├── scripts/
│   │   └── deploy.ts             # Sequential deployment script
│   ├── test/                     # Integrated test suite
│   └── hardhat.config.ts
└── frontend/            # Next.js 16 + Tailwind CSS frontend
    └── src/
        ├── app/         # Pages: /, /explore, /dashboard, /profile, /track, /dispute
        ├── components/  # AudioPlayer, Navbar, TrackCard
        ├── context/     # AudioPlayerContext (global audio state)
        └── lib/
            ├── web3.ts         # MetaMask / BrowserProvider integration
            ├── contracts.ts    # Contract factory helpers
            ├── ipfs.ts         # Pinata upload & IPFS gateway fallback
            └── abis/           # Compiled JSON ABIs
```

---

## Smart Contracts

| Contract | Description |
|---|---|
| **MusicRegistry** | On-chain catalog of tracks. Rewards artists with **100 BEAT** per upload. |
| **Payment** | Accepts ETH via `tipArtist()` and `streamPayment()`. Handles revenue distribution via `SharedOwnership`. |
| **MusicNFT** | ERC-721 collectible NFTs linked to tracks. Implements ERC-2981 royalties. |
| **BeatToken** | ERC-20 governance token (BEAT). Uses `ERC20Votes` for delegated community voting. Includes a 1,000 BEAT faucet. |
| **DisputeResolution** | Community-led copyright enforcement. Holders vote with BEAT to resolve ownership claims. |

---

## Token Ecosystem (BEAT)

BeatChain features a native utility and governance token called **BEAT**.

*   **Earning:** Artists earn 100 BEAT automatically for every track published.
*   **Testing:** New users can claim a one-time faucet of **1,000 BEAT** on their Profile page.
*   **Governance:** BEAT holders can vote on active disputes.
*   **Activation:** To vote, you must **delegate** your tokens to yourself on the Profile page to activate your "Voting Power".

---

## Tech Stack

**Blockchain**
- [Hardhat 3 Beta](https://hardhat.org/docs/getting-started) — build, test, deploy
- Solidity `^0.8.28`
- OpenZeppelin Contracts `^5.6.1` (ERC-721, ERC-20, ERC-2981, ERC20Votes, ReentrancyGuard)
- ethers.js `^6`
- Mocha + Chai (TypeScript integration tests)

**Frontend**
- Next.js `16` (App Router)
- React `19`
- Tailwind CSS `^4`
- ethers.js `^6` — wallet & contract interactions
- Pinata SDK — IPFS uploads
- Lucide React — Iconography

---

## Getting Started

### Prerequisites

- Node.js `>=18`
- npm `>=9`
- [MetaMask](https://metamask.io/) browser extension
- A Sepolia RPC URL (e.g., from [Alchemy](https://alchemy.com) or [Infura](https://infura.io))
- A [Pinata](https://app.pinata.cloud/) account for IPFS uploads

---

### 1. Clone the Repository

```bash
git clone https://github.com/saranshhalwai/Decentralised_music_streaming.git
cd Decentralised_music_streaming
```

---

### 2. Blockchain Setup

```bash
cd blockchain
npm install
```

Copy the environment file and fill in your values:

```bash
cp .env.example .env
```

Edit `blockchain/.env`:

```
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
SEPOLIA_PRIVATE_KEY=0xYOUR_WALLET_PRIVATE_KEY
```

#### Run Tests

```bash
npx hardhat test
```

#### Deploy Contracts

```bash
npx hardhat run scripts/deploy.ts --network sepolia
```

> **Important:** Save the addresses from the console output to your frontend `.env`.

---

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

Create a `.env` file in the `frontend` directory:

```
NEXT_PUBLIC_MUSIC_REGISTRY_ADDRESS=0x...
NEXT_PUBLIC_PAYMENT_ADDRESS=0x...
NEXT_PUBLIC_MUSIC_NFT_ADDRESS=0x...
NEXT_PUBLIC_BEAT_TOKEN_ADDRESS=0x...
NEXT_PUBLIC_DISPUTE_RESOLUTION_ADDRESS=0x...
NEXT_PUBLIC_SHARED_OWNERSHIP_ADDRESS=0x...
NEXT_PUBLIC_MUSIC_NFT_MARKETPLACE_ADDRESS=0x...

NEXT_PUBLIC_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
NEXT_PUBLIC_CHAIN_ID=0xaa36a7
NEXT_PUBLIC_IPFS_GATEWAY=your-pinata-gateway.mypinata.cloud
NEXT_PUBLIC_PINATA_JWT=eyJ...
```

#### Run Development Server

```bash
npm run dev
```

---

## Application Pages

| Route | Description |
|---|---|
| `/` | Landing page — platform features |
| `/explore` | Browse all tracks registered on-chain |
| `/dashboard` | Artist hub — upload tracks, mint NFTs, view earnings |
| `/profile` | Claim BEAT faucet, activate voting power, view your collection |
| `/dispute` | Community governance — vote on active copyright claims |
| `/track/[id]` | Track details — stream, tip artist, pay per-stream |

---

## Governance & Disputes

If a track is suspected of copyright infringement, users can file a dispute on-chain.
1.  **Voting:** Community members use their "Voting Power" (activated BEAT tokens) to support the Claimant or the Respondent.
2.  **Resolution:** After the voting deadline, anyone can trigger `resolveDispute()`.
3.  **Outcome:** If the community accepts the claim, ownership of the track is automatically transferred to the Claimant in the registry.

---
