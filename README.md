# BeatChain — Decentralised Music Streaming

A full-stack **Web3 music streaming platform** built on Ethereum (Sepolia testnet). Artists upload their tracks to IPFS, register them on-chain, and receive direct ETH payments and tips from fans — with zero intermediaries. Fans can also collect exclusive music NFTs.

---

## Architecture Overview

```
Decentralised_music_streaming/
├── blockchain/          # Hardhat 3 project (smart contracts + tests + deploy)
│   ├── contracts/
│   │   ├── MusicRegistry.sol   # On-chain music catalog
│   │   ├── Payment.sol         # Tips & per-stream micro-payments
│   │   └── MusicNFT.sol        # ERC-721 collectibles with ERC-2981 royalties
│   ├── scripts/
│   │   └── deploy.ts           # Sequential deployment script
│   ├── test/
│   │   ├── MusicRegistry.ts
│   │   ├── Payment.ts
│   │   └── MusicNFT.ts
│   └── hardhat.config.ts
└── frontend/            # Next.js 16 + Tailwind CSS frontend
    └── src/
        ├── app/         # Pages: /, /explore, /dashboard, /profile, /track
        ├── components/  # AudioPlayer, Navbar, TrackCard
        ├── context/     # AudioPlayerContext (global audio state)
        └── lib/
            ├── web3.ts         # MetaMask / BrowserProvider integration
            ├── contracts.ts    # Contract factory helpers
            ├── ipfs.ts         # Pinata upload & Cloudflare IPFS gateway
            └── abis/           # Compiled JSON ABIs
```

---

## Smart Contracts

| Contract | Description |
|---|---|
| **MusicRegistry** | On-chain catalog of tracks. Artists call `uploadTrack()` with IPFS CIDs; anyone can call `incrementPlayCount()`. |
| **Payment** | Accepts ETH via `tipArtist()` and `streamPayment()`. Artists `withdrawEarnings()` at will. Protected by OpenZeppelin `ReentrancyGuard`. |
| **MusicNFT** | ERC-721 collectible NFTs linked to registry tracks. Implements ERC-2981 royalty standard. Artists mint with `mintCollectible()`. |

> **Security:** `Payment` uses the checks-effects-interactions pattern alongside `ReentrancyGuard`. `MusicNFT` verifies track ownership via the registry before minting.

---

## Tech Stack

**Blockchain**
- [Hardhat 3 Beta](https://hardhat.org/docs/getting-started) — build, test, deploy
- Solidity `^0.8.28`
- OpenZeppelin Contracts `^5.6.1` (ERC-721, ERC-2981, ReentrancyGuard)
- ethers.js `^6`
- Mocha + Chai (TypeScript integration tests)

**Frontend**
- Next.js `16` (App Router)
- React `19`
- Tailwind CSS `^4`
- ethers.js `^6` — wallet & contract interactions
- Pinata SDK — IPFS uploads
- MetaMask — browser wallet (Sepolia testnet)

---

## Getting Started

### Prerequisites

- Node.js `>=18`
- npm `>=9`
- [MetaMask](https://metamask.io/) browser extension
- A Sepolia RPC URL (e.g., from [Alchemy](https://alchemy.com) or [Infura](https://infura.io))
- A [Pinata](https://app.pinata.cloud/) account for IPFS uploads (free tier works)

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
# Run all tests (Solidity + Mocha)
npx hardhat test

# Run only TypeScript/Mocha tests
npx hardhat test mocha

# Run only Solidity tests
npx hardhat test solidity
```

#### Deploy Contracts

**Local (simulated chain):**
```bash
npx hardhat run scripts/deploy.ts
```

**Sepolia Testnet:**
```bash
npx hardhat run scripts/deploy.ts --network sepolia
```

After deployment you will see a summary like:
```
✅ MusicRegistry deployed to: 0x...
✅ Payment deployed to:       0x...
✅ MusicNFT deployed to:      0x...
```

> **Copy these addresses** — you'll need them for the frontend `.env`.

---

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

Copy the environment file:

```bash
cp .env.example .env.local
```

Edit `frontend/.env.local` with the contract addresses from the deployment step and your Pinata JWT:

```
NEXT_PUBLIC_MUSIC_REGISTRY_ADDRESS=0x...
NEXT_PUBLIC_PAYMENT_ADDRESS=0x...
NEXT_PUBLIC_MUSIC_NFT_ADDRESS=0x...
NEXT_PUBLIC_PINATA_JWT=eyJ...
```

#### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Application Pages

| Route | Description |
|---|---|
| `/` | Landing page — hero, features overview |
| `/explore` | Browse all tracks registered on-chain |
| `/dashboard` | Artist dashboard — upload tracks, mint NFTs, view earnings |
| `/profile` | View your uploaded tracks and NFT collectibles |
| `/track/[id]` | Individual track page — stream, tip artist, pay per-stream |

---

## Running Tests

All tests are located in `blockchain/test/`.

```bash
cd blockchain

# Full test suite
npx hardhat test

# Individual contract tests
npx hardhat test mocha --grep "MusicRegistry"
npx hardhat test mocha --grep "Payment"
npx hardhat test mocha --grep "MusicNFT"
```

Test coverage includes:
- Track upload validation (empty field guards)
- Play count incrementing
- Tip and stream payment flows
- Reentrancy attack prevention
- NFT minting, royalty setting, and burning
- Access control (only track owners can mint NFTs)

---

## Environment Variables Reference

### `blockchain/.env`

| Variable | Description |
|---|---|
| `SEPOLIA_RPC_URL` | RPC endpoint for Sepolia (Alchemy/Infura) |
| `SEPOLIA_PRIVATE_KEY` | Private key of deployer wallet (with `0x` prefix) |

### `frontend/.env.local`

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_MUSIC_REGISTRY_ADDRESS` | Deployed MusicRegistry contract address |
| `NEXT_PUBLIC_PAYMENT_ADDRESS` | Deployed Payment contract address |
| `NEXT_PUBLIC_MUSIC_NFT_ADDRESS` | Deployed MusicNFT contract address |
| `NEXT_PUBLIC_PINATA_JWT` | Pinata JWT token for IPFS uploads |

---

