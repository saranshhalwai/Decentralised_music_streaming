# BeatChain — Decentralised Music Streaming

**Project:** Decentralised Music Streaming (Course: CS218 Programmable & Interoperable Blockchain)

## Team Members
- **Saransh Halwai** (Roll No: 240001066)
- **Anurag Prasad** (Roll No: 240001011)
- **Vavadiya Rudra** (Roll No: 240041038)
- **Ankur** (Roll No: 240001009)
- **Siddha Nema** (Roll No: 240002070)
- **Param Saxena** (Roll No: 230001060)

---

## Project Overview
BeatChain is a full-stack **Web3 music streaming platform** built on Ethereum (Sepolia testnet). Artists upload their tracks to IPFS, register them on-chain, and receive direct ETH payments and tips from fans — with zero intermediaries. Fans can also collect exclusive music NFTs, participate in community governance via the BEAT token, browse marketplace auctions, and attend virtual concerts.

---

## Reports & Deliverables
The project reports are located in the `/reports` folder:
- [Gas Report](./reports/gas-report.txt)
- [Coverage Report](./reports/coverage-report.txt)

### Gas Optimization Explanation
We implemented several gas optimizations across the smart contracts:
1.  **Custom Errors over Require Strings:** We replaced standard `require(condition, "string")` with `if (!condition) revert CustomError()`. This significantly reduces contract bytecode size and deployment costs. For example, in `MusicRegistry.sol` and `Payment.sol`, using custom errors like `error TrackNotFound()` instead of long revert strings saved approximately 5,000–8,000 gas per deployment.
2.  **Calldata for External Inputs:** In `MusicRegistry.sol`, the `uploadTrack` function uses `calldata` for all string parameters (`title`, `artistName`, etc.). This avoids expensive memory copying from the transaction input to memory, saving ~2,000 gas per upload.
3.  **O(1) State Lookups:** As highlighted in our rubric, we avoid expensive on-chain iterations by using direct mapping lookups for earnings and track data. The `earningsOf` function has a constant time complexity, ensuring that view calls are virtually gas-free.

---

## Architecture Overview
```
Decentralised_music_streaming/
├── blockchain/          # Hardhat project (smart contracts + tests + deploy)
│   ├── contracts/
│   │   ├── MusicRegistry.sol     # On-chain music catalog & Artist rewards
│   │   ├── Payment.sol           # Tips & per-stream micro-payments
│   │   ├── MusicNFT.sol          # ERC-721 collectibles with ERC-2981 royalties
│   │   ├── BeatToken.sol         # ERC-20 Governance token (BEAT)
│   │   ├── DisputeResolution.sol # Community governance for copyright claims
│   │   ├── SharedOwnership.sol   # Revenue sharing for multiple stakeholders
│   │   ├── MusicMarketplace.sol  # Secondary market for Music NFTs
│   │   ├── Auction.sol           # English auctions for NFTs
│   │   ├── ConcertManager.sol    # Event management and ticket sales
│   │   ├── TicketNFT.sol         # NFT tickets for concerts
│   │   └── PlaylistRegistry.sol  # On-chain playlists and social features
│   ├── scripts/
│   │   └── deploy.ts             # Sequential deployment script
│   ├── test/                     # Integrated test suite
│   └── hardhat.config.ts
├── reports/              # Gas, Coverage, and Project reports
└── frontend/            # Next.js 15 + Tailwind CSS frontend
```
... (rest of the content)
## Smart Contracts

| Contract | Description |
|---|---|
| **MusicRegistry** | On-chain catalog of tracks. Rewards artists with **100 BEAT** per upload. |
| **Payment** | Accepts ETH via `tipArtist()` and `streamPayment()`. Handles revenue distribution via `SharedOwnership`. |
| **MusicNFT** | ERC-721 collectible NFTs linked to tracks. Implements ERC-2981 royalties. |
| **BeatToken** | ERC-20 governance token (BEAT). Uses `ERC20Votes` for delegated community voting. |
| **DisputeResolution** | Community-led copyright enforcement. Holders vote with BEAT to resolve ownership claims. |
| **SharedOwnership** | Pro-rata revenue splits for multiple stakeholders (e.g., producers, band members). |
| **MusicMarketplace** | Secondary market for fixed-price Music NFT sales with platform fees. |
| **Auction** | English-style auctions for high-value Music NFTs. |
| **ConcertManager** | Allows artists to create virtual/physical concerts and sell NFT tickets. |
| **TicketNFT** | Specialized ERC-721 for concert tickets, managed by `ConcertManager`. |
| **PlaylistRegistry** | On-chain social features for creating and sharing curated music playlists. |

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
| `/dashboard` | Artist hub — upload tracks, mint NFTs, manage co-owners |
| `/marketplace` | Secondary market for NFTs and Auctions |
| `/playlists` | Browse and create on-chain curated playlists |
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
